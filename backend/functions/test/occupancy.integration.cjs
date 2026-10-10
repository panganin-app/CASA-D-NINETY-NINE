const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {setHouseOccupancy} = require('../lib/operations');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore();
const tag=randomUUID(), resident=`r-${tag}`, committee=`c-${tag}`, house=`house-${tag}`;
before(async()=>{
 await db.doc(`users/${resident}`).set({active:true,role:'resident',houseId:house,isHead:true});
 await db.doc(`users/${committee}`).set({active:true,role:'committee'});
 await db.doc(`houses/${house}`).set({active:true,primaryResidentId:resident,label:'Blok Uji'});
});
after(()=>deleteApp(app));

test('setHouseOccupancy: hanya pengurus, hanya nilai OWNER/RENTER',async()=>{
 await assert.rejects(setHouseOccupancy(resident,{houseId:house,occupancyType:'OWNER',reason:'klaim sendiri',requestId:randomUUID()}),{code:'permission-denied'});
 await assert.rejects(setHouseOccupancy(committee,{houseId:house,occupancyType:'BORROWER',reason:'x',requestId:randomUUID()}),{code:'invalid-argument'});
});

test('setHouseOccupancy: menyimpan status dan idempoten untuk request yang sama',async()=>{
 const requestId=randomUUID();
 const payload={houseId:house,occupancyType:'RENTER',reason:'Kontrak tahunan',requestId};
 const results=await Promise.all([setHouseOccupancy(committee,payload),setHouseOccupancy(committee,payload)]);
 assert.equal(results[0].occupancyType,'RENTER');
 assert.equal((await db.doc(`houses/${house}`).get()).data().occupancyType,'RENTER');
 const logs=await db.collection('audit_logs').where('resourceId','==',house).where('action','==','SET_HOUSE_OCCUPANCY').get();
 assert.equal(logs.size,1);
});

test('setHouseOccupancy: request ID sama dengan isi berbeda ditolak',async()=>{
 const requestId=randomUUID();
 await setHouseOccupancy(committee,{houseId:house,occupancyType:'OWNER',reason:'Sertifikat',requestId});
 await assert.rejects(setHouseOccupancy(committee,{houseId:house,occupancyType:'RENTER',reason:'Sertifikat',requestId}),{code:'already-exists'});
});
