import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
const require = createRequire(new URL('../backend/functions/package.json', import.meta.url));
const {initializeApp, deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-local');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
const app = initializeApp({projectId: 'demo-casa-local'});
const url = 'http://127.0.0.1:5001/demo-casa-local/asia-southeast2/getBillingCatalog';
const call = async token => {
  const headers = {'Content-Type': 'application/json'};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, {method:'POST', headers, body: JSON.stringify({data:{}})});
};
try {
  assert.equal((await call()).status, 401);
  const signup = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-only`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email:`${randomUUID()}@example.test`, password:randomUUID(), returnSecureToken:true})
  });
  assert.equal(signup.status, 200);
  const {localId, idToken} = await signup.json();
  assert.equal((await call(idToken)).status, 403);
  await getFirestore().doc(`users/${localId}`).set({active:true, houseId:'SMOKE'});
  const response = await call(idToken);
  assert.equal(response.status, 200);
  const {result} = await response.json();
  assert.equal(result.iplAmount,100000);
  assert.equal(result.internetPackages.INTERNET_50.amount,180000);
  console.log('PASS: anonymous denied, unregistered resident denied, active resident receives official catalog.');
} finally { await deleteApp(app); }
