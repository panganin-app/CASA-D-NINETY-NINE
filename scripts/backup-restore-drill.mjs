// Backup/restore drill (M8) -- buktikan export-on-exit + --import yang
// sudah dikonfigurasi di emulators.mjs (mode default, dipakai Leo buat dev
// sehari-hari) BENERAN nyelametin data, bukan cuma asumsi dari baca kode.
//
// Pakai project ('demo-casa-drill') dan folder export ('.local/drill-*')
// TERPISAH dari data dev asli Leo (.local/emulator-data, project
// demo-casa-local) -- drill ini TIDAK PERNAH menyentuh data beneran.
import {spawn} from 'node:child_process';
import {existsSync, rmSync, mkdirSync, chmodSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const PROJECT = 'demo-casa-drill';
const EXPORT_DIR = '.local/drill-export';
// Di ROOT (BUKAN di dalam .local/) -- firebase CLI resolve path `rules`
// relatif yang ada di firebase.json RELATIF TERHADAP LOKASI --config ITU
// SENDIRI, bukan relatif terhadap cwd. Kalau ditaruh di .local/, path
// "firebase/firestore/firestore.rules" ke-resolve jadi
// ".local/firebase/firestore/firestore.rules" (gak ada) -> emulator gagal
// start. Pola sama persis dengan .firebase.test.local.json yang sudah ada.
const DRILL_CONFIG = '.firebase.drill.local.json';
// Port TERPISAH dari default firebase.json (8080/9099/dst) -- drill ini
// bisa dijalankan BARENGAN sesi emulator dev biasa Leo tanpa tabrakan port.
const PORTS = {firestore: 8280, auth: 9290, functions: 5201, storage: 9299, hub: 4580, logging: 4680};

mkdirSync('.local', {recursive: true, mode: 0o700});
chmodSync('.local', 0o700);
if (existsSync(EXPORT_DIR)) rmSync(EXPORT_DIR, {recursive: true, force: true});

// Config sementara -- SAMA pola dengan emulators.mjs mode "billing" (tulis
// firebase.json hasil modifikasi port, pakai --config, bukan ubah file asli).
const config = JSON.parse(readFileSync('firebase.json', 'utf8'));
config.emulators = {
  firestore: {host: '127.0.0.1', port: PORTS.firestore},
  auth: {host: '127.0.0.1', port: PORTS.auth},
  functions: {host: '127.0.0.1', port: PORTS.functions},
  storage: {host: '127.0.0.1', port: PORTS.storage},
  hub: {host: '127.0.0.1', port: PORTS.hub},
  logging: {host: '127.0.0.1', port: PORTS.logging},
  ui: {enabled: false},
  singleProjectMode: true,
};
writeFileSync(DRILL_CONFIG, JSON.stringify(config));

function emulatorEnv() {
  const env = {...process.env, CI: 'true'};
  const java = '/opt/homebrew/opt/openjdk@21';
  if (!env.JAVA_HOME && existsSync(`${java}/bin/java`)) env.JAVA_HOME = java;
  if (env.JAVA_HOME) env.PATH = `${env.JAVA_HOME}/bin:${env.PATH}`;
  return env;
}

function startEmulators(extraArgs) {
  const args = ['emulators:start', '--config', DRILL_CONFIG, '--project', PROJECT, ...extraArgs];
  const proc = spawn(resolve('node_modules/.bin/firebase'), args, {env: emulatorEnv(), stdio: ['ignore', 'pipe', 'pipe']});
  let ready = false;
  const out = [];
  proc.stdout.on('data', d => { out.push(d.toString()); if (d.toString().includes('All emulators ready')) ready = true; });
  proc.stderr.on('data', d => out.push(d.toString()));
  return {
    proc,
    waitReady: () => new Promise((resolve_, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (ready) { clearInterval(check); resolve_(); }
        else if (Date.now() - start > 60000) { clearInterval(check); reject(new Error('Emulator gagal start dalam 60 detik:\n' + out.join(''))); }
      }, 300);
    }),
    stopAndWaitExit: () => new Promise(resolve_ => {
      proc.once('exit', resolve_);
      proc.kill('SIGINT');
    }),
  };
}

