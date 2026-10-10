import {getFirestore, Timestamp, FieldPath} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {activeUser, data, key} from './community';

// Trigger retries and reconciliation both use the same deterministic inbox ID.
export async function deliverNotification(outboxId:string) {
 const db=getFirestore(),ref=db.doc(`notification_outbox/${key(outboxId)}`),target=db.doc(`notifications/${outboxId}`);
 return db.runTransaction(async tx=>{
  const source=(await tx.get(ref)).data();
  if(!source) return {delivered:false};
  const recipient=key(source.residentId),user=(await tx.get(db.doc(`users/${recipient}`))).data(),existing=await tx.get(target);
  if(existing.exists) {tx.update(ref,{deliveryStatus:'DELIVERED'});return {delivered:true};}
  if(user?.active!==true) {tx.update(ref,{deliveryStatus:'HELD_INACTIVE'});return {delivered:false};}
  let type:string,title:string,body:string,resourceId:string;
  if(source.type==='REPORT_STATUS') {
   if(!['IN_REVIEW','IN_PROGRESS','RESOLVED','REJECTED','CLOSED'].includes(source.status)) throw new HttpsError('failed-precondition','Status laporan tidak valid.');
   type='REPORT_STATUS';title='Status laporan diperbarui';body=`Status laporan: ${source.status}.`;resourceId=key(source.reportId);
  } else {
   if(!['APPROVED','REJECTED'].includes(source.decision)) throw new HttpsError('failed-precondition','Keputusan pembayaran tidak valid.');
   type='PAYMENT_VERIFIED';title='Hasil verifikasi pembayaran';body=source.decision==='APPROVED'?'Pembayaran Anda telah disetujui.':'Pembayaran Anda ditolak. Silakan periksa detail pembayaran.';resourceId=key(source.paymentId);
  }
  const now=Timestamp.now();
  tx.create(target,{residentId:recipient,type,title,body,resourceId,readAt:null,createdAt:now,channel:'IN_APP'});
  tx.update(ref,{deliveryStatus:'DELIVERED',deliveredAt:now});
  return {delivered:true};
 });
}
export async function markNotificationRead(uid:string,input:unknown) {
 const d=data(input,['notificationId']),id=key(d.notificationId),db=getFirestore(),ref=db.doc(`notifications/${id}`);
 return db.runTransaction(async tx=>{
  await activeUser(tx,uid);const record=(await tx.get(ref)).data();
  if(!record||record.residentId!==uid) throw new HttpsError('permission-denied','Notifikasi tidak dapat diakses.');
  if(!record.readAt) tx.update(ref,{readAt:Timestamp.now()});
  return {notificationId:id,read:true};
 });
}
export async function reconcileNotifications(uid:string,input:unknown) {
 const d=data(input,['afterId','limit']),after=d.afterId===undefined?null:key(d.afterId),limit=d.limit??20;
 if(typeof limit!=='number'||!Number.isInteger(limit)||limit<1||limit>50) throw new HttpsError('invalid-argument','Limit 1–50.');
 const db=getFirestore();
 const records=await db.runTransaction(async tx=>{
  await activeUser(tx,uid,true);let query=db.collection('notification_outbox').orderBy(FieldPath.documentId());
  if(after) query=query.startAfter(after);
  return tx.get(query.limit(limit+1));
 });
 const docs=records.docs.slice(0,limit),results=[];
 for(const doc of docs) results.push({id:doc.id,...await deliverNotification(doc.id)});
 return {results,nextCursor:records.size>limit?docs.at(-1)!.id:null};
}
