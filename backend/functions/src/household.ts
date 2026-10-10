import {createHash} from 'node:crypto';
import {getFirestore, Timestamp, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

const RELATIONSHIPS = ['PASANGAN', 'ANAK', 'ORANG_TUA', 'LAINNYA'];
const VEHICLE_TYPES = ['MOBIL', 'MOTOR', 'LAINNYA'];

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
function text(value: unknown, max = 120): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f]/.test(value)) throw new HttpsError('invalid-argument', 'Teks tidak valid.');
  return value.trim();
}
function phoneNumber(value: unknown): string {
  if (typeof value !== 'string' || !/^\+?[0-9]{8,15}$/.test(value)) throw new HttpsError('invalid-argument', 'Nomor telepon tidak valid.');
  return value;
}
function optionalPhone(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  return phoneNumber(value);
}
function emailAddress(value: unknown): string {
  if (typeof value !== 'string' || value.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new HttpsError('invalid-argument', 'Email tidak valid.');
  return value;
}
function relationship(value: unknown): string {
  if (!RELATIONSHIPS.includes(String(value))) throw new HttpsError('invalid-argument', 'Hubungan keluarga tidak valid.');
  return String(value);
}
function vehicleType(value: unknown): string {
  if (!VEHICLE_TYPES.includes(String(value))) throw new HttpsError('invalid-argument', 'Jenis kendaraan tidak valid.');
  return String(value);
}
function plateNumber(value: unknown): string {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Plat nomor tidak valid.');
  const v = value.trim().toUpperCase();
  if (!/^[A-Z0-9 -]{4,15}$/.test(v)) throw new HttpsError('invalid-argument', 'Plat nomor tidak valid.');
  return v;
}
function optionalText(value: unknown, max = 60): string | null {
  if (value === undefined || value === null || value === '') return null;
  return text(value, max);
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
// Kepala keluarga SAJA yang boleh kelola anggota keluarga & kendaraan rumah
// sendiri -- bukan sembarang resident di rumah itu (hindari anggota non-
// kepala keluarga saling mengubah data satu sama lain tanpa koordinasi).
async function requireHead(tx: Transaction, uid: string) {
  const user = await requireActive(tx, uid);
  if (user?.role !== 'resident' || user?.isHead !== true) throw new HttpsError('permission-denied', 'Hanya kepala keluarga yang dapat mengelola data ini.');
  return user;
}
function audit(tx: Transaction, uid: string, role: string, action: string, resourceId: string, oldValue: unknown, newValue: unknown) {
  tx.create(getFirestore().collection('audit_logs').doc(), {actorId: uid, actorRole: role, action, resourceId, oldValue, newValue, createdAt: Timestamp.now()});
}

// Resident edit kontak sendiri (phone/email) -- BUKAN fullName (ganti nama
// legal butuh proses admin terpisah, di luar scope "edit profil/kontak").
export async function updateResidentProfile(uid: string, input: unknown) {
  const d = payload(input, ['phone', 'email', 'expectedVersion']);
  const phone = d.phone === undefined ? undefined : phoneNumber(d.phone);
  const email = d.email === undefined ? undefined : emailAddress(d.email);
  if (phone === undefined && email === undefined) throw new HttpsError('invalid-argument', 'Minimal satu field (phone/email) diisi.');
  const expectedVersion = version(d.expectedVersion);
  const db = getFirestore(), ref = db.doc(`residents/${uid}`);
  return db.runTransaction(async tx => {
    const user = await requireActive(tx, uid);
    if (user?.role !== 'resident') throw new HttpsError('permission-denied', 'Khusus akun warga.');
    const existing = (await tx.get(ref)).data();
    if (!existing) throw new HttpsError('not-found', 'Profil warga tidak ditemukan.');
    if ((existing.version ?? 0) !== expectedVersion) throw new HttpsError('failed-precondition', 'Profil sudah diubah; muat ulang.');
    const now = Timestamp.now(), newVersion = expectedVersion + 1;
    const updates: Record<string, unknown> = {version: newVersion, updatedAt: now};
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    tx.update(ref, updates);
    audit(tx, uid, user!.role, 'UPDATE_RESIDENT_PROFILE', uid, {phone: existing.phone ?? null, email: existing.email ?? null}, {phone, email});
    return {residentUid: uid, version: newVersion};
  });
}

// --- Anggota keluarga ------------------------------------------------------

export async function saveFamilyMember(uid: string, input: unknown) {
  const d = payload(input, ['requestId', 'familyMemberId', 'fullName', 'relationship', 'phone', 'expectedVersion']);
  const fullName = text(d.fullName);
  const rel = relationship(d.relationship);
  const phone = optionalPhone(d.phone);
  const db = getFirestore();

  if (d.familyMemberId === undefined) {
    const requestId = identifier(d.requestId);
    const familyMemberId = digest(uid, requestId);
    const signature = digest(fullName, rel, phone);
    const ref = db.doc(`family_members/${familyMemberId}`);
    return db.runTransaction(async tx => {
      const user = await requireHead(tx, uid);
      const existing = (await tx.get(ref)).data();
      if (existing) {
        if (existing.signature !== signature) throw new HttpsError('already-exists', 'Request ID telah dipakai.');
        return {familyMemberId, version: existing.version};
      }
      const now = Timestamp.now();
      tx.create(ref, {houseId: identifier(user!.houseId), fullName, relationship: rel, phone, active: true, signature, version: 1, createdBy: uid, createdAt: now, updatedAt: now});
      audit(tx, uid, user!.role, 'CREATE_FAMILY_MEMBER', familyMemberId, null, {fullName, relationship: rel});
      return {familyMemberId, version: 1};
    });
  }

  const familyMemberId = identifier(d.familyMemberId);
  const expectedVersion = version(d.expectedVersion);
  const ref = db.doc(`family_members/${familyMemberId}`);
  return db.runTransaction(async tx => {
    const user = await requireHead(tx, uid);
    const existing = (await tx.get(ref)).data();
    if (!existing || existing.active === false) throw new HttpsError('not-found', 'Anggota keluarga tidak ditemukan.');
    if (existing.houseId !== user!.houseId) throw new HttpsError('permission-denied', 'Bukan anggota rumah Anda.');
    if (existing.version !== expectedVersion) throw new HttpsError('failed-precondition', 'Data sudah diubah; muat ulang.');
    const now = Timestamp.now(), newVersion = expectedVersion + 1;
    tx.update(ref, {fullName, relationship: rel, phone, version: newVersion, updatedAt: now});
    audit(tx, uid, user!.role, 'UPDATE_FAMILY_MEMBER', familyMemberId, {fullName: existing.fullName, relationship: existing.relationship}, {fullName, relationship: rel});
    return {familyMemberId, version: newVersion};
  });
}

export async function removeFamilyMember(uid: string, input: unknown) {
  const d = payload(input, ['familyMemberId', 'expectedVersion']);
  const familyMemberId = identifier(d.familyMemberId), expectedVersion = version(d.expectedVersion);
  const db = getFirestore(), ref = db.doc(`family_members/${familyMemberId}`);
  return db.runTransaction(async tx => {
    const user = await requireHead(tx, uid);
    const existing = (await tx.get(ref)).data();
    if (!existing || existing.active === false) return {familyMemberId, removed: true};
    if (existing.houseId !== user!.houseId) throw new HttpsError('permission-denied', 'Bukan anggota rumah Anda.');
    if (existing.version !== expectedVersion) throw new HttpsError('failed-precondition', 'Data sudah diubah; muat ulang.');
    tx.update(ref, {active: false, version: expectedVersion + 1, updatedAt: Timestamp.now()});
    audit(tx, uid, user!.role, 'REMOVE_FAMILY_MEMBER', familyMemberId, {fullName: existing.fullName}, null);
    return {familyMemberId, removed: true};
  });
}

export async function listFamilyMembers(uid: string, input: unknown) {
  payload(input, []);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const user = await requireActive(tx, uid);
    if (user?.role !== 'resident') throw new HttpsError('permission-denied', 'Khusus akun warga.');
    const found = await tx.get(db.collection('family_members').where('houseId', '==', identifier(user!.houseId)));
    return {items: found.docs.filter(x => x.data().active !== false).map(x => {
      const r = x.data();
      return {id: x.id, fullName: r.fullName, relationship: r.relationship, phone: r.phone, version: r.version};
    })};
  });
}

