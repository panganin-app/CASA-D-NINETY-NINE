import {FieldPath, getFirestore, Timestamp, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {readSystemSettings} from './system-settings';

function payload(input: unknown, fields: string[]) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Payload tidak valid.');
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some(k => !fields.includes(k))) throw new HttpsError('invalid-argument', 'Field tidak diizinkan.');
  return data;
}
function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(value)) throw new HttpsError('invalid-argument', 'ID tidak valid.');
  return value;
}
async function requireAdmin(tx: Transaction, uid: string) {
  const user = (await tx.get(getFirestore().doc(`users/${uid}`))).data();
  if (!user?.active || !['committee', 'super_admin'].includes(String(user.role))) throw new HttpsError('permission-denied', 'Akses pengurus diperlukan.');
  return user;
}
function audit(tx: Transaction, uid: string, role: string, action: string, resourceId: string, oldValue: unknown, newValue: unknown) {
  tx.create(getFirestore().collection('audit_logs').doc(), {actorId: uid, actorRole: role, action, resourceId, oldValue, newValue, createdAt: Timestamp.now()});
}

// Status yang boleh disentuh scanner ini -- SENGAJA cuma ACTIVE <-> EXPIRING_SOON
// <-> EXPIRED. PENDING_ACTIVATION (nunggu aktivasi manual admin, lihat
// operations.ts#activateInternetService) dan SUSPENDED/TERMINATED (status
// administratif manual) TIDAK PERNAH disentuh otomatis oleh scanner ini.
const ELIGIBLE_STATUSES = ['ACTIVE', 'EXPIRING_SOON'];

async function transitionOne(uid: string, houseId: string) {
  const db = getFirestore(), ref = db.doc(`internet_subscriptions/${houseId}`);
  return db.runTransaction(async tx => {
    const admin = await requireAdmin(tx, uid);
    const settings = await readSystemSettings(tx);
    const sub = (await tx.get(ref)).data();
    if (!sub || !(sub.activeUntil instanceof Timestamp)) throw new HttpsError('failed-precondition', 'Langganan belum siap dievaluasi.');
    if (!ELIGIBLE_STATUSES.includes(sub.status)) return {houseId, status: sub.status, changed: false};
    const now = Timestamp.now();
    const thresholdMillis = settings.internetExpiringSoonDays * 86400000;
    const remaining = sub.activeUntil.toMillis() - now.toMillis();
    const nextStatus = remaining <= 0 ? 'EXPIRED' : remaining <= thresholdMillis ? 'EXPIRING_SOON' : 'ACTIVE';
    if (nextStatus === sub.status) return {houseId, status: sub.status, changed: false};
    tx.update(ref, {status: nextStatus, updatedAt: now});
    // ID deterministik per (houseId,status) -- batch yang sama dijalankan
    // ulang (retry) gak numpuk notifikasi dobel buat transisi yang sama.
    tx.create(db.doc(`notification_outbox/internet_lifecycle_${houseId}_${nextStatus}`), {
      residentId: sub.primaryResidentId, houseId, type: `INTERNET_${nextStatus}`, status: 'PENDING', createdAt: now,
    });
    audit(tx, uid, admin!.role, 'UPDATE_INTERNET_LIFECYCLE', houseId, {status: sub.status}, {status: nextStatus});
    return {houseId, status: nextStatus, changed: true};
  });
}

// Batch manual/terjadwal (SAMA pola dengan generateMonthlyIpl di
// monthly-ipl.ts -- "bounded manual batch dulu, belum ada clock otomatis").
// Dipanggil admin ATAU scheduler (Cloud Scheduler trigger belum dipasang,
// nunggu infra production -- lihat IMPLEMENTATION_PROGRESS.md).
export async function updateInternetSubscriptionStatuses(uid: string, input: unknown) {
  const d = payload(input, ['afterId', 'limit']);
  const after = d.afterId === undefined ? null : identifier(d.afterId);
  const limit = d.limit ?? 25;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new HttpsError('invalid-argument', 'Limit 1–50.');
  const db = getFirestore();
  const page = await db.runTransaction(async tx => {
    await requireAdmin(tx, uid);
    let q = db.collection('internet_subscriptions').orderBy(FieldPath.documentId());
    if (after) q = q.startAfter(after);
    return tx.get(q.limit(limit + 1));
  });
  const docs = page.docs.slice(0, limit);
  const results = [];
  for (const doc of docs) results.push(await transitionOne(uid, doc.id));
  return {results, nextCursor: page.size > limit ? docs.at(-1)!.id : null};
}
