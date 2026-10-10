import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// Mode lokal (emulator). Project production BELUM ada -- lihat
// docs/runbooks/PUBLISH_LOCAL.md. Nilai apiKey di bawah sengaja format-valid
// tapi palsu (sama dengan app mobile, lihat .gitleaks.toml).
const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyDemoLocalEmulatorOnlyNotARealKey1',
  authDomain: 'demo-casa-local.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-casa-local',
  appId: '1:000000000000:web:0000000000000000000000',
};

const app = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-southeast2');

if (useEmulator && typeof window !== 'undefined' && !(globalThis as { __casaEmu?: boolean }).__casaEmu) {
  (globalThis as { __casaEmu?: boolean }).__casaEmu = true;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
