const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getAuth} = require('firebase-admin/auth');
const {getFirestore,Timestamp} = require('firebase-admin/firestore');
const {requestAccountDeletion,restoreAccount,purgeExpiredAccounts} = require('../lib/account-deletion');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore(), auth=getAuth(app);
const tag=randomUUID();
const warga=`w-${tag}`, committee=`c-${tag}`, lama=`l-${tag}`, house=`house-del-${tag}`;
before(async()=>{
 await auth.createUser({uid:warga,email:`${warga}@example.test`,password:'uji-sandi-1'});
 await auth.createUser({uid:lama,email:`${lama}@example.test`,password:'uji-sandi-2'});
 await auth.createUser({uid:committee,email:`${committee}@example.test`,password:'uji-sandi-3'});
 await db.doc(`users/${warga}`).set({active:true,role:'resident',houseId:house,isHead:true,displayName:'Warga'});
 await db.doc(`residents/${warga}`).set({userId:warga,houseId:house,fullName:'Warga',status:'ACTIVE'});
 await db.doc(`users/${committee}`).set({active:true,role:'committee'});
 await db.doc(`houses/${house}`).set({active:true,primaryResidentId:warga});
});
after(()=>deleteApp(app));

test('warga minta hapus: akun dikunci dan dijadwalkan 14 hari',async()=>{
 const res=await requestAccountDeletion(warga,{});
 const days=(new Date(res.purgeAfter).getTime()-Date.now())/86400000;
 assert.ok(days>13.9 && days<14.1, `purgeAfter ~14 hari, dapat ${days}`);
 const u=(await db.doc(`users/${warga}`).get()).data();
 assert.equal(u.active,false);
 assert.equal((await auth.getUser(warga)).disabled,true);
 assert.equal((await db.doc(`residents/${warga}`).get()).data().status,'PENDING_DELETION');
});

test('minta hapus lagi tidak menggeser jadwal',async()=>{
 const first=(await db.doc(`users/${warga}`).get()).data().deletionPurgeAfter.toMillis();
 const res=await requestAccountDeletion(warga,{});
 assert.equal(res.alreadyRequested,true);
 assert.equal((await db.doc(`users/${warga}`).get()).data().deletionPurgeAfter.toMillis(),first);
});

test('pemulihan: hanya pengurus, dan wajib alasan',async()=>{
 await assert.rejects(restoreAccount(warga,{residentUid:warga,reason:'saya sendiri'}),{code:'permission-denied'});
 await assert.rejects(restoreAccount(committee,{residentUid:warga,reason:'   '}),{code:'invalid-argument'});
 await restoreAccount(committee,{residentUid:warga,reason:'Warga minta dibatalkan'});
 assert.equal((await db.doc(`users/${warga}`).get()).data().active,true);
 assert.equal((await auth.getUser(warga)).disabled,false);
 assert.equal((await db.doc(`residents/${warga}`).get()).data().status,'ACTIVE');
});

test('pembersihan setelah 14 hari: data pribadi & akun Auth dihapus, rumah dilepas',async()=>{
 await requestAccountDeletion(warga,{});
 // Majukan jadwal ke masa lalu supaya layak dibersihkan.
 await db.doc(`users/${warga}`).update({deletionPurgeAfter:Timestamp.fromMillis(Date.now()-1000)});
 await db.collection('notifications').doc(`n-${tag}`).set({residentId:warga,title:'uji'});
 const res=await purgeExpiredAccounts(committee,{limit:50});
 assert.ok(res.purged.includes(warga));
 assert.equal((await db.doc(`users/${warga}`).get()).exists,false);
 assert.equal((await db.doc(`residents/${warga}`).get()).exists,false);
 assert.equal((await db.collection('notifications').doc(`n-${tag}`).get()).exists,false);
 assert.equal((await db.doc(`houses/${house}`).get()).data().primaryResidentId,null);
 await assert.rejects(auth.getUser(warga),{code:'auth/user-not-found'});
 const again=await purgeExpiredAccounts(committee,{limit:50});
 assert.ok(!again.purged.includes(warga));
});

test('pemulihan ditolak setelah masa 14 hari lewat',async()=>{
 await db.doc(`users/${lama}`).set({active:false,role:'resident',houseId:house,deletionRequestedAt:Timestamp.fromMillis(Date.now()-20*86400000),deletionPurgeAfter:Timestamp.fromMillis(Date.now()-86400000)});
 await assert.rejects(restoreAccount(committee,{residentUid:lama,reason:'terlambat'}),{code:'failed-precondition'});
});
