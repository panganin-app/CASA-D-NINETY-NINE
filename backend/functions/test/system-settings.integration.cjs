const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore,Timestamp} = require('firebase-admin/firestore');
const {getSystemSettings,updateSystemSettings} = require('../lib/system-settings');
const {createBill} = require('../lib/billing');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore();
const tag=randomUUID(), resident=`r-${tag}`, committee=`c-${tag}`, superAdmin=`sa-${tag}`, house=`h-${tag}`;
before(async()=>{
 await db.doc(`users/${resident}`).set({active:true,role:'resident',houseId:house});
 await db.doc(`users/${committee}`).set({active:true,role:'committee'});
 await db.doc(`users/${superAdmin}`).set({active:true,role:'super_admin'});
 await db.doc(`houses/${house}`).set({active:true,primaryResidentId:resident});
});
after(()=>deleteApp(app));

test('getSystemSettings: returns sensible defaults before anything is configured',async()=>{
 const settings=await getSystemSettings(resident,{});
 assert.equal(settings.iplDueDateDays,10);
 assert.equal(settings.internetDueDateDays,7);
 assert.equal(settings.internetExpiringSoonDays,7);
 assert.equal(settings.version,0);
});

test('updateSystemSettings: super_admin only, not committee; version-guarded; validated range',async()=>{
 await assert.rejects(updateSystemSettings(resident,{iplDueDateDays:5,internetDueDateDays:5,internetExpiringSoonDays:5,expectedVersion:0}),{code:'permission-denied'});
 await assert.rejects(updateSystemSettings(committee,{iplDueDateDays:5,internetDueDateDays:5,internetExpiringSoonDays:5,expectedVersion:0}),{code:'permission-denied'});
 await assert.rejects(updateSystemSettings(superAdmin,{iplDueDateDays:0,internetDueDateDays:5,internetExpiringSoonDays:5,expectedVersion:0}),{code:'invalid-argument'});
 const updated=await updateSystemSettings(superAdmin,{iplDueDateDays:15,internetDueDateDays:5,internetExpiringSoonDays:3,expectedVersion:0});
 assert.equal(updated.version,1);
 const read=await getSystemSettings(resident,{});
 assert.equal(read.iplDueDateDays,15);
 await assert.rejects(updateSystemSettings(superAdmin,{iplDueDateDays:20,internetDueDateDays:5,internetExpiringSoonDays:3,expectedVersion:0}),{code:'failed-precondition'});
});

test('createBill: dueDate is set using configured iplDueDateDays (WIB, calendar-aligned to period)',async()=>{
 const period='2027-03';
 const bill=await createBill(committee,{kind:'ipl',houseId:house,period});
 const stored=(await db.doc(`ipl_bills/${bill.billId}`).get()).data();
 assert.ok(stored.dueDate instanceof Timestamp);
 // iplDueDateDays=15 (di-set test sebelumnya) -> tanggal 15 Maret 2027, 23:59:59 WIB = 16:59:59 UTC.
 assert.equal(stored.dueDate.toDate().toISOString(),'2027-03-15T16:59:59.000Z');
});
