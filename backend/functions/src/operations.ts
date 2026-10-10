import {createHash} from 'node:crypto';
import {getAuth} from 'firebase-admin/auth';
import {FieldPath, getFirestore, Timestamp, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

function payload(input: unknown, fields: string[]) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument','Payload tidak valid.');
  const data=input as Record<string,unknown>;
  if(Object.keys(data).some(k=>!fields.includes(k))) throw new HttpsError('invalid-argument','Field tidak diizinkan.');
  return data;
}
function identifier(value:unknown):string {
  if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(value)) throw new HttpsError('invalid-argument','ID tidak valid.');
  return value;
}
function text(value:unknown,max=120):string {
  if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f]/.test(value)) throw new HttpsError('invalid-argument','Teks tidak valid.');
  return value.trim();
}
async function requireAdmin(tx:Transaction,uid:string) {
  const user=(await tx.get(getFirestore().doc(`users/${uid}`))).data();
  if(!user?.active||!['committee','super_admin'].includes(user.role)) throw new HttpsError('permission-denied','Akses pengurus diperlukan.');
  return user;
}
function audit(tx:Transaction,uid:string,role:string,action:string,resourceId:string,oldValue:unknown,newValue:unknown) {
  tx.create(getFirestore().collection('audit_logs').doc(),{actorId:uid,actorRole:role,action,resourceId,oldValue,newValue,createdAt:Timestamp.now()});
}

export async function createHouse(uid:string,input:unknown) {
  const data=payload(input,['houseId','block','houseNumber']);
  const houseId=identifier(data.houseId),block=text(data.block,30),houseNumber=text(data.houseNumber,30);
  const db=getFirestore(),ref=db.doc(`houses/${houseId}`);
  const addressRef=db.doc(`house_addresses/${createHash('sha256').update(JSON.stringify([block.toUpperCase(),houseNumber.toUpperCase()])).digest('hex')}`);
  return db.runTransaction(async tx=>{
    const user=await requireAdmin(tx,uid),existing=(await tx.get(ref)).data();
    const occupied=(await tx.get(addressRef)).data();
    if(existing){
      if(existing.block!==block||existing.houseNumber!==houseNumber) throw new HttpsError('already-exists','ID rumah sudah digunakan.');
      return {houseId,created:false};
    }
    if(occupied) throw new HttpsError('already-exists','Alamat rumah sudah terdaftar.');
    tx.create(ref,{block,houseNumber,label:`Blok ${block} No. ${houseNumber}`,active:true,primaryResidentId:null,createdAt:Timestamp.now()});
    tx.create(addressRef,{houseId});
    audit(tx,uid,user.role,'CREATE_HOUSE',houseId,null,{block,houseNumber});
    return {houseId,created:true};
  });
}

export async function registerResident(uid:string,input:unknown) {
  const data=payload(input,['residentUid','houseId','fullName','isHead']);
  const residentUid=identifier(data.residentUid),houseId=identifier(data.houseId),fullName=text(data.fullName);
  if(typeof data.isHead!=='boolean') throw new HttpsError('invalid-argument','isHead harus boolean.');
  // Check caller before querying Auth user existence.
  await getFirestore().runTransaction(tx=>requireAdmin(tx,uid));
  let account;
  try {account=await getAuth().getUser(residentUid);} catch {throw new HttpsError('failed-precondition','Akun Auth harus tersedia terlebih dahulu.');}
  if(account.disabled || ['committee','super_admin'].includes(String(account.customClaims?.role))) throw new HttpsError('failed-precondition','Akun tidak dapat didaftarkan sebagai warga.');
  const db=getFirestore(),houseRef=db.doc(`houses/${houseId}`),userRef=db.doc(`users/${residentUid}`);
  return db.runTransaction(async tx=>{
    const admin=await requireAdmin(tx,uid),house=(await tx.get(houseRef)).data();
    const current=(await tx.get(userRef)).data();
    if(!house?.active) throw new HttpsError('failed-precondition','Rumah tidak aktif.');
    if(current){
      if(current.role!=='resident'||current.houseId!==houseId||current.displayName!==fullName||current.isHead!==data.isHead) throw new HttpsError('already-exists','Warga sudah terdaftar; perubahan hunian harus melalui proses terpisah.');
      return {residentUid,houseId,created:false};
    }
    if(data.isHead && house.primaryResidentId) throw new HttpsError('failed-precondition','Rumah sudah memiliki kepala keluarga.');
    const record={uid:residentUid,role:'resident',active:true,houseId,displayName:fullName,isHead:data.isHead,createdAt:Timestamp.now()};
    tx.create(userRef,record);
    tx.create(db.doc(`residents/${residentUid}`),{userId:residentUid,houseId,fullName,status:'ACTIVE',createdAt:Timestamp.now()});
    if(data.isHead) tx.update(houseRef,{primaryResidentId:residentUid,updatedAt:Timestamp.now()});
    audit(tx,uid,admin.role,'REGISTER_RESIDENT',residentUid,null,{houseId,isHead:data.isHead});
    return {residentUid,houseId,created:true};
  });
}

