import {readFileSync} from 'node:fs';
import {test, before, after} from 'node:test';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {doc, setDoc, getDoc, updateDoc} from 'firebase/firestore';
let env;
before(async () => {
  env = await initializeTestEnvironment({projectId: process.env.GCLOUD_PROJECT ?? 'demo-casa-local', firestore: {rules: readFileSync('firebase/firestore/firestore.rules', 'utf8')}});
  await env.withSecurityRulesDisabled(async c => {
    const db = c.firestore();
    await setDoc(doc(db, 'users/alice'), {active: true, houseId: 'A1'});
    await setDoc(doc(db, 'users/bob'), {active: false, houseId: 'A1'});
    await setDoc(doc(db, 'ipl_bills/own'), {houseId: 'A1', status: 'UNPAID'});
    await setDoc(doc(db, 'ipl_bills/other'), {houseId: 'A2', status: 'UNPAID'});
  });
});
after(async () => { await env?.cleanup(); });
test('resident reads own bill but cannot read another household', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(db, 'ipl_bills/own')));
  await assertFails(getDoc(doc(db, 'ipl_bills/other')));
});
test('resident cannot mark PAID, grant role, or forge audit', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(updateDoc(doc(db, 'ipl_bills/own'), {status: 'PAID'}));
  await assertFails(updateDoc(doc(db, 'users/alice'), {role: 'super_admin'}));
  await assertFails(setDoc(doc(db, 'audit_logs/forged'), {action: 'APPROVED'}));
});
test('anonymous and disabled users denied', async () => {
  for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext('bob').firestore()]) {
    await assertFails(getDoc(doc(db, 'ipl_bills/own')));
  }
});

test('resident cannot read bank config or forge validated proof', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(db, 'payment_config/ipl')));
  await assertFails(setDoc(doc(db, 'payment_proofs/forged'), {ownerId:'alice',status:'VALIDATED'}));
  await assertFails(setDoc(doc(db, 'notification_outbox/forged'), {decision:'APPROVED'}));
});

test('resident cannot provision household or activate subscription directly', async () => {
  const db=env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db,'houses/new'),{active:true,primaryResidentId:'alice'}));
  await assertFails(setDoc(doc(db,'residents/new'),{role:'committee'}));
  await assertFails(setDoc(doc(db,'internet_subscriptions/fake'),{houseId:'A1',status:'ACTIVE'}));
  await assertFails(setDoc(doc(db,'admin_operations/fake'),{result:{status:'ACTIVE'}}));
});

test('community: only published content and own reports are readable; all client mutations denied',async()=>{
 await env.withSecurityRulesDisabled(async c=>{
  const db=c.firestore();
  for(const type of ['announcements','events']) {
   await setDoc(doc(db,type+'/public'),{status:'PUBLISHED'});
   await setDoc(doc(db,type+'/draft'),{status:'DRAFT'});
   await setDoc(doc(db,type+'/archived'),{status:'ARCHIVED'});
  }
  await setDoc(doc(db,'reports/alice-report'),{residentId:'alice',status:'SUBMITTED'});
  await setDoc(doc(db,'reports/other-report'),{residentId:'someone'});
 });
 const db=env.authenticatedContext('alice').firestore();
 for(const type of ['announcements','events']) {
  await assertSucceeds(getDoc(doc(db,type+'/public')));
  for(const id of ['draft','archived']) await assertFails(getDoc(doc(db,type+'/'+id)));
  await assertFails(updateDoc(doc(db,type+'/draft'),{status:'PUBLISHED'}));
 }
 await assertSucceeds(getDoc(doc(db,'reports/alice-report')));
 await assertFails(getDoc(doc(db,'reports/other-report')));
 await assertFails(updateDoc(doc(db,'reports/alice-report'),{status:'CLOSED'}));
 await assertFails(setDoc(doc(db,'report_events/forged'),{residentId:'alice'}));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'announcements/public')));
 await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(),'announcements/public')));
});
test('notifications: own inbox only; cannot forge or directly acknowledge',async()=>{
 await env.withSecurityRulesDisabled(async c=>{
  await setDoc(doc(c.firestore(),'notifications/own'),{residentId:'alice',readAt:null});
  await setDoc(doc(c.firestore(),'notifications/other'),{residentId:'someone'});
 });
 const db=env.authenticatedContext('alice').firestore();
 await assertSucceeds(getDoc(doc(db,'notifications/own')));
 await assertFails(getDoc(doc(db,'notifications/other')));
 await assertFails(updateDoc(doc(db,'notifications/own'),{readAt:'forged'}));
 await assertFails(setDoc(doc(db,'notifications/forged'),{residentId:'alice'}));
 await assertFails(getDoc(doc(db,'notification_outbox/private')));
});
