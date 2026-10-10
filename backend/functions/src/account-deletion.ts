import {getAuth} from 'firebase-admin/auth';
import {getFirestore, Timestamp, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

// Kebijakan penghapusan akun (keputusan Product Owner 10 Okt 2026):
// warga minta hapus akun -> akun langsung DIKUNCI (tidak bisa masuk) dan
// ditandai akan dihapus 14 hari kemudian. Selama 14 hari, pengurus bisa
// memulihkan akun. Setelah 14 hari, data pribadi akun dihapus.
export const ACCOUNT_DELETION_DAYS = 14;
const DAY_MS = 86400000;

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
function audit(tx: Transaction, uid: string, role: string | null, action: string, resourceId: string, oldValue: unknown, newValue: unknown) {
  tx.create(getFirestore().collection('audit_logs').doc(), {actorId: uid, actorRole: role, action, resourceId, oldValue, newValue, createdAt: Timestamp.now()});
}

/** Dipanggil warga sendiri dari app (Profil > Hapus akun). */
export async function requestAccountDeletion(uid: string, input: unknown) {
  payload(input, []);
  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`), residentRef = db.doc(`residents/${uid}`);
  const now = Timestamp.now();
  const purgeAfter = Timestamp.fromMillis(now.toMillis() + ACCOUNT_DELETION_DAYS * DAY_MS);
  const result = await db.runTransaction(async tx => {
    const user = (await tx.get(userRef)).data();
    if (!user || user.role !== 'resident') throw new HttpsError('permission-denied', 'Khusus akun warga.');
    if (user.deletionRequestedAt) return {alreadyRequested: true, purgeAfter: user.deletionPurgeAfter};
    tx.update(userRef, {active: false, deletionRequestedAt: now, deletionPurgeAfter: purgeAfter, updatedAt: now});
    tx.set(residentRef, {status: 'PENDING_DELETION', updatedAt: now}, {merge: true});
    audit(tx, uid, 'resident', 'ACCOUNT_DELETION_REQUESTED', uid, {active: user.active}, {purgeAfter: purgeAfter.toDate().toISOString()});
    return {alreadyRequested: false, purgeAfter};
  });
  // Kunci login di Firebase Auth juga, supaya akun tidak bisa masuk sama sekali.
  await getAuth().updateUser(uid, {disabled: true});
  return {purgeAfter: result.purgeAfter.toDate().toISOString(), alreadyRequested: result.alreadyRequested};
}

async function requireAdmin(tx: Transaction, uid: string) {
  const user = (await tx.get(getFirestore().doc(`users/${uid}`))).data();
  if (user?.active !== true || !['committee', 'super_admin'].includes(String(user.role))) throw new HttpsError('permission-denied', 'Akses pengurus diperlukan.');
  return user;
}

/** Pengurus memulihkan akun selama masih dalam masa 14 hari. */
export async function restoreAccount(uid: string, input: unknown) {
  const d = payload(input, ['residentUid', 'reason']);
  const residentUid = identifier(d.residentUid);
  const reason = typeof d.reason === 'string' ? d.reason.trim() : '';
  if (!reason) throw new HttpsError('invalid-argument', 'Alasan pemulihan wajib diisi.');
  const db = getFirestore();
  const userRef = db.doc(`users/${residentUid}`), residentRef = db.doc(`residents/${residentUid}`);
  const now = Timestamp.now();
  await db.runTransaction(async tx => {
    const admin = await requireAdmin(tx, uid);
    const user = (await tx.get(userRef)).data();
    if (!user?.deletionRequestedAt) throw new HttpsError('failed-precondition', 'Akun ini tidak dalam proses penghapusan.');
    if (user.deletionPurgeAfter.toMillis() <= now.toMillis()) throw new HttpsError('failed-precondition', 'Masa 14 hari sudah lewat; akun tidak bisa dipulihkan.');
    tx.update(userRef, {active: true, deletionRequestedAt: null, deletionPurgeAfter: null, updatedAt: now});
    tx.set(residentRef, {status: 'ACTIVE', updatedAt: now}, {merge: true});
    audit(tx, uid, admin.role, 'ACCOUNT_RESTORED', residentUid, {deletionRequestedAt: user.deletionRequestedAt}, {reason});
  });
  await getAuth().updateUser(residentUid, {disabled: false});
  return {residentUid, restored: true};
}

/** Pengurus memicu pembersihan manual (selain jadwal harian otomatis). */
export async function purgeExpiredAccounts(uid: string, input: unknown) {
  const d = payload(input, ['limit']);
  const limit = d.limit ?? 20;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new HttpsError('invalid-argument', 'Limit 1–50.');
  const db = getFirestore();
  const admin = await db.runTransaction(tx => requireAdmin(tx, uid));
  return purgeDue(limit, uid, admin.role);
}

/**
 * Hapus data pribadi akun yang sudah lewat 14 hari: akun Auth, dokumen users &
 * residents, dan notifikasi. Riwayat pembayaran & laporan TETAP disimpan sebagai
 * catatan rumah (lihat kebijakan privasi). Aman diulang: akun yang sudah hilang dilewati.
 */
export async function purgeDue(limit: number, actorId: string, actorRole: string | null) {
  const db = getFirestore();
  const due = await db.collection('users').where('deletionPurgeAfter', '<=', Timestamp.now()).limit(limit).get();

  const purged: string[] = [];
  for (const doc of due.docs) {
    const residentUid = doc.id;
    const houseId = doc.data().houseId as string | undefined;
    const notifs = await db.collection('notifications').where('residentId', '==', residentUid).get();
    const batch = db.batch();
    for (const n of notifs.docs) batch.delete(n.ref);
    batch.delete(db.doc(`residents/${residentUid}`));
    batch.delete(doc.ref);
    if (houseId) {
      const house = (await db.doc(`houses/${houseId}`).get()).data();
      if (house?.primaryResidentId === residentUid) batch.update(db.doc(`houses/${houseId}`), {primaryResidentId: null, updatedAt: Timestamp.now()});
    }
    await batch.commit();
    try {
      await getAuth().deleteUser(residentUid);
    } catch (e) {
      // Akun Auth mungkin sudah tidak ada (proses sebelumnya berhasil sebagian). Aman diabaikan.
    }
    await db.collection('audit_logs').doc().set({actorId, actorRole, action: 'ACCOUNT_PURGED', resourceId: residentUid, oldValue: null, newValue: {houseId: houseId ?? null}, createdAt: Timestamp.now()});
    purged.push(residentUid);
  }
  return {purged, count: purged.length};
}
