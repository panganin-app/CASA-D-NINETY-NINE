import {getFirestore, FieldPath} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {activeUser, data, key} from './community';
import {createBill} from './billing';

// Bounded manual batch first. No automatic clock or unapproved due-date policy.
export async function generateMonthlyIpl(uid:string,input:unknown) {
 const d=data(input,['period','afterId','limit']),period=d.period,after=d.afterId===undefined?null:key(d.afterId),limit=d.limit??25;
 if(typeof period!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(period)) throw new HttpsError('invalid-argument','Periode harus YYYY-MM.');
 if(typeof limit!=='number'||!Number.isInteger(limit)||limit<1||limit>50) throw new HttpsError('invalid-argument','Limit 1–50.');
 const db=getFirestore(),records=await db.runTransaction(async tx=>{
  await activeUser(tx,uid,true);let q=db.collection('houses').orderBy(FieldPath.documentId());
  if(after) q=q.startAfter(after);
  return tx.get(q.limit(limit+1));
 });
 const docs=records.docs.slice(0,limit),results=[];
 for(const doc of docs) {
  if(doc.data().active!==true||typeof doc.data().primaryResidentId!=='string') {results.push({houseId:doc.id,status:'SKIPPED'});continue;}
  try {const bill=await createBill(uid,{kind:'ipl',houseId:doc.id,period});results.push({houseId:doc.id,billId:bill.billId,status:'READY'});}
  catch(error) {
   if(error instanceof HttpsError && ['failed-precondition','invalid-argument'].includes(error.code)) results.push({houseId:doc.id,status:'SKIPPED'});
   else throw error;
  }
 }
 return {period,results,nextCursor:records.size>limit?docs.at(-1)!.id:null};
}
