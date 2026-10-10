import {createHash} from 'node:crypto';
import {getFirestore, Timestamp, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {IPL_AMOUNT, INTERNET_PACKAGES, extendMonth} from './domain';

function fail(code: 'invalid-argument'|'permission-denied'|'failed-precondition'|'already-exists'|'not-found', message: string): never {
  throw new HttpsError(code, message);
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) fail('invalid-argument', 'ID tidak valid.');
  return value;
}
function object(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid-argument', 'Payload tidak valid.');
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(k => !allowed.includes(k))) fail('invalid-argument', 'Field tidak diizinkan.');
  return data;
}
function kind(value: unknown): 'ipl'|'internet' {
  if (value !== 'ipl' && value !== 'internet') fail('invalid-argument', 'Jenis tagihan tidak valid.');
  return value;
}
const hash = (...parts: string[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');
async function actor(tx: Transaction, uid: string) {
  const snap = await tx.get(getFirestore().doc(`users/${uid}`));
  const user = snap.data();
  if (!user || user.active !== true) fail('permission-denied', 'Akun tidak aktif.');
  return user;
}
function admin(user: Record<string, unknown>) {
  if (!['committee', 'super_admin'].includes(String(user.role))) fail('permission-denied', 'Akses pengurus diperlukan.');
}
function audit(tx: Transaction, uid: string, action: string, resourceId: string, details: object) {
  tx.create(getFirestore().collection('audit_logs').doc(), {actorId: uid, action, resourceId, details, createdAt: Timestamp.now()});
}

export async function createBill(uid: string, input: unknown) {
  const data = object(input, ['kind','houseId','period','packageId','requestId']);
  const type = kind(data.kind), houseId = id(data.houseId);
  const period = data.period;
  if (typeof period !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period)) fail('invalid-argument', 'Periode harus YYYY-MM.');
  const packageId = type === 'internet' ? id(data.packageId) : null;
  if (packageId && !Object.hasOwn(INTERNET_PACKAGES, packageId)) fail('invalid-argument', 'Paket tidak tersedia.');
  if (type === 'ipl' && data.packageId !== undefined) fail('invalid-argument', 'IPL tidak memakai paket.');
  const requestId = type === 'internet' ? id(data.requestId) : period;
  const billId = hash(type, houseId, requestId);
  const db = getFirestore(), ref = db.doc(`${type}_bills/${billId}`);
  return db.runTransaction(async tx => {
    const user = await actor(tx, uid);
    if (type === 'ipl') admin(user);
    const house = (await tx.get(db.doc(`houses/${houseId}`))).data();
    if (!house || house.active !== true) fail('failed-precondition', 'Rumah tidak aktif.');
    if (type === 'internet' && (user.houseId !== houseId || house.primaryResidentId !== uid)) {
      fail('permission-denied', 'Hanya kepala keluarga rumah ini dapat membuat tagihan internet.');
    }
    const primary = (await tx.get(db.doc(`users/${id(house.primaryResidentId)}`))).data();
    if (!primary || primary.active !== true || primary.houseId !== houseId) fail('failed-precondition', 'Kepala keluarga tidak valid.');
    const existing = (await tx.get(ref)).data();
    if (existing) {
      if (existing.period !== period || existing.packageId !== packageId) fail('already-exists', 'Request ID sudah dipakai untuk tagihan berbeda.');
      return {billId, ...existing};
    }
    const openRef = db.doc(`internet_open_bills/${houseId}`);
    if (type === 'internet' && (await tx.get(openRef)).exists) fail('failed-precondition', 'Selesaikan tagihan internet yang masih terbuka.');
    const amount = packageId ? INTERNET_PACKAGES[packageId as keyof typeof INTERNET_PACKAGES].amount : IPL_AMOUNT;
    const bill = {houseId, residentId: house.primaryResidentId, period, packageId, amount, bank:'BCA', status:'UNPAID', createdAt:Timestamp.now()};
    tx.create(ref, bill);
    if (type === 'internet') tx.create(openRef, {billId});
    audit(tx, uid, 'CREATE_BILL', billId, {kind:type, amount});
    return {billId, ...bill};
  });
}

export async function submitPayment(uid: string, input: unknown) {
  const data = object(input, ['kind','billId','proofId','requestId']);
  const type = kind(data.kind), billId = id(data.billId), proofId = id(data.proofId), requestId = id(data.requestId);
  const db = getFirestore(), paymentId = hash(uid, type, requestId);
  const ref = db.doc(`${type}_payments/${paymentId}`), billRef = db.doc(`${type}_bills/${billId}`);
  return db.runTransaction(async tx => {
    const user = await actor(tx, uid);
    const bill = (await tx.get(billRef)).data();
    if (!bill || bill.houseId !== user.houseId || bill.residentId !== uid) fail('permission-denied', 'Tagihan tidak dapat diakses.');
    const previous = (await tx.get(ref)).data();
    if (previous) {
      if (previous.billId !== billId || previous.proofId !== proofId) fail('already-exists', 'Request ID telah dipakai.');
      return {paymentId, status:previous.status};
    }
    if (!['UNPAID','OVERDUE'].includes(bill.status)) fail('failed-precondition', 'Tagihan tidak dapat dibayar ulang.');
    const proofRef = db.doc(`payment_proofs/${proofId}`);
    const proof = (await tx.get(proofRef)).data();
    // Only the server upload validator can create VALIDATED records. All client writes denied.
    if (!proof || proof.ownerId !== uid || proof.billId !== billId || proof.kind !== type || proof.status !== 'VALIDATED' || proof.paymentId) {
      fail('failed-precondition', 'Bukti belum divalidasi atau sudah digunakan.');
    }
    tx.create(ref, {billId, houseId:bill.houseId, residentId:uid, proofId, amount:bill.amount, bank:'BCA', status:'PENDING_VERIFICATION', createdAt:Timestamp.now()});
    tx.update(proofRef, {paymentId});
    tx.update(billRef, {status:'PENDING_VERIFICATION', pendingPaymentId:paymentId});
    audit(tx, uid, 'SUBMIT_PAYMENT', paymentId, {kind:type, billId});
    return {paymentId, status:'PENDING_VERIFICATION'};
  });
}

export async function verifyPayment(uid: string, input: unknown) {
  const data = object(input, ['kind','paymentId','decision','reason']);
  const type = kind(data.kind), paymentId = id(data.paymentId), decision = data.decision;
  if (decision !== 'APPROVED' && decision !== 'REJECTED') fail('invalid-argument', 'Keputusan tidak valid.');
  const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
  if (decision === 'REJECTED' && (!reason || reason.length > 500)) fail('invalid-argument', 'Alasan penolakan wajib 1–500 karakter.');
  const db = getFirestore(), ref = db.doc(`${type}_payments/${paymentId}`);
  return db.runTransaction(async tx => {
    admin(await actor(tx, uid));
    const payment = (await tx.get(ref)).data();
    if (!payment) fail('not-found', 'Pembayaran tidak ditemukan.');
    if (payment.residentId === uid) fail('permission-denied', 'Tidak dapat memverifikasi pembayaran sendiri.');
    if (payment.status !== 'PENDING_VERIFICATION') {
      if (payment.status !== decision) fail('failed-precondition', 'Keputusan pembayaran sudah final.');
      return {paymentId, status:payment.status};
    }
    const billRef = db.doc(`${type}_bills/${id(payment.billId)}`);
    const bill = (await tx.get(billRef)).data();
    if (!bill || bill.status !== 'PENDING_VERIFICATION' || bill.pendingPaymentId !== paymentId || bill.amount !== payment.amount) {
      fail('failed-precondition', 'Tagihan dan pembayaran tidak konsisten.');
    }
    const subRef = db.doc(`internet_subscriptions/${id(bill.houseId)}`);
    const sub = type === 'internet' ? (await tx.get(subRef)).data() : null;
    const now = Timestamp.now();
    if (type === 'internet' && decision === 'APPROVED') {
      const until = extendMonth(sub?.activeUntil?.toDate() ?? null, now.toDate());
      tx.set(subRef, {houseId:bill.houseId, primaryResidentId:bill.residentId, packageId:bill.packageId,
        status:'PENDING_ACTIVATION', activeFrom:sub?.activeUntil?.toMillis() > now.toMillis() ? sub!.activeUntil : now,
        activeUntil:Timestamp.fromDate(until), lastApprovedPaymentId:paymentId, updatedAt:now}, {merge:true});
      tx.delete(db.doc(`internet_open_bills/${bill.houseId}`));
    }
    tx.update(ref, {status:decision, verifiedBy:uid, verifiedAt:now, rejectionReason:decision === 'REJECTED' ? reason : null});
    tx.update(billRef, {status:decision === 'APPROVED' ? 'PAID' : 'UNPAID', pendingPaymentId:null, updatedAt:now});
    audit(tx, uid, 'VERIFY_PAYMENT', paymentId, {kind:type, billId:payment.billId, decision, reason:decision === 'REJECTED' ? reason : null});
    tx.create(db.doc(`notification_outbox/${type}_${paymentId}`), {residentId:payment.residentId, paymentId, decision, status:'PENDING', createdAt:now});
    return {paymentId, status:decision};
  });
}