async function seedKnownData() {
  process.env.GCLOUD_PROJECT = PROJECT;
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${PORTS.firestore}`;
  const {createRequire} = await import('node:module');
  const require = createRequire(new URL('../backend/functions/package.json', import.meta.url));
  const {initializeApp, deleteApp} = require('firebase-admin/app');
  const {getFirestore} = require('firebase-admin/firestore');
  const app = initializeApp({projectId: PROJECT});
  const db = getFirestore();
  const marker = `drill-${Date.now()}`;
  await db.doc('houses/DRILL-HOUSE').set({active: true, label: 'Drill House', primaryResidentId: 'drill-resident', marker});
  await db.doc('users/drill-resident').set({active: true, role: 'resident', houseId: 'DRILL-HOUSE', marker});
  await db.collection('audit_logs').doc('drill-log').set({actorId: 'drill-resident', action: 'DRILL_MARKER', resourceId: 'DRILL-HOUSE', marker, createdAt: new Date()});
  await deleteApp(app);
  return marker;
}

async function verifyKnownData(expectedMarker) {
  process.env.GCLOUD_PROJECT = PROJECT;
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${PORTS.firestore}`;
  const {createRequire} = await import('node:module');
  const require = createRequire(new URL('../backend/functions/package.json', import.meta.url));
  const {initializeApp, deleteApp} = require('firebase-admin/app');
  const {getFirestore} = require('firebase-admin/firestore');
  const app = initializeApp({projectId: PROJECT});
  const db = getFirestore();
  const house = (await db.doc('houses/DRILL-HOUSE').get()).data();
  const user = (await db.doc('users/drill-resident').get()).data();
  const log = (await db.doc('audit_logs/drill-log').get()).data();
  await deleteApp(app);
  const ok = house?.marker === expectedMarker && user?.marker === expectedMarker && log?.marker === expectedMarker;
  return {ok, house, user, log};
}

async function main() {
  console.log('1) Start emulator (fresh, --export-on-exit)...');
  const first = startEmulators(['--export-on-exit', EXPORT_DIR]);
  await first.waitReady();

  console.log('2) Seed data yang diketahui (marker unik)...');
  const marker = await seedKnownData();
  console.log(`   marker: ${marker}`);

  console.log('3) Stop emulator (SIGINT) -- trigger export-on-exit...');
  await first.stopAndWaitExit();

  if (!existsSync(`${EXPORT_DIR}/firestore_export`)) {
    throw new Error('GAGAL -- export-on-exit tidak menghasilkan folder firestore_export. Backup TIDAK bisa diandalkan.');
  }
  console.log('   export ketemu di ' + EXPORT_DIR);

  console.log('4) Start emulator BARU dengan --import (simulasi restore setelah disaster)...');
  const second = startEmulators(['--import', EXPORT_DIR]);
  await second.waitReady();

  console.log('5) Verifikasi data yang diimport cocok dengan yang diseed...');
  const result = await verifyKnownData(marker);

  console.log('6) Stop emulator kedua...');
  await second.stopAndWaitExit();

  rmSync(EXPORT_DIR, {recursive: true, force: true});
  rmSync(DRILL_CONFIG, {force: true});

  if (!result.ok) {
    console.error('\nGAGAL -- data setelah restore TIDAK cocok dengan yang di-backup.');
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log('\nBERHASIL -- backup (export-on-exit) dan restore (--import) terbukti menyelamatkan data secara akurat.');
}

main().catch(err => {
  console.error('\nDRILL GAGAL:', err.message);
  // EXPORT_DIR SENGAJA dibiarkan kalau gagal (buat post-mortem), config
  // sementara tetap dibersihkan karena itu murni scaffolding.
  rmSync(DRILL_CONFIG, {force: true});
  process.exit(1);
});
