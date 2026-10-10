const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore,Timestamp} = require('firebase-admin/firestore');
const {updateInternetSubscriptionStatuses} = require('../lib/internet-lifecycle');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing'}), db=getFirestore();
const tag=randomUUID(), resident=`r-${tag}`, committee=`c-${tag}`;
const healthy=`healthy-${tag}`, soon=`soon-${tag}`, expired=`expired-${tag}`, pending=`pending-${tag}`, suspended=`suspended-${tag}`;
const DAY=86400000;
before(async()=>{
 await db.doc(`users/${resident}`).set({active:true,role:'resident'});
 await db.doc(`users/${committee}`).set({active:true,role:'committee'});
 const now=Date.now();
 await db.doc(`internet_subscriptions/${healthy}`).set({status:'ACTIVE',primaryResidentId:resident,activeUntil:Timestamp.fromMillis(now+30*DAY)});
 await db.doc(`internet_subscriptions/${soon}`).set({status:'ACTIVE',primaryResidentId:resident,activeUntil:Timestamp.fromMillis(now+2*DAY)});
 await db.doc(`internet_subscriptions/${expired}`).set({status:'EXPIRING_SOON',primaryResidentId:resident,activeUntil:Timestamp.fromMillis(now-DAY)});
 await db.doc(`internet_subscriptions/${pending}`).set({status:'PENDING_ACTIVATION',primaryResidentId:resident,activeUntil:Timestamp.fromMillis(now-DAY)});
 await db.doc(`internet_subscriptions/${suspended}`).set({status:'SUSPENDED',primaryResidentId:resident,activeUntil:Timestamp.fromMillis(now-DAY)});
});
after(()=>deleteApp(app));

test('updateInternetSubscriptionStatuses: committee only',async()=>{
 await assert.rejects(updateInternetSubscriptionStatuses(resident,{}),{code:'permission-denied'});
});

// CATATAN: nilai threshold (2 hari lagi vs 30 hari lagi) sengaja jauh di
// kedua sisi supaya hasilnya BENAR apa pun internetExpiringSoonDays yang
// ke-set test lain di project emulator yang sama (system-settings.
// integration.cjs ikut mengubah system_settings/general secara global).
test('updateInternetSubscriptionStatuses: healthy stays ACTIVE, near-expiry becomes EXPIRING_SOON, past becomes EXPIRED, PENDING_ACTIVATION/SUSPENDED untouched',async()=>{
 const run=await updateInternetSubscriptionStatuses(committee,{limit:50});
 const byId=Object.fromEntries(run.results.map(r=>[r.houseId,r]));
 assert.equal(byId[healthy].status,'ACTIVE');
 assert.equal(byId[healthy].changed,false);
 assert.equal(byId[soon].status,'EXPIRING_SOON');
 assert.equal(byId[soon].changed,true);
 assert.equal(byId[expired].status,'EXPIRED');
 assert.equal(byId[expired].changed,true);
 assert.equal(byId[pending].status,'PENDING_ACTIVATION');
 assert.equal(byId[pending].changed,false);
 assert.equal(byId[suspended].status,'SUSPENDED');
 assert.equal(byId[suspended].changed,false);
 const soonNotif=(await db.doc(`notification_outbox/internet_lifecycle_${soon}_EXPIRING_SOON`).get()).data();
 assert.equal(soonNotif.residentId,resident);
 assert.equal(soonNotif.type,'INTERNET_EXPIRING_SOON');
 const expiredNotif=(await db.doc(`notification_outbox/internet_lifecycle_${expired}_EXPIRED`).get()).data();
 assert.equal(expiredNotif.type,'INTERNET_EXPIRED');
});

test('updateInternetSubscriptionStatuses: re-running is idempotent (no duplicate notification, no error)',async()=>{
 const again=await updateInternetSubscriptionStatuses(committee,{limit:50});
 const byId=Object.fromEntries(again.results.map(r=>[r.houseId,r]));
 assert.equal(byId[soon].changed,false);
 assert.equal(byId[expired].changed,false);
});
