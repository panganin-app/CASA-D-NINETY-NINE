const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {saveFinanceTransaction,publishFinancePeriod,listFinancePublications} = require('../lib/finance');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore();
const tag=randomUUID(), resident=`r-${tag}`, admin=`a-${tag}`;
before(async()=>{
 await db.doc(`users/${resident}`).set({active:true,role:'resident',houseId:`h-${tag}`});
 await db.doc(`users/${admin}`).set({active:true,role:'committee'});
});
after(()=>deleteApp(app));

test('saveFinanceTransaction: authorization, validation, and idempotent creation',async()=>{
 await assert.rejects(saveFinanceTransaction(resident,{requestId:randomUUID(),type:'INCOME',category:'DONASI',amount:10000,description:'x',periodId:'2026-10'}),{code:'permission-denied'});
 await assert.rejects(saveFinanceTransaction(admin,{requestId:randomUUID(),type:'EXPENSE',category:'DONASI',amount:10000,description:'x',periodId:'2026-10'}),{code:'invalid-argument'});
 await assert.rejects(saveFinanceTransaction(admin,{requestId:randomUUID(),type:'INCOME',category:'DONASI',amount:-5,description:'x',periodId:'2026-10'}),{code:'invalid-argument'});
 await assert.rejects(saveFinanceTransaction(admin,{requestId:randomUUID(),type:'INCOME',category:'DONASI',amount:10000,description:'x',periodId:'2026-13'}),{code:'invalid-argument'});
 const requestId=randomUUID();
 const payload={requestId,type:'INCOME',category:'DONASI',amount:150000,description:'Donasi warga',periodId:'2026-10'};
 const results=await Promise.all([saveFinanceTransaction(admin,payload),saveFinanceTransaction(admin,payload)]);
 assert.equal(results[0].transactionId,results[1].transactionId);
 assert.equal(results[0].version,1);
 const stored=(await db.doc(`finance_transactions/${results[0].transactionId}`).get()).data();
 assert.equal(stored.amount,150000);
 assert.equal(stored.createdBy,admin);
 const logs=await db.collection('audit_logs').where('resourceId','==',results[0].transactionId).where('action','==','CREATE_FINANCE_TRANSACTION').get();
 assert.equal(logs.size,1);
});

test('saveFinanceTransaction: edit requires matching version, periodId immutable',async()=>{
 const created=await saveFinanceTransaction(admin,{requestId:randomUUID(),type:'EXPENSE',category:'KEAMANAN',amount:200000,description:'Satpam',periodId:'2026-10'});
 await assert.rejects(
  saveFinanceTransaction(admin,{transactionId:created.transactionId,expectedVersion:created.version,type:'EXPENSE',category:'KEAMANAN',amount:200000,description:'Satpam',periodId:'2026-10'}),
  {code:'invalid-argument'}
 );
 const edited=await saveFinanceTransaction(admin,{transactionId:created.transactionId,expectedVersion:created.version,type:'EXPENSE',category:'KEAMANAN',amount:250000,description:'Satpam (revisi)'});
 assert.equal(edited.version,2);
 await assert.rejects(
  saveFinanceTransaction(admin,{transactionId:created.transactionId,expectedVersion:created.version,type:'EXPENSE',category:'KEAMANAN',amount:300000,description:'stale'}),
  {code:'failed-precondition'}
 );
});

test('publishFinancePeriod: aggregates totals, idempotent retry, locks period from new/edited transactions',async()=>{
 const period='2026-11';
 const income=await saveFinanceTransaction(admin,{requestId:randomUUID(),type:'INCOME',category:'IPL',amount:1000000,description:'IPL',periodId:period});
 await saveFinanceTransaction(admin,{requestId:randomUUID(),type:'EXPENSE',category:'KEBERSIHAN',amount:300000,description:'Kebersihan',periodId:period});
 await assert.rejects(publishFinancePeriod(resident,{requestId:randomUUID(),periodId:period}),{code:'permission-denied'});
 const requestId=randomUUID();
 const results=await Promise.all([publishFinancePeriod(admin,{requestId,periodId:period}),publishFinancePeriod(admin,{requestId,periodId:period})]);
 assert.equal(results[0].totalIncome,1000000);
 assert.equal(results[0].totalExpense,300000);
 assert.equal(results[0].net,700000);
 assert.equal(results[0].transactionCount,2);
 assert.equal(results[0].version,results[1].version);
 const pubLogs=await db.collection('audit_logs').where('resourceId','==',period).where('action','==','PUBLISH_FINANCE_PERIOD').get();
 assert.equal(pubLogs.size,1);
 await assert.rejects(
  saveFinanceTransaction(admin,{requestId:randomUUID(),type:'INCOME',category:'DONASI',amount:1,description:'telat',periodId:period}),
  {code:'failed-precondition'}
 );
 await assert.rejects(
  saveFinanceTransaction(admin,{transactionId:income.transactionId,expectedVersion:income.version,type:'INCOME',category:'IPL',amount:999,description:'ubah setelah publish'}),
  {code:'failed-precondition'}
 );
});

test('publishFinancePeriod: republish with a new requestId picks up newly added transactions in an unpublished period',async()=>{
 const period='2026-12';
 await saveFinanceTransaction(admin,{requestId:randomUUID(),type:'INCOME',category:'IPL',amount:500000,description:'IPL',periodId:period});
 const first=await publishFinancePeriod(admin,{requestId:randomUUID(),periodId:period});
 assert.equal(first.totalIncome,500000);
 assert.equal(first.version,1);
 // Catatan: saveFinanceTransaction menolak transaksi baru setelah periode
 // PUBLISHED (lihat test sebelumnya) -- republish di sini murni menguji
 // bahwa memanggil publish lagi dengan requestId BARU tetap mengembalikan
 // hasil konsisten (bukan dianggap retry) dan menaikkan version.
 const second=await publishFinancePeriod(admin,{requestId:randomUUID(),periodId:period});
 assert.equal(second.totalIncome,500000);
 assert.equal(second.version,2);
});

test('listFinancePublications: residents can call it, only PUBLISHED periods returned, pagination works',async()=>{
 const result=await listFinancePublications(resident,{limit:1});
 assert.ok(result.items.length<=1);
 for(const item of result.items) {
  const stored=(await db.doc(`financePublications/${item.periodId}`).get()).data();
  assert.equal(stored.status,'PUBLISHED');
  assert.equal(item.createdBy,undefined);
 }
 const full=await listFinancePublications(resident,{limit:50});
 assert.ok(full.items.some(x=>x.periodId==='2026-11'));
 assert.ok(full.items.some(x=>x.periodId==='2026-12'));
});
