import {createHash} from 'node:crypto';
import {FieldPath, getFirestore, Timestamp, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

// Kategori tetap -- daftar awal (keputusan Product Owner 10 Okt 2026), bisa
// diperluas lewat Change Request, TIDAK ditambah diam-diam di sini.
const INCOME_CATEGORIES = ['IPL', 'INTERNET', 'DONASI', 'LAIN_LAIN'];
const EXPENSE_CATEGORIES = ['KEAMANAN', 'KEBERSIHAN', 'PERBAIKAN', 'LISTRIK_AIR_UMUM', 'ADMINISTRASI', 'LAIN_LAIN'];

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
function text(value: unknown, max = 500): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f]/.test(value)) throw new HttpsError('invalid-argument', 'Teks tidak valid.');
  return value.trim();
}
function financeType(value: unknown): 'INCOME' | 'EXPENSE' {
  if (value !== 'INCOME' && value !== 'EXPENSE') throw new HttpsError('invalid-argument', 'Tipe transaksi harus INCOME atau EXPENSE.');
  return value;
}
function financeCategory(type: 'INCOME' | 'EXPENSE', value: unknown): string {
  const list = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!list.includes(String(value))) throw new HttpsError('invalid-argument', `Kategori tidak valid untuk ${type}.`);
  return String(value);
}
function financeAmount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000) {
    throw new HttpsError('invalid-argument', 'Nominal harus bilangan bulat positif.');
  }
  return value;
}
function period(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new HttpsError('invalid-argument', 'Periode harus format YYYY-MM.');
  return value;
}
function version(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new HttpsError('invalid-argument', 'Versi tidak valid.');
  return value;
}
function digest(...values: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(values)).digest('hex');
}
async function requireActive(tx: Transaction, uid: string) {
  const user = (await tx.get(getFirestore().doc(`users/${uid}`))).data();
  if (user?.active !== true) throw new HttpsError('permission-denied', 'Akun tidak aktif.');
  return user;
}
async function requireAdmin(tx: Transaction, uid: string) {
  const user = await requireActive(tx, uid);
  if (!['committee', 'super_admin'].includes(String(user?.role))) throw new HttpsError('permission-denied', 'Akses pengurus diperlukan.');
  return user;
}
function audit(tx: Transaction, uid: string, role: string, action: string, resourceId: string, oldValue: unknown, newValue: unknown) {
  tx.create(getFirestore().collection('audit_logs').doc(), {actorId: uid, actorRole: role, action, resourceId, oldValue, newValue, createdAt: Timestamp.now()});
}

// Catat transaksi baru (requestId wajib, idempotent lewat ID deterministik)
// ATAU edit transaksi yang sudah ada (transactionId + expectedVersion wajib).
// periodId TIDAK BISA diubah lewat edit -- kalau salah periode, buat transaksi
// baru dan koreksi lewat Change Request, bukan pindah-pindah periode diam-diam.
export async function saveFinanceTransaction(uid: string, input: unknown) {
  const d = payload(input, ['requestId', 'transactionId', 'type', 'category', 'amount', 'description', 'periodId', 'expectedVersion']);
  const type = financeType(d.type);
  const category = financeCategory(type, d.category);
  const amount = financeAmount(d.amount);
  const description = text(d.description);
  const db = getFirestore();

  if (d.transactionId === undefined) {
    const requestId = identifier(d.requestId);
    const periodId = period(d.periodId);
    const transactionId = digest(uid, requestId);
    const signature = digest(type, category, amount, description, periodId);
    const ref = db.doc(`finance_transactions/${transactionId}`);
    const pubRef = db.doc(`financePublications/${periodId}`);
    return db.runTransaction(async tx => {
      const user = await requireAdmin(tx, uid);
      const existing = (await tx.get(ref)).data();
      const pub = (await tx.get(pubRef)).data();
      if (existing) {
        if (existing.signature !== signature) throw new HttpsError('already-exists', 'Request ID telah dipakai.');
        return {transactionId, version: existing.version};
      }
      if (pub?.status === 'PUBLISHED') throw new HttpsError('failed-precondition', 'Periode sudah dipublikasikan, tidak bisa menambah transaksi.');
      const now = Timestamp.now();
      tx.create(ref, {type, category, amount, description, periodId, signature, version: 1, createdBy: uid, createdAt: now, updatedAt: now});
      audit(tx, uid, user!.role, 'CREATE_FINANCE_TRANSACTION', transactionId, null, {type, category, amount, periodId});
      return {transactionId, version: 1};
    });
  }

  const transactionId = identifier(d.transactionId);
  const expectedVersion = version(d.expectedVersion);
  if (d.periodId !== undefined) throw new HttpsError('invalid-argument', 'periodId tidak boleh dikirim saat edit.');
  const ref = db.doc(`finance_transactions/${transactionId}`);
  return db.runTransaction(async tx => {
    const user = await requireAdmin(tx, uid);
    const existing = (await tx.get(ref)).data();
    if (!existing) throw new HttpsError('not-found', 'Transaksi tidak ditemukan.');
    const pub = (await tx.get(db.doc(`financePublications/${existing.periodId}`))).data();
    if (existing.version !== expectedVersion) throw new HttpsError('failed-precondition', 'Transaksi sudah diubah; muat ulang.');
    if (pub?.status === 'PUBLISHED') throw new HttpsError('failed-precondition', 'Periode sudah dipublikasikan, tidak bisa diubah.');
    const now = Timestamp.now(), newVersion = expectedVersion + 1;
    tx.update(ref, {type, category, amount, description, version: newVersion, updatedAt: now});
    audit(tx, uid, user!.role, 'UPDATE_FINANCE_TRANSACTION', transactionId, {type: existing.type, category: existing.category, amount: existing.amount}, {type, category, amount});
    return {transactionId, version: newVersion};
  });
}

