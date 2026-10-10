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
test('finance: only published periods readable; raw transactions always denied; no client writes',async()=>{
 await env.withSecurityRulesDisabled(async c=>{
  const db=c.firestore();
  await setDoc(doc(db,'financePublications/2026-09'),{status:'PUBLISHED',totalIncome:100000,totalExpense:50000});
  await setDoc(doc(db,'financePublications/2026-10'),{status:'DRAFT'});
  await setDoc(doc(db,'finance_transactions/t1'),{type:'EXPENSE',category:'KEAMANAN',amount:50000,periodId:'2026-09'});
 });
 const db=env.authenticatedContext('alice').firestore();
 await assertSucceeds(getDoc(doc(db,'financePublications/2026-09')));
 await assertFails(getDoc(doc(db,'financePublications/2026-10')));
 await assertFails(getDoc(doc(db,'finance_transactions/t1')));
 await assertFails(setDoc(doc(db,'financePublications/2026-09'),{status:'PUBLISHED',totalIncome:999999999}));
 await assertFails(setDoc(doc(db,'finance_transactions/forged'),{type:'INCOME',category:'DONASI',amount:999999999}));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'financePublications/2026-09')));
});
test('household: own resident profile, own-house family members/vehicles, inactive and other-house denied',async()=>{
 await env.withSecurityRulesDisabled(async c=>{
  const db=c.firestore();
  await setDoc(doc(db,'users/alice'),{active:true,houseId:'A1'});
  await setDoc(doc(db,'residents/alice'),{houseId:'A1',fullName:'Alice'});
  await setDoc(doc(db,'residents/other'),{houseId:'A2',fullName:'Other'});
  await setDoc(doc(db,'family_members/own'),{houseId:'A1',fullName:'Budi',active:true});
  await setDoc(doc(db,'family_members/inactive'),{houseId:'A1',fullName:'Lama',active:false});
  await setDoc(doc(db,'family_members/otherhouse'),{houseId:'A2',fullName:'Someone',active:true});
  await setDoc(doc(db,'vehicles/own'),{houseId:'A1',plateNumber:'B1234XYZ',active:true});
  await setDoc(doc(db,'vehicles/otherhouse'),{houseId:'A2',plateNumber:'D5678ABC',active:true});
 });
 const db=env.authenticatedContext('alice').firestore();
 await assertSucceeds(getDoc(doc(db,'residents/alice')));
 await assertFails(getDoc(doc(db,'residents/other')));
 await assertSucceeds(getDoc(doc(db,'family_members/own')));
 await assertFails(getDoc(doc(db,'family_members/inactive')));
 await assertFails(getDoc(doc(db,'family_members/otherhouse')));
 await assertSucceeds(getDoc(doc(db,'vehicles/own')));
 await assertFails(getDoc(doc(db,'vehicles/otherhouse')));
 await assertFails(updateDoc(doc(db,'family_members/own'),{fullName:'Forged'}));
 await assertFails(setDoc(doc(db,'vehicles/forged'),{houseId:'A1',plateNumber:'Z9999ZZ'}));
});
