const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore,Timestamp} = require('firebase-admin/firestore');
const {createBill,submitPayment,verifyPayment} = require('../lib/billing');
assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Emulator required');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-casa-billing');
const app=initializeApp({projectId:'demo-casa-billing',storageBucket:'demo-casa-billing.firebasestorage.app'}), db=getFirestore();
const tag=randomUUID(), resident=`r-${tag}`, admin=`a-${tag}`, other=`o-${tag}`, house=`h-${tag}`;
before(async()=>{
 await db.doc(`users/${resident}`).set({active:true,role:'resident',houseId:house});
 await db.doc(`users/${admin}`).set({active:true,role:'committee'});
 await db.doc(`users/${other}`).set({active:true,role:'resident',houseId:'other'});
 await db.doc(`houses/${house}`).set({active:true,primaryResidentId:resident});
});
after(()=>deleteApp(app));
async function proof(kind,billId){
 const proofId=randomUUID();
 // Trusted validator fixture for transaction tests; real decoder/upload is tested separately.
 await db.doc(`payment_proofs/${proofId}`).set({ownerId:resident,kind,billId,status:'VALIDATED'});
 return proofId;
}
test('IPL: concurrent creation, authorization, submission, reject/resubmit and double approval',async()=>{
 const payload={kind:'ipl',houseId:house,period:'2026-10'};
 await assert.rejects(createBill(resident,payload),{code:'permission-denied'});
 await assert.rejects(createBill(admin,{...payload,amount:1}),{code:'invalid-argument'});
 const bills=await Promise.all([createBill(admin,payload),createBill(admin,payload)]);
 assert.equal(bills[0].billId,bills[1].billId);
 const billId=bills[0].billId;
 assert.equal(bills[0].amount,100000);
 const proofId=await proof('ipl',billId);
 const submission={kind:'ipl',billId,proofId,requestId:randomUUID()};
 await assert.rejects(submitPayment(other,submission),{code:'permission-denied'});
 await assert.rejects(submitPayment(resident,{...submission,proofId:'missing'}),{code:'failed-precondition'});
 const payments=await Promise.all([submitPayment(resident,submission),submitPayment(resident,submission)]);
 assert.equal(payments[0].paymentId,payments[1].paymentId);
 const paymentId=payments[0].paymentId;
 await assert.rejects(submitPayment(resident,{...submission,requestId:randomUUID()}),{code:'failed-precondition'});
 await assert.rejects(verifyPayment(resident,{kind:'ipl',paymentId,decision:'APPROVED'}),{code:'permission-denied'});
 await assert.rejects(verifyPayment(admin,{kind:'ipl',paymentId,decision:'REJECTED'}),{code:'invalid-argument'});
 await verifyPayment(admin,{kind:'ipl',paymentId,decision:'REJECTED',reason:'Bukti buram'});
 assert.equal((await db.doc(`ipl_bills/${billId}`).get()).data().status,'UNPAID');
 const next=await submitPayment(resident,{...submission,requestId:randomUUID(),proofId:await proof('ipl',billId)});
 await Promise.all([1,2].map(()=>verifyPayment(admin,{kind:'ipl',paymentId:next.paymentId,decision:'APPROVED'})));
 assert.equal((await db.doc(`ipl_bills/${billId}`).get()).data().status,'PAID');
 const logs=await db.collection('audit_logs').where('resourceId','==',next.paymentId).where('action','==','VERIFY_PAYMENT').get();
 assert.equal(logs.size,1);
 await assert.rejects(verifyPayment(admin,{kind:'ipl',paymentId:next.paymentId,decision:'REJECTED',reason:'retry'}),{code:'failed-precondition'});
});
test('Internet: trusted price, open bill lock, once-only calendar renewal and notification outbox',async()=>{
 const payload={kind:'internet',houseId:house,period:'2026-10',packageId:'INTERNET_50',requestId:randomUUID()};
 await assert.rejects(createBill(resident,{...payload,packageId:'__proto__'}),{code:'invalid-argument'});
 const bill=await createBill(resident,payload);
 assert.equal(bill.amount,180000);
 await assert.rejects(createBill(resident,{...payload,requestId:randomUUID()}),{code:'failed-precondition'});
 const previous=Timestamp.fromDate(new Date('2030-01-30T17:00:00Z'));
 await db.doc(`internet_subscriptions/${house}`).set({activeUntil:previous});
 const payment=await submitPayment(resident,{kind:'internet',billId:bill.billId,proofId:await proof('internet',bill.billId),requestId:randomUUID()});
 await Promise.all([1,2,3].map(()=>verifyPayment(admin,{kind:'internet',paymentId:payment.paymentId,decision:'APPROVED'})));
 const sub=(await db.doc(`internet_subscriptions/${house}`).get()).data();
 assert.equal(sub.activeUntil.toDate().toISOString(),'2030-02-27T17:00:00.000Z');
 assert.equal(sub.status,'PENDING_ACTIVATION');
 assert.equal((await db.doc(`notification_outbox/internet_${payment.paymentId}`).get()).data().status,'PENDING');
 assert.equal((await db.doc(`internet_open_bills/${house}`).get()).exists,false);
});

