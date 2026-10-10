const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {updateResidentProfile,saveFamilyMember,removeFamilyMember,listFamilyMembers,saveVehicle,removeVehicle,listVehicles} = require('../lib/household');
const {transferHouse} = require('../lib/operations');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore();
const tag=randomUUID(), head=`h-${tag}`, spouse=`s-${tag}`, admin=`a-${tag}`, house=`house-${tag}`;
before(async()=>{
 await db.doc(`users/${head}`).set({active:true,role:'resident',houseId:house,isHead:true,displayName:'Head'});
 await db.doc(`residents/${head}`).set({userId:head,houseId:house,fullName:'Head',status:'ACTIVE'});
 await db.doc(`users/${spouse}`).set({active:true,role:'resident',houseId:house,isHead:false,displayName:'Spouse'});
 await db.doc(`residents/${spouse}`).set({userId:spouse,houseId:house,fullName:'Spouse',status:'ACTIVE'});
 await db.doc(`users/${admin}`).set({active:true,role:'committee'});
 await db.doc(`houses/${house}`).set({active:true,primaryResidentId:head});
});
after(()=>deleteApp(app));

test('updateResidentProfile: version guard and field validation',async()=>{
 await assert.rejects(updateResidentProfile(head,{phone:'bad',expectedVersion:0}),{code:'invalid-argument'});
 const result=await updateResidentProfile(head,{phone:'+628123456789',email:'head@example.com',expectedVersion:0});
 assert.equal(result.version,1);
 const stored=(await db.doc(`residents/${head}`).get()).data();
 assert.equal(stored.phone,'+628123456789');
 await assert.rejects(updateResidentProfile(head,{phone:'+628999999999',expectedVersion:0}),{code:'failed-precondition'});
});

test('saveFamilyMember: only head can manage, idempotent create, version-guarded edit',async()=>{
 await assert.rejects(saveFamilyMember(spouse,{requestId:randomUUID(),fullName:'Anak',relationship:'ANAK'}),{code:'permission-denied'});
 await assert.rejects(saveFamilyMember(head,{requestId:randomUUID(),fullName:'Anak',relationship:'TEMAN'}),{code:'invalid-argument'});
 const requestId=randomUUID();
 const payload={requestId,fullName:'Anak Satu',relationship:'ANAK'};
 const results=await Promise.all([saveFamilyMember(head,payload),saveFamilyMember(head,payload)]);
 assert.equal(results[0].familyMemberId,results[1].familyMemberId);
 assert.equal(results[0].version,1);
 const edited=await saveFamilyMember(head,{familyMemberId:results[0].familyMemberId,expectedVersion:1,fullName:'Anak Satu Revisi',relationship:'ANAK'});
 assert.equal(edited.version,2);
 await assert.rejects(
  saveFamilyMember(head,{familyMemberId:results[0].familyMemberId,expectedVersion:1,fullName:'stale',relationship:'ANAK'}),
  {code:'failed-precondition'}
 );
});

test('listFamilyMembers: scoped to own house, excludes removed',async()=>{
 const created=await saveFamilyMember(head,{requestId:randomUUID(),fullName:'Akan Dihapus',relationship:'LAINNYA'});
 const before=await listFamilyMembers(head,{});
 assert.ok(before.items.some(x=>x.id===created.familyMemberId));
 await removeFamilyMember(head,{familyMemberId:created.familyMemberId,expectedVersion:created.version});
 const afterRemove=await listFamilyMembers(head,{});
 assert.ok(!afterRemove.items.some(x=>x.id===created.familyMemberId));
 // Idempotent: hapus lagi (sudah gak ada) tidak error.
 await removeFamilyMember(head,{familyMemberId:created.familyMemberId,expectedVersion:created.version});
});

test('saveVehicle/listVehicles: validation and own-house scoping',async()=>{
 await assert.rejects(saveVehicle(head,{requestId:randomUUID(),plateNumber:'??',type:'MOBIL'}),{code:'invalid-argument'});
 const created=await saveVehicle(head,{requestId:randomUUID(),plateNumber:'b 1234 xyz',type:'MOBIL',brand:'Toyota'});
 const stored=(await db.doc(`vehicles/${created.vehicleId}`).get()).data();
 assert.equal(stored.plateNumber,'B 1234 XYZ');
 const list=await listVehicles(head,{});
 assert.ok(list.items.some(x=>x.id===created.vehicleId));
 await removeVehicle(head,{vehicleId:created.vehicleId,expectedVersion:created.version});
 const afterRemove=await listVehicles(head,{});
 assert.ok(!afterRemove.items.some(x=>x.id===created.vehicleId));
});

test('transferHouse: committee only, deactivates all residents/family/vehicles, idempotent retry, house freed',async()=>{
 await saveFamilyMember(head,{requestId:randomUUID(),fullName:'Anak Dua',relationship:'ANAK'});
 await saveVehicle(head,{requestId:randomUUID(),plateNumber:'B 2222 XYZ',type:'MOTOR'});
 await assert.rejects(transferHouse(head,{houseId:house,reason:'pindah',requestId:randomUUID()}),{code:'permission-denied'});
 const requestId=randomUUID();
 const results=await Promise.all([
  transferHouse(admin,{houseId:house,reason:'Keluarga lama pindah',requestId}),
  transferHouse(admin,{houseId:house,reason:'Keluarga lama pindah',requestId}),
 ]);
 assert.equal(results[0].residentsDeactivated,2);
 assert.ok(results[0].familyMembersDeactivated>=1);
 assert.ok(results[0].vehiclesDeactivated>=1);
 assert.equal(results[0].residentsDeactivated,results[1].residentsDeactivated);
 const headUser=(await db.doc(`users/${head}`).get()).data();
 assert.equal(headUser.active,false);
 const headProfile=(await db.doc(`residents/${head}`).get()).data();
 assert.equal(headProfile.status,'INACTIVE');
 const houseDoc=(await db.doc(`houses/${house}`).get()).data();
 assert.equal(houseDoc.primaryResidentId,null);
 const familySnap=await db.collection('family_members').where('houseId','==',house).get();
 for(const doc of familySnap.docs) assert.equal(doc.data().active,false);
 const vehicleSnap=await db.collection('vehicles').where('houseId','==',house).get();
 for(const doc of vehicleSnap.docs) assert.equal(doc.data().active,false);
 const logs=await db.collection('audit_logs').where('resourceId','==',house).where('action','==','TRANSFER_HOUSE').get();
 assert.equal(logs.size,1);
});
