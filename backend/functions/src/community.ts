import {createHash} from 'node:crypto';
import {getFirestore, Timestamp, Transaction, FieldPath} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

export function data(input:unknown,allowed:string[]):Record<string,unknown> {
 if(!input||typeof input!=='object'||Array.isArray(input)) throw new HttpsError('invalid-argument','Payload tidak valid.');
 const result=input as Record<string,unknown>;
 if(Object.keys(result).some(k=>!allowed.includes(k))) throw new HttpsError('invalid-argument','Field tidak diizinkan.');
 return result;
}
export function key(value:unknown):string {
 if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(value)) throw new HttpsError('invalid-argument','ID tidak valid.');
 return value;
}
export function plain(value:unknown,max=2000):string {
 if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new HttpsError('invalid-argument','Teks tidak valid.');
 return value.trim();
}
export function digest(...values:unknown[]) {return createHash('sha256').update(JSON.stringify(values)).digest('hex');}
export async function activeUser(tx:Transaction,uid:string,admin=false) {
 const user=(await tx.get(getFirestore().doc(`users/${uid}`))).data();
 if(user?.active!==true || (admin&&!['committee','super_admin'].includes(user.role))) throw new HttpsError('permission-denied','Akses tidak diizinkan.');
 return user;
}
export function event(tx:Transaction,uid:string,role:string,action:string,resourceId:string,details:object) {
 tx.create(getFirestore().collection('audit_logs').doc(),{actorId:uid,actorRole:role,action,resourceId,details,createdAt:Timestamp.now()});
}
function version(value:unknown):number {
 if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0) throw new HttpsError('invalid-argument','Versi tidak valid.');
 return value;
}
function contentType(value:unknown):string {
 if(!['announcements','events'].includes(String(value))) throw new HttpsError('invalid-argument','Jenis konten tidak valid.');
 return String(value);
}
function date(value:unknown):Timestamp {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) throw new HttpsError('invalid-argument','Waktu harus ISO UTC.');
 const parsed=new Date(value);
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,19)!==value.slice(0,19)) throw new HttpsError('invalid-argument','Tanggal tidak valid.');
 return Timestamp.fromDate(parsed);
}
export async function saveCommunityContent(uid:string,input:unknown) {
 const d=data(input,['type','contentId','title','description','status','expectedVersion','startsAt','endsAt','location']);
 const type=contentType(d.type),contentId=key(d.contentId),title=plain(d.title,120),description=plain(d.description,5000),expectedVersion=version(d.expectedVersion);
 if(!['DRAFT','PUBLISHED','ARCHIVED'].includes(String(d.status))) throw new HttpsError('invalid-argument','Status konten tidak valid.');
 let extra:Record<string,unknown>={};
 if(type==='events') {
  const startsAt=date(d.startsAt),endsAt=date(d.endsAt);
  if(endsAt.toMillis()<=startsAt.toMillis()) throw new HttpsError('invalid-argument','Waktu selesai harus setelah mulai.');
  extra={startsAt,endsAt,location:plain(d.location,200)};
 } else if(['startsAt','endsAt','location'].some(k=>d[k]!==undefined)) throw new HttpsError('invalid-argument','Pengumuman tidak memakai waktu agenda.');
 const db=getFirestore(),ref=db.doc(`${type}/${contentId}`);
 return db.runTransaction(async tx=>{
  const user=await activeUser(tx,uid,true),old=(await tx.get(ref)).data();
  if((old?.version??0)!==expectedVersion) throw new HttpsError('failed-precondition','Konten sudah diubah; muat ulang.');
  if(!old&&d.status==='ARCHIVED') throw new HttpsError('invalid-argument','Konten baru tidak dapat diarsipkan.');
  const now=Timestamp.now(),newVersion=expectedVersion+1;
  tx.set(ref,{title,description,status:d.status,...extra,version:newVersion,createdBy:old?.createdBy??uid,createdAt:old?.createdAt??now,updatedAt:now});
  event(tx,uid,user.role,'SAVE_COMMUNITY_CONTENT',contentId,{type,oldStatus:old?.status??null,newStatus:d.status,version:newVersion});
  return {contentId,version:newVersion,status:d.status};
 });
}
export async function listPublishedContent(uid:string,input:unknown) {
 const d=data(input,['type','limit','afterId']),type=contentType(d.type),limit=d.limit??20,after=d.afterId===undefined?null:key(d.afterId);
 if(typeof limit!=='number'||!Number.isInteger(limit)||limit<1||limit>50) throw new HttpsError('invalid-argument','Limit 1–50.');
 const db=getFirestore();
 return db.runTransaction(async tx=>{
  await activeUser(tx,uid);
  let query=db.collection(type).where('status','==','PUBLISHED').orderBy(FieldPath.documentId());
  if(after) query=query.startAfter(after);
  const found=await tx.get(query.limit(limit+1)),docs=found.docs.slice(0,limit);
  return {items:docs.map(x=>{const r=x.data();return {id:x.id,title:r.title,description:r.description,version:r.version,...(type==='events'?{startsAt:r.startsAt,endsAt:r.endsAt,location:r.location}:{})};}),nextCursor:found.size>limit?docs.at(-1)!.id:null};
 });
}
const categories=['FACILITIES','SECURITY','CLEANLINESS','ENVIRONMENT','INTERNET','OTHER'];
export async function createResidentReport(uid:string,input:unknown) {
 const d=data(input,['requestId','category','title','description']);
 const requestId=key(d.requestId),title=plain(d.title,120),description=plain(d.description),category=String(d.category);
 if(!categories.includes(category)) throw new HttpsError('invalid-argument','Kategori tidak valid.');
 const reportId=digest(uid,requestId),signature=digest(category,title,description),db=getFirestore(),ref=db.doc(`reports/${reportId}`);
 return db.runTransaction(async tx=>{
  const user=await activeUser(tx,uid),houseId=key(user.houseId),house=(await tx.get(db.doc(`houses/${houseId}`))).data();
  const existing=(await tx.get(ref)).data();
  if(!house?.active) throw new HttpsError('failed-precondition','Rumah tidak aktif.');
  if(existing){if(existing.signature!==signature) throw new HttpsError('already-exists','Request ID telah dipakai.');return {reportId,status:existing.status,version:existing.version};}
  const now=Timestamp.now();
  tx.create(ref,{residentId:uid,houseId,title,description,category,status:'SUBMITTED',version:1,signature,attachments:[],createdAt:now,updatedAt:now});
  event(tx,uid,user.role,'CREATE_REPORT',reportId,{houseId,category});
  return {reportId,status:'SUBMITTED',version:1};
 });
}
const transitions:Record<string,string[]>={SUBMITTED:['IN_REVIEW','REJECTED'],IN_REVIEW:['IN_PROGRESS','REJECTED'],IN_PROGRESS:['RESOLVED'],RESOLVED:['CLOSED'],REJECTED:['CLOSED'],CLOSED:[]};
export async function updateReportStatus(uid:string,input:unknown) {
 const d=data(input,['reportId','status','expectedVersion','reason','requestId']);
 const reportId=key(d.reportId),requestId=key(d.requestId),status=String(d.status),reason=plain(d.reason,500),expectedVersion=version(d.expectedVersion);
 const db=getFirestore(),ref=db.doc(`reports/${reportId}`),opRef=db.doc(`report_operations/${digest(uid,requestId)}`),signature=digest(reportId,status,reason,expectedVersion);
 return db.runTransaction(async tx=>{
  const user=await activeUser(tx,uid,true),oldOp=(await tx.get(opRef)).data(),old=(await tx.get(ref)).data();
  if(oldOp){if(oldOp.signature!==signature) throw new HttpsError('already-exists','Request ID telah dipakai.');return oldOp.result;}
  if(!old) throw new HttpsError('not-found','Laporan tidak ditemukan.');
  if(old.version!==expectedVersion||!transitions[old.status]?.includes(status)) throw new HttpsError('failed-precondition','Transisi atau versi laporan tidak valid.');
  const now=Timestamp.now(),newVersion=expectedVersion+1,result={reportId,status,version:newVersion};
  tx.update(ref,{status,version:newVersion,updatedAt:now,...(status==='RESOLVED'?{resolvedAt:now,resolvedBy:uid}:{})});
  tx.create(db.doc(`report_events/${digest(reportId,String(newVersion))}`),{reportId,residentId:old.residentId,houseId:old.houseId,oldStatus:old.status,status,reason,actorId:uid,createdAt:now});
  tx.create(opRef,{signature,result,createdAt:now});
  tx.create(db.doc(`notification_outbox/report_${reportId}_${newVersion}`),{type:'REPORT_STATUS',residentId:old.residentId,reportId,status,createdAt:now});
  event(tx,uid,user.role,'UPDATE_REPORT_STATUS',reportId,{oldStatus:old.status,status,version:newVersion});
  return result;
 });
}