// --- Kendaraan --------------------------------------------------------------

export async function saveVehicle(uid: string, input: unknown) {
  const d = payload(input, ['requestId', 'vehicleId', 'plateNumber', 'type', 'brand', 'color', 'expectedVersion']);
  const plate = plateNumber(d.plateNumber);
  const type = vehicleType(d.type);
  const brand = optionalText(d.brand);
  const color = optionalText(d.color, 30);
  const db = getFirestore();

  if (d.vehicleId === undefined) {
    const requestId = identifier(d.requestId);
    const vehicleId = digest(uid, requestId);
    const signature = digest(plate, type, brand, color);
    const ref = db.doc(`vehicles/${vehicleId}`);
    return db.runTransaction(async tx => {
      const user = await requireHead(tx, uid);
      const existing = (await tx.get(ref)).data();
      if (existing) {
        if (existing.signature !== signature) throw new HttpsError('already-exists', 'Request ID telah dipakai.');
        return {vehicleId, version: existing.version};
      }
      const now = Timestamp.now();
      tx.create(ref, {houseId: identifier(user!.houseId), plateNumber: plate, type, brand, color, active: true, signature, version: 1, createdBy: uid, createdAt: now, updatedAt: now});
      audit(tx, uid, user!.role, 'CREATE_VEHICLE', vehicleId, null, {plateNumber: plate, type});
      return {vehicleId, version: 1};
    });
  }

  const vehicleId = identifier(d.vehicleId);
  const expectedVersion = version(d.expectedVersion);
  const ref = db.doc(`vehicles/${vehicleId}`);
  return db.runTransaction(async tx => {
    const user = await requireHead(tx, uid);
    const existing = (await tx.get(ref)).data();
    if (!existing || existing.active === false) throw new HttpsError('not-found', 'Kendaraan tidak ditemukan.');
    if (existing.houseId !== user!.houseId) throw new HttpsError('permission-denied', 'Bukan kendaraan rumah Anda.');
    if (existing.version !== expectedVersion) throw new HttpsError('failed-precondition', 'Data sudah diubah; muat ulang.');
    const now = Timestamp.now(), newVersion = expectedVersion + 1;
    tx.update(ref, {plateNumber: plate, type, brand, color, version: newVersion, updatedAt: now});
    audit(tx, uid, user!.role, 'UPDATE_VEHICLE', vehicleId, {plateNumber: existing.plateNumber, type: existing.type}, {plateNumber: plate, type});
    return {vehicleId, version: newVersion};
  });
}

