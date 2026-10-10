import {getFirestore, Timestamp, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

// Satu-satunya dokumen pengaturan global (bukan per-hub/per-tahun -- komplek
// ini cuma 1 instance). Nilai default dipakai kalau dokumen belum pernah
// dibuat (belum pernah di-set lewat updateSystemSettings).
const DEFAULTS = Object.freeze({
  iplDueDateDays: 10,
  internetDueDateDays: 7,
  internetExpiringSoonDays: 7,
});
const SETTINGS_REF = () => getFirestore().doc('system_settings/general');

function payload(input: unknown, fields: string[]) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Payload tidak valid.');
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some(k => !fields.includes(k))) throw new HttpsError('invalid-argument', 'Field tidak diizinkan.');
  return data;
}
function days(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 60) throw new HttpsError('invalid-argument', `${field} harus bilangan bulat 1–60.`);
  return value;
}
function version(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new HttpsError('invalid-argument', 'Versi tidak valid.');
  return value;
}
function audit(tx: Transaction, uid: string, role: string, action: string, resourceId: string, oldValue: unknown, newValue: unknown) {
  tx.create(getFirestore().collection('audit_logs').doc(), {actorId: uid, actorRole: role, action, resourceId, oldValue, newValue, createdAt: Timestamp.now()});
}

// Dipakai INTERNAL oleh fungsi lain (billing.ts, scheduler) -- BUKAN
// callable, gak lewat HttpsError wrapper karena dipanggil di tengah
// transaction orang lain. Selalu balikin nilai (default kalau dokumen
// belum ada), gak pernah throw.
export async function readSystemSettings(tx: Transaction): Promise<typeof DEFAULTS & {version: number}> {
  const data = (await tx.get(SETTINGS_REF())).data();
  return {
    iplDueDateDays: data?.iplDueDateDays ?? DEFAULTS.iplDueDateDays,
    internetDueDateDays: data?.internetDueDateDays ?? DEFAULTS.internetDueDateDays,
    internetExpiringSoonDays: data?.internetExpiringSoonDays ?? DEFAULTS.internetExpiringSoonDays,
    version: data?.version ?? 0,
  };
}

// Siapa pun yang login boleh baca (client butuh ini buat nampilin
// "jatuh tempo X hari lagi" dsb).
export async function getSystemSettings(uid: string, input: unknown) {
  payload(input, []);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const user = (await tx.get(db.doc(`users/${uid}`))).data();
    if (user?.active !== true) throw new HttpsError('permission-denied', 'Akun tidak aktif.');
    return readSystemSettings(tx);
  });
}

// SUPER_ADMIN SAJA (bukan committee) -- ini pengaturan global yang
// mempengaruhi SEMUA rumah, lebih sensitif dari operasional harian biasa.
export async function updateSystemSettings(uid: string, input: unknown) {
  const d = payload(input, ['iplDueDateDays', 'internetDueDateDays', 'internetExpiringSoonDays', 'expectedVersion']);
  const iplDueDateDays = days(d.iplDueDateDays, 'iplDueDateDays');
  const internetDueDateDays = days(d.internetDueDateDays, 'internetDueDateDays');
  const internetExpiringSoonDays = days(d.internetExpiringSoonDays, 'internetExpiringSoonDays');
  const expectedVersion = version(d.expectedVersion);
  const db = getFirestore(), ref = SETTINGS_REF();
  return db.runTransaction(async tx => {
    const user = (await tx.get(db.doc(`users/${uid}`))).data();
    if (user?.active !== true || user?.role !== 'super_admin') throw new HttpsError('permission-denied', 'Hanya Super Admin yang dapat mengubah pengaturan sistem.');
    const existing = (await tx.get(ref)).data();
    if ((existing?.version ?? 0) !== expectedVersion) throw new HttpsError('failed-precondition', 'Pengaturan sudah diubah; muat ulang.');
    const now = Timestamp.now(), newVersion = expectedVersion + 1;
    const next = {iplDueDateDays, internetDueDateDays, internetExpiringSoonDays, version: newVersion, updatedAt: now, updatedBy: uid};
    tx.set(ref, next);
    audit(tx, uid, user!.role, 'UPDATE_SYSTEM_SETTINGS', 'general', existing ?? null, next);
    return next;
  });
}
