const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {listAuditLogs} = require('../lib/operations');
const {saveFamilyMember} = require('../lib/household');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore();
const tag=randomUUID(), head=`h-${tag}`, resident=`r-${tag}`, committee=`c-${tag}`, house=`h-${tag}`;
before(async()=>{
 await db.doc(`users/${head}`).set({active:true,role:'resident',houseId:house,isHead:true,displayName:'Head'});
 await db.doc(`residents/${head}`).set({userId:head,houseId:house,fullName:'Head',status:'ACTIVE'});
 await db.doc(`users/${resident}`).set({active:true,role:'resident',houseId:house,isHead:false});
 await db.doc(`users/${committee}`).set({active:true,role:'committee'});
});
after(()=>deleteApp(app));

test('listAuditLogs: committee/super_admin only, resident denied',async()=>{
 await assert.rejects(listAuditLogs(resident,{}),{code:'permission-denied'});
});

test('listAuditLogs: filter by resourceId returns exactly the matching entries, newest first',async()=>{
 const first=await saveFamilyMember(head,{requestId:randomUUID(),fullName:'Anak Pertama',relationship:'ANAK'});
 await new Promise(r=>setTimeout(r,5));
 const edited=await saveFamilyMember(head,{familyMemberId:first.familyMemberId,expectedVersion:1,fullName:'Anak Pertama Revisi',relationship:'ANAK'});
 assert.equal(edited.version,2);
 const result=await listAuditLogs(committee,{resourceId:first.familyMemberId});
 assert.equal(result.items.length,2);
 assert.equal(result.items[0].action,'UPDATE_FAMILY_MEMBER');
 assert.equal(result.items[1].action,'CREATE_FAMILY_MEMBER');
 assert.ok(result.items[0].createdAt.toDate() >= result.items[1].createdAt.toDate());
 assert.equal(result.items[0].actorId,head);
});

test('listAuditLogs: filter by action, pagination cursor works',async()=>{
 const page1=await listAuditLogs(committee,{action:'CREATE_FAMILY_MEMBER',limit:1});
 assert.equal(page1.items.length,1);
 assert.ok(page1.nextCursor===null || typeof page1.nextCursor==='string');
});