export async function removeVehicle(uid: string, input: unknown) {
  const d = payload(input, ['vehicleId', 'expectedVersion']);
  const vehicleId = identifier(d.vehicleId), expectedVersion = version(d.expectedVersion);
  const db = getFirestore(), ref = db.doc(`vehicles/${vehicleId}`);
  return db.runTransaction(async tx => {
    const user = await requireHead(tx, uid);
    const existing = (await tx.get(ref)).data();
    if (!existing || existing.active === false) return {vehicleId, removed: true};
    if (existing.houseId !== user!.houseId) throw new HttpsError('permission-denied', 'Bukan kendaraan rumah Anda.');
    if (existing.version !== expectedVersion) throw new HttpsError('failed-precondition', 'Data sudah diubah; muat ulang.');
    tx.update(ref, {active: false, version: expectedVersion + 1, updatedAt: Timestamp.now()});
    audit(tx, uid, user!.role, 'REMOVE_VEHICLE', vehicleId, {plateNumber: existing.plateNumber}, null);
    return {vehicleId, removed: true};
  });
}

export async function listVehicles(uid: string, input: unknown) {
  payload(input, []);
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const user = await requireActive(tx, uid);
    if (user?.role !== 'resident') throw new HttpsError('permission-denied', 'Khusus akun warga.');
    const found = await tx.get(db.collection('vehicles').where('houseId', '==', identifier(user!.houseId)));
    return {items: found.docs.filter(x => x.data().active !== false).map(x => {
      const r = x.data();
      return {id: x.id, plateNumber: r.plateNumber, type: r.type, brand: r.brand, color: r.color, version: r.version};
    })};
  });
}