export async function setResidentActive(uid:string,input:unknown) {
  const data=payload(input,['residentUid','active','reason']),residentUid=identifier(data.residentUid),reason=text(data.reason,500);
  if(typeof data.active!=='boolean') throw new HttpsError('invalid-argument','active harus boolean.');
  const db=getFirestore(),ref=db.doc(`users/${residentUid}`);
  return db.runTransaction(async tx=>{
    const admin=await requireAdmin(tx,uid),resident=(await tx.get(ref)).data();
    if(!resident||resident.role!=='resident') throw new HttpsError('permission-denied','Operasi hanya untuk akun warga.');
    const profileRef=db.doc(`residents/${residentUid}`),profile=await tx.get(profileRef);
    if(resident.active===data.active) return {residentUid,active:data.active};
    tx.update(ref,{active:data.active,updatedAt:Timestamp.now()});
    if(profile.exists) tx.update(profileRef,{status:data.active?'ACTIVE':'INACTIVE',updatedAt:Timestamp.now()});
    audit(tx,uid,admin.role,'SET_RESIDENT_ACTIVE',residentUid,{active:resident.active},{active:data.active,reason});
    return {residentUid,active:data.active};
  });
}

// Transfer hunian = ganti penghuni TOTAL (keluarga lama pindah, rumah
// kosong sampai keluarga baru didaftarkan lewat registerResident seperti
// biasa). Data historis TIDAK dihapus -- warga/anggota keluarga/kendaraan
// lama di-nonaktifkan (bukan di-delete), supaya houseId yang dipakai ulang
// nanti gak kecampur sama data keluarga baru (lihat listFamilyMembers/
// listVehicles di household.ts yang filter active!=false).
export async function transferHouse(uid:string,input:unknown) {
  const data=payload(input,['houseId','reason','requestId']);
  const houseId=identifier(data.houseId),reason=text(data.reason,500),requestId=identifier(data.requestId);
  const db=getFirestore(),houseRef=db.doc(`houses/${houseId}`);
  const operationRef=db.doc(`admin_operations/${createHash('sha256').update(JSON.stringify([uid,requestId])).digest('hex')}`);
  const signature=createHash('sha256').update(JSON.stringify(['TRANSFER_HOUSE',houseId,reason])).digest('hex');
  return db.runTransaction(async tx=>{
    const admin=await requireAdmin(tx,uid),previous=(await tx.get(operationRef)).data();
    if(previous){if(previous.signature!==signature) throw new HttpsError('already-exists','Request ID sudah digunakan.');return previous.result;}
    const house=(await tx.get(houseRef)).data();
    if(!house?.active) throw new HttpsError('failed-precondition','Rumah tidak aktif.');
    // Query equality tunggal (houseId) -- filter role/active DI MEMORI,
    // sengaja hindari composite index buat query multi-field.
    const [usersSnap,familySnap,vehiclesSnap]=await Promise.all([
      tx.get(db.collection('users').where('houseId','==',houseId)),
      tx.get(db.collection('family_members').where('houseId','==',houseId)),
      tx.get(db.collection('vehicles').where('houseId','==',houseId)),
    ]);
    const residents=usersSnap.docs.filter(d=>d.data().role==='resident'&&d.data().active===true);
    const now=Timestamp.now();
    for(const doc of residents){
      tx.update(doc.ref,{active:false,updatedAt:now});
      tx.update(db.doc(`residents/${doc.id}`),{status:'INACTIVE',updatedAt:now});
    }
    for(const doc of familySnap.docs) if(doc.data().active!==false) tx.update(doc.ref,{active:false,version:(doc.data().version??1)+1,updatedAt:now});
    for(const doc of vehiclesSnap.docs) if(doc.data().active!==false) tx.update(doc.ref,{active:false,version:(doc.data().version??1)+1,updatedAt:now});
    tx.update(houseRef,{primaryResidentId:null,updatedAt:now});
    const result={houseId,residentsDeactivated:residents.length,familyMembersDeactivated:familySnap.size,vehiclesDeactivated:vehiclesSnap.size};
    tx.create(operationRef,{signature,result,createdAt:now});
    audit(tx,uid,admin.role,'TRANSFER_HOUSE',houseId,{previousPrimaryResidentId:house.primaryResidentId},{...result,reason});
    return result;
  });
}

