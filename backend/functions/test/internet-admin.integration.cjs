const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore,Timestamp} = require('firebase-admin/firestore');
const {listAdminRecords} = require('../lib/operations');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore();
const tag=randomUUID(), resident=`r-${tag}`, committee=`c-${tag}`, house=`house-${tag}`;
before(async()=>{
 await db.doc(`users/${resident}`).set({active:true,role:'resident',houseId:house,isHead:true});
 await db.doc(`users/${committee}`).set({active:true,role:'committee'});
 await db.doc(`internet_subscriptions/${house}`).set({status:'PENDING_ACTIVATION',primaryResidentId:resident,packageId:'INTERNET_50',activeUntil:Timestamp.fromMillis(Date.now()+86400000),lastApprovedPaymentId:'pay-1'});
});
after(()=>deleteApp(app));

test('listAdminRecords internet_subscriptions: pengurus bisa, warga ditolak, field dibatasi',async()=>{
 await assert.rejects(listAdminRecords(resident,{resource:'internet_subscriptions',limit:50}),{code:'permission-denied'});
 const res=await listAdminRecords(committee,{resource:'internet_subscriptions',limit:50});
 const row=res.items.find(x=>x.id===house);
 assert.ok(row, 'langganan rumah uji harus muncul');
 assert.equal(row.status,'PENDING_ACTIVATION');
 assert.equal(row.lastApprovedPaymentId,'pay-1');
 assert.equal(row.activatedBy,undefined);
});