// Hitung ulang total 1 periode dari SEMUA finance_transactions periode itu,
// tulis snapshot ke financePublications (satu-satunya yang boleh dibaca
// client). Bisa dijalankan ulang (requestId baru) buat republish setelah ada
// transaksi baru -- retry dengan requestId SAMA cuma balikin hasil lama
// (idempotent), tidak dobel audit log.
export async function publishFinancePeriod(uid: string, input: unknown) {
  const d = payload(input, ['requestId', 'periodId']);
  const periodId = period(d.periodId);
  const requestId = identifier(d.requestId);
  const db = getFirestore();
  const opRef = db.doc(`finance_publish_operations/${digest(uid, requestId)}`);
  const pubRef = db.doc(`financePublications/${periodId}`);
  const signature = digest(periodId);
  return db.runTransaction(async tx => {
    const user = await requireAdmin(tx, uid);
    const oldOp = (await tx.get(opRef)).data();
    if (oldOp) {
      if (oldOp.signature !== signature) throw new HttpsError('already-exists', 'Request ID telah dipakai.');
      return oldOp.result;
    }
    const found = await tx.get(db.collection('finance_transactions').where('periodId', '==', periodId).limit(500));
    const old = (await tx.get(pubRef)).data();
    let totalIncome = 0, totalExpense = 0;
    const transactions = found.docs.map(doc => {
      const r = doc.data();
      if (r.type === 'INCOME') totalIncome += r.amount; else totalExpense += r.amount;
      return {type: r.type, category: r.category, amount: r.amount, description: r.description};
    });
    const now = Timestamp.now(), newVersion = (old?.version ?? 0) + 1;
    const result = {periodId, totalIncome, totalExpense, net: totalIncome - totalExpense, transactionCount: transactions.length, version: newVersion};
    tx.set(pubRef, {
      periodId, status: 'PUBLISHED', totalIncome, totalExpense, net: totalIncome - totalExpense, transactions,
      version: newVersion, publishedBy: uid, publishedAt: old?.publishedAt ?? now, updatedAt: now,
    });
    tx.create(opRef, {signature, result, createdAt: now});
    audit(tx, uid, user!.role, 'PUBLISH_FINANCE_PERIOD', periodId, {oldVersion: old?.version ?? null}, {version: newVersion, totalIncome, totalExpense, transactionCount: transactions.length});
    return result;
  });
}

// Siapa pun yang login (resident maupun pengurus) boleh baca periode yang
// SUDAH dipublikasikan -- financePublications adalah satu-satunya tempat
// resident boleh baca data finance (lihat firestore.rules).
export async function listFinancePublications(uid: string, input: unknown) {
  const d = payload(input, ['limit', 'afterPeriodId']);
  const limit = d.limit ?? 20;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new HttpsError('invalid-argument', 'Limit 1–50.');
  const after = d.afterPeriodId === undefined ? null : period(d.afterPeriodId);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    await requireActive(tx, uid);
    let query = db.collection('financePublications').where('status', '==', 'PUBLISHED').orderBy(FieldPath.documentId());
    if (after) query = query.startAfter(after);
    const found = await tx.get(query.limit(limit + 1));
    const docs = found.docs.slice(0, limit);
    return {
      items: docs.map(x => {
        const r = x.data();
        return {periodId: x.id, totalIncome: r.totalIncome, totalExpense: r.totalExpense, net: r.net, transactions: r.transactions, publishedAt: r.publishedAt};
      }),
      nextCursor: found.size > limit ? docs.at(-1)!.id : null,
    };
  });
}