export async function activateInternetService(uid:string,input:unknown) {
  const data=payload(input,['houseId','paymentId','requestId','reason']);
  const houseId=identifier(data.houseId),paymentId=identifier(data.paymentId),requestId=identifier(data.requestId),reason=text(data.reason,500);
  const db=getFirestore(),subRef=db.doc(`internet_subscriptions/${houseId}`);
  const operationRef=db.doc(`admin_operations/${createHash('sha256').update(JSON.stringify([uid,requestId])).digest('hex')}`);
  const signature=createHash('sha256').update(JSON.stringify(['ACTIVATE',houseId,paymentId,reason])).digest('hex');
  return db.runTransaction(async tx=>{
    const admin=await requireAdmin(tx,uid),previous=(await tx.get(operationRef)).data();
    if(previous){if(previous.signature!==signature) throw new HttpsError('already-exists','Request ID sudah digunakan.');return previous.result;}
    const sub=(await tx.get(subRef)).data(),payment=(await tx.get(db.doc(`internet_payments/${paymentId}`))).data();
    const house=(await tx.get(db.doc(`houses/${houseId}`))).data();
    const resident=sub ? (await tx.get(db.doc(`users/${identifier(sub.primaryResidentId)}`))).data() : null;
    if(!sub||!house?.active||!resident?.active||resident.houseId!==houseId||!payment||payment.houseId!==houseId||payment.status!=='APPROVED'||sub.lastApprovedPaymentId!==paymentId) throw new HttpsError('failed-precondition','Pembayaran dan langganan belum siap diaktifkan.');
    const now=Timestamp.now();
    if(!(sub.activeUntil instanceof Timestamp)||sub.activeUntil.toMillis()<=now.toMillis()) throw new HttpsError('failed-precondition','Masa aktif sudah berakhir.');
    if(sub.status!=='PENDING_ACTIVATION') throw new HttpsError('failed-precondition','Layanan tidak menunggu aktivasi.');
    const result={houseId,status:'ACTIVE',paymentId};
    tx.update(subRef,{status:'ACTIVE',activatedAt:now,activatedBy:uid,activationNote:reason});
    tx.create(operationRef,{signature,result,createdAt:now});
    audit(tx,uid,admin.role,'ACTIVATE_INTERNET',houseId,{status:sub.status},{status:'ACTIVE',paymentId,reason});
    return result;
  });
}

export async function listAdminRecords(uid:string,input:unknown) {
  const data=payload(input,['resource','limit','afterId']);
  if(!['houses','residents','ipl_payments','internet_payments','announcements','events','reports','finance_transactions','family_members','vehicles'].includes(String(data.resource))) throw new HttpsError('invalid-argument','Resource tidak valid.');
  const limit=data.limit??20;
  if(typeof limit!=='number'||!Number.isInteger(limit)||limit<1||limit>50) throw new HttpsError('invalid-argument','Limit 1–50.');
  const after=data.afterId===undefined?null:identifier(data.afterId),db=getFirestore();
  return db.runTransaction(async tx=>{
    await requireAdmin(tx,uid);
    let query=db.collection(String(data.resource)).orderBy(FieldPath.documentId());
    if(String(data.resource).endsWith('_payments')) query=query.where('status','==','PENDING_VERIFICATION');
    if(after) query=query.startAfter(after);
    const snapshot=await tx.get(query.limit(limit+1));
    const docs=snapshot.docs.slice(0,limit);
    const items=docs.map(doc=>{
      const r=doc.data();
      // Explicit fields: no proof payloads, contacts, bank configuration, or future private fields.
      if(data.resource==='houses') return {id:doc.id,label:r.label??doc.id,active:r.active,primaryResidentId:r.primaryResidentId};
      if(data.resource==='residents') return {id:doc.id,fullName:r.fullName,houseId:r.houseId,status:r.status};
      if(data.resource==='reports') return {id:doc.id,residentId:r.residentId,houseId:r.houseId,title:r.title,description:r.description,category:r.category,status:r.status,version:r.version,createdAt:r.createdAt};
      if(['announcements','events'].includes(String(data.resource))) return {id:doc.id,title:r.title,description:r.description,status:r.status,version:r.version,...(data.resource==='events'?{startsAt:r.startsAt,endsAt:r.endsAt,location:r.location}:{})};
      if(data.resource==='finance_transactions') return {id:doc.id,type:r.type,category:r.category,amount:r.amount,description:r.description,periodId:r.periodId,version:r.version,createdBy:r.createdBy,createdAt:r.createdAt};
      if(data.resource==='family_members') return {id:doc.id,houseId:r.houseId,fullName:r.fullName,relationship:r.relationship,phone:r.phone,active:r.active,version:r.version};
      if(data.resource==='vehicles') return {id:doc.id,houseId:r.houseId,plateNumber:r.plateNumber,type:r.type,brand:r.brand,color:r.color,active:r.active,version:r.version};
      return {id:doc.id,billId:r.billId,houseId:r.houseId,residentId:r.residentId,amount:r.amount,status:r.status,proofId:r.proofId,createdAt:r.createdAt};
    });
    return {items,nextCursor:snapshot.size>limit?docs.at(-1)!.id:null};
  });
}