test('real upload: decoder validation, private storage, owner/admin read and payment submission',async()=>{
 const sharp=require('sharp');
 const {uploadPaymentProof,getPaymentProof,sanitizeProof}=require('../lib/proofs');
 const image=await sharp({create:{width:30,height:30,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(sanitizeProof(Buffer.from('<svg onload="alert(1)"/>').toString('base64')),{code:'invalid-argument'});
 await assert.rejects(sanitizeProof('not-base64'),{code:'invalid-argument'});
 await assert.rejects(sanitizeProof(Buffer.from('not a png').toString('base64')),{code:'invalid-argument'});
 const bill=await createBill(admin,{kind:'ipl',houseId:house,period:'2026-11'});
 const payload={kind:'ipl',billId:bill.billId,imageBase64:image.toString('base64')};
 await assert.rejects(uploadPaymentProof(other,payload),{code:'permission-denied'});
 const {proofId}=await uploadPaymentProof(resident,payload);
 const record=(await db.doc(`payment_proofs/${proofId}`).get()).data();
 assert.equal(record.status,'VALIDATED');
 const own=await getPaymentProof(resident,{proofId});
 assert.equal(own.contentType,'image/jpeg');
 assert.equal((await getPaymentProof(admin,{proofId})).imageBase64,own.imageBase64);
 await assert.rejects(getPaymentProof(other,{proofId}),{code:'permission-denied'});
 const storageUrl=`http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/demo-casa-billing.firebasestorage.app/o/${encodeURIComponent(record.path)}?alt=media`;
 assert.equal((await fetch(storageUrl)).status,403);
 const submitted=await submitPayment(resident,{kind:'ipl',billId:bill.billId,proofId,requestId:randomUUID()});
 assert.equal(submitted.status,'PENDING_VERIFICATION');
 await assert.rejects(uploadPaymentProof(resident,payload),{code:'failed-precondition'});
});

test('callable endpoints enforce authentication and select separate bank configs',async()=>{
 const call=async(name,data={},token)=>{
  const response=await fetch(`http://127.0.0.1:5101/demo-casa-billing/asia-southeast2/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({data})});
  return {status:response.status,body:await response.json()};
 };
 assert.equal((await call('createBill')).status,401);
 const signup=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${randomUUID()}@example.test`,password:randomUUID(),returnSecureToken:true})});
 const {localId,idToken}=await signup.json();
 assert.equal((await call('getBillingCatalog',{},idToken)).status,403);
 await db.doc(`users/${localId}`).set({active:true,houseId:house,role:'resident'});
 assert.equal((await call('getMyHousehold',{},idToken)).body.result.houseId,house);
 assert.equal((await call('getBillingCatalog',{},idToken)).body.result.iplAmount,100000);
 for(const kind of ['ipl','internet']){
  await db.doc(`payment_config/${kind}`).set({bank:'BCA',accountNumber:kind==='ipl'?'0000000001':'0000000002',accountHolder:`TEST ${kind}`});
  await db.doc(`${kind}_bills/http-${tag}`).set({houseId:house,amount:kind==='ipl'?100000:180000});
  const result=await call('getPaymentInstructions',{kind,billId:`http-${tag}`},idToken);
  assert.equal(result.status,200);
  assert.equal(result.body.result.accountHolder,`TEST ${kind}`);
 }
 assert.equal((await call('verifyPayment',{kind:'ipl',paymentId:'anything',decision:'APPROVED'},idToken)).status,403);
});

test('admin house/resident management: authorization, uniqueness, immutable role and account disable',async()=>{
 const {createHouse,registerResident,setResidentActive,listAdminRecords}=require('../lib/operations');
 const {getAuth}=require('firebase-admin/auth');
 const newHouse=`new-${tag}`,newUid=`newresident-${tag}`;
 const fields={houseId:newHouse,block:`B-${tag.slice(0,8)}`,houseNumber:'12'};
 await assert.rejects(createHouse(resident,fields),{code:'permission-denied'});
 const created=await Promise.all([createHouse(admin,fields),createHouse(admin,fields)]);
 assert.equal(created.filter(x=>x.created).length,1);
 await assert.rejects(createHouse(admin,{...fields,houseId:`duplicate-${tag}`} ),{code:'already-exists'});
 await assert.rejects(createHouse(admin,{...fields,role:'super_admin'}),{code:'invalid-argument'});
 await getAuth().createUser({uid:newUid});
 const registration={residentUid:newUid,houseId:newHouse,fullName:'Warga Uji',isHead:true};
 await registerResident(admin,registration);
 assert.equal((await registerResident(admin,registration)).created,false);
 assert.equal((await db.doc(`houses/${newHouse}`).get()).data().primaryResidentId,newUid);
 await assert.rejects(registerResident(admin,{...registration,houseId:house}),{code:'already-exists'});
 await assert.rejects(registerResident(admin,{...registration,role:'committee'}),{code:'invalid-argument'});
 await getAuth().createUser({uid:`second-${tag}`});
 await assert.rejects(registerResident(admin,{...registration,residentUid:`second-${tag}`}),{code:'failed-precondition'});
 await assert.rejects(setResidentActive(admin,{residentUid:admin,active:false,reason:'test'}),{code:'permission-denied'});
 await setResidentActive(admin,{residentUid:newUid,active:false,reason:'Permintaan warga uji'});
 await assert.rejects(createBill(newUid,{kind:'internet',houseId:newHouse,period:'2026-10',packageId:'INTERNET_25',requestId:randomUUID()}),{code:'permission-denied'});
 await setResidentActive(admin,{residentUid:newUid,active:true,reason:'Aktivasi ulang uji'});
 await assert.rejects(listAdminRecords(resident,{resource:'residents'}),{code:'permission-denied'});
 await assert.rejects(listAdminRecords(admin,{resource:'payment_config'}),{code:'invalid-argument'});
 await assert.rejects(listAdminRecords(admin,{resource:'houses',limit:1000}),{code:'invalid-argument'});
 const page=await listAdminRecords(admin,{resource:'houses',limit:1});
 assert.equal(page.items.length,1);
 assert.ok(page.nextCursor);
 const page2=await listAdminRecords(admin,{resource:'houses',limit:1,afterId:page.nextCursor});
 assert.notEqual(page2.items[0].id,page.items[0].id);
});

test('manual internet activation: approved latest payment, no double effect, reason and permission',async()=>{
 const {activateInternetService,listAdminRecords}=require('../lib/operations');
 const subscription=(await db.doc(`internet_subscriptions/${house}`).get()).data();
 const paymentId=subscription.lastApprovedPaymentId;
 const input={houseId:house,paymentId,requestId:randomUUID(),reason:'Teknisi mengonfirmasi aktivasi manual'};
 await assert.rejects(activateInternetService(resident,input),{code:'permission-denied'});
 await assert.rejects(activateInternetService(admin,{...input,reason:''}),{code:'invalid-argument'});
 await assert.rejects(activateInternetService(admin,{...input,paymentId:'missing'}),{code:'failed-precondition'});
 const result=await Promise.all([activateInternetService(admin,input),activateInternetService(admin,input)]);
 assert.equal(result[0].status,'ACTIVE');
 assert.equal(result[1].status,'ACTIVE');
 const activated=(await db.doc(`internet_subscriptions/${house}`).get()).data();
 assert.equal(activated.activeUntil.toMillis(),subscription.activeUntil.toMillis());
 assert.equal(activated.activatedBy,admin);
 const audit=await db.collection('audit_logs').where('resourceId','==',house).where('action','==','ACTIVATE_INTERNET').get();
 assert.equal(audit.size,1);
 await assert.rejects(activateInternetService(admin,{...input,reason:'changed'}),{code:'already-exists'});
 await assert.rejects(activateInternetService(admin,{...input,requestId:randomUUID()}),{code:'failed-precondition'});
 const queue=await listAdminRecords(admin,{resource:'ipl_payments'});
 assert.ok(queue.items.length>0);
 assert.ok(queue.items.every(p=>p.status==='PENDING_VERIFICATION'));
 assert.ok(queue.items.every(p=>!('imageBase64' in p)&&!('accountNumber' in p)));
});

test('community: draft privacy, admin publishing, optimistic version and event dates',async()=>{
 const {saveCommunityContent,listPublishedContent}=require('../lib/community');
 const {listAdminRecords}=require('../lib/operations');
 const payload={type:'announcements',contentId:'notice-'+tag,title:'Kerja bakti',description:'Minggu pagi',status:'DRAFT',expectedVersion:0};
 await assert.rejects(saveCommunityContent(resident,payload),{code:'permission-denied'});
 assert.equal((await saveCommunityContent(admin,payload)).version,1);
 assert.ok(!(await listPublishedContent(resident,{type:'announcements'})).items.some(x=>x.id===payload.contentId));
 await assert.rejects(saveCommunityContent(admin,{...payload,status:'PUBLISHED'}),{code:'failed-precondition'});
 await saveCommunityContent(admin,{...payload,status:'PUBLISHED',expectedVersion:1});
 assert.ok((await listPublishedContent(resident,{type:'announcements'})).items.some(x=>x.id===payload.contentId));
 assert.ok((await listAdminRecords(admin,{resource:'announcements'})).items.some(x=>x.id===payload.contentId));
 await saveCommunityContent(admin,{...payload,status:'ARCHIVED',expectedVersion:2});
 assert.ok(!(await listPublishedContent(resident,{type:'announcements'})).items.some(x=>x.id===payload.contentId));
 const agenda={...payload,type:'events',contentId:'event-'+tag,startsAt:'2026-10-11T00:00:00Z',endsAt:'2026-10-11T02:00:00Z',location:'Pos warga',status:'PUBLISHED'};
 await assert.rejects(saveCommunityContent(admin,{...agenda,endsAt:agenda.startsAt}),{code:'invalid-argument'});
 await assert.rejects(saveCommunityContent(admin,{...agenda,startsAt:'2026-02-30T00:00:00Z'}),{code:'invalid-argument'});
 await saveCommunityContent(admin,agenda);
 assert.ok((await listPublishedContent(resident,{type:'events'})).items.some(x=>x.id===agenda.contentId));
});
test('reports: ownership, idempotent create, transition/version guards and closure',async()=>{
 const {createResidentReport,updateReportStatus}=require('../lib/community');
 const {listAdminRecords}=require('../lib/operations');
 const payload={requestId:randomUUID(),category:'CLEANLINESS',title:'Sampah belum diangkut',description:'Di dekat pos warga'};
 await assert.rejects(createResidentReport(resident,{...payload,houseId:'other'}),{code:'invalid-argument'});
 const [a,b]=await Promise.all([createResidentReport(resident,payload),createResidentReport(resident,payload)]);
 assert.equal(a.reportId,b.reportId);
 await assert.rejects(createResidentReport(resident,{...payload,title:'Changed'}),{code:'already-exists'});
 const transition={reportId:a.reportId,status:'IN_REVIEW',expectedVersion:1,reason:'Pengurus memeriksa',requestId:randomUUID()};
 await assert.rejects(updateReportStatus(resident,transition),{code:'permission-denied'});
 await assert.rejects(updateReportStatus(admin,{...transition,status:'CLOSED'}),{code:'failed-precondition'});
 const [x,y]=await Promise.all([updateReportStatus(admin,transition),updateReportStatus(admin,transition)]);
 assert.deepEqual(x,y);assert.equal(x.version,2);
 await assert.rejects(updateReportStatus(admin,{...transition,requestId:randomUUID()}),{code:'failed-precondition'});
 let version=2;
 for(const status of ['IN_PROGRESS','RESOLVED','CLOSED']) await updateReportStatus(admin,{reportId:a.reportId,status,expectedVersion:version++,reason:'Tindak lanjut pengurus',requestId:randomUUID()});
 assert.equal((await db.doc('reports/'+a.reportId).get()).data().status,'CLOSED');
 assert.equal((await db.collection('report_events').where('reportId','==',a.reportId).get()).size,4);
 assert.ok((await listAdminRecords(admin,{resource:'reports'})).items.some(x=>x.id===a.reportId));
});
test('notifications: trigger delivery, concurrent retry, private read acknowledgement and inactive hold',async()=>{
 const {deliverNotification,markNotificationRead,reconcileNotifications}=require('../lib/notifications');
 const id='notice-'+tag;
 await db.doc('notification_outbox/'+id).set({residentId:resident,paymentId:'payment-'+tag,decision:'APPROVED',status:'PENDING'});
 // Verify the registered emulator trigger, not just direct service invocation.
 let notification;
 for(let i=0;i<60;i++) {notification=await db.doc('notifications/'+id).get();if(notification.exists) break;await new Promise(r=>setTimeout(r,250));}
 assert.ok(notification.exists,'Firestore trigger must deliver inbox notification');
 await Promise.all([deliverNotification(id),deliverNotification(id)]);
 assert.equal((await db.doc('notification_outbox/'+id).get()).data().deliveryStatus,'DELIVERED');
 assert.equal(notification.data().channel,'IN_APP');
 await assert.rejects(markNotificationRead(other,{notificationId:id}),{code:'permission-denied'});
 await markNotificationRead(resident,{notificationId:id});
 const readAt=(await db.doc('notifications/'+id).get()).data().readAt.toMillis();
 await markNotificationRead(resident,{notificationId:id});
 assert.equal((await db.doc('notifications/'+id).get()).data().readAt.toMillis(),readAt);
 const disabled='disabled-'+tag,held='held-'+tag;
 await db.doc('users/'+disabled).set({active:false,role:'resident'});
 await db.doc('notification_outbox/'+held).set({residentId:disabled,paymentId:'fixture',decision:'REJECTED'});
 assert.equal((await deliverNotification(held)).delivered,false);
 assert.equal((await db.doc('notifications/'+held).get()).exists,false);
 await assert.rejects(reconcileNotifications(resident,{}),{code:'permission-denied'});
 await db.doc('users/'+disabled).update({active:true});
 assert.equal((await deliverNotification(held)).delivered,true);
});
test('monthly IPL: bounded admin batch, cursor and repeat without duplicate or resetting PAID',async()=>{
 const {generateMonthlyIpl}=require('../lib/monthly-ipl');
 await assert.rejects(generateMonthlyIpl(resident,{period:'2026-10'}),{code:'permission-denied'});
 await assert.rejects(generateMonthlyIpl(admin,{period:'2026-13'}),{code:'invalid-argument'});
 await assert.rejects(generateMonthlyIpl(admin,{period:'2026-10',amount:1}),{code:'invalid-argument'});
 const before=(await db.collection('ipl_bills').get()).size;
 async function all(){let afterId;do {const r=await generateMonthlyIpl(admin,{period:'2026-10',limit:1,...(afterId?{afterId}:{})});assert.ok(r.results.length<=1);afterId=r.nextCursor;}while(afterId);}
 await all();const count=(await db.collection('ipl_bills').get()).size;assert.ok(count>=before);
 await all();assert.equal((await db.collection('ipl_bills').get()).size,count);
 const bill=await createBill(admin,{kind:'ipl',houseId:house,period:'2026-10'});
 assert.equal(bill.status,'PAID');assert.equal(bill.amount,100000);
});
