// Smoke test lapisan data Admin Web terhadap Emulator Suite lokal.
// Memakai SDK client yang sama dengan apps/admin (firebase), login sebagai
// pengurus (harus BISA) dan warga (harus DITOLAK). Password tidak pernah dicetak.
import {createRequire} from 'node:module';
import {readdirSync, readFileSync} from 'node:fs';

const require = createRequire(new URL('../apps/admin/package.json', import.meta.url));
const {initializeApp, deleteApp} = require('firebase/app');
const {getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut} = require('firebase/auth');
const {getFirestore, connectFirestoreEmulator} = require('firebase/firestore');
const {getFunctions, connectFunctionsEmulator, httpsCallable} = require('firebase/functions');

const creds = readdirSync('.local').filter((f) => f.startsWith('seed-credentials-')).sort().pop();
if (!creds) throw new Error('Kredensial seed tidak ditemukan. Jalankan: npm run seed:local');
const accounts = JSON.parse(readFileSync(`.local/${creds}`, 'utf8'));
const byRole = (role) => accounts.find((a) => a.role === role);

const app = initializeApp({apiKey: 'AIzaSyDemoLocalEmulatorOnlyNotARealKey1', projectId: 'demo-casa-local', appId: '1:0:web:0'}, 'smoke');
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings: true});
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);
const fn = getFunctions(app, 'asia-southeast2');
connectFunctionsEmulator(fn, '127.0.0.1', 5001);

async function asRole(role, fnName, data) {
  const acc = byRole(role);
  if (!acc) throw new Error(`Akun ${role} tidak ada di kredensial seed`);
  await signInWithEmailAndPassword(auth, acc.email, acc.password);
  try {
    const res = await httpsCallable(fn, fnName)(data);
    return {ok: true, count: Array.isArray(res.data?.items) ? res.data.items.length : 'ok'};
  } catch (e) {
    return {ok: false, code: (e.code || '').replace('functions/', '')};
  } finally {
    await signOut(auth);
  }
}

let failed = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) failed++;
}

const committee = await asRole('committee', 'listAdminRecords', {resource: 'houses', limit: 20});
check('pengurus dapat membaca daftar rumah', committee.ok, committee.ok ? `items=${committee.count}` : committee.code);

const committeeAudit = await asRole('committee', 'listAuditLogs', {limit: 5});
check('pengurus dapat membaca audit log', committeeAudit.ok, committeeAudit.ok ? 'ok' : committeeAudit.code);

const resident = await asRole('resident', 'listAdminRecords', {resource: 'houses', limit: 20});
check('warga DITOLAK membaca daftar rumah (permission-denied)', !resident.ok && resident.code === 'permission-denied', resident.code ?? 'ok');

const residentAudit = await asRole('resident', 'listAuditLogs', {limit: 5});
check('warga DITOLAK membaca audit log', !residentAudit.ok && residentAudit.code === 'permission-denied', residentAudit.code ?? 'ok');

await deleteApp(app);
console.log(failed === 0 ? '\nSEMUA LULUS' : `\n${failed} GAGAL`);
process.exit(failed === 0 ? 0 : 1);
