import {randomUUID} from 'node:crypto';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {HttpsError} from 'firebase-functions/v2/https';
import sharp from 'sharp';

export async function sanitizeProof(encoded: unknown): Promise<Buffer> {
  if (typeof encoded !== 'string' || encoded.length > 6990508 || /[^A-Za-z0-9+/=]/.test(encoded)) {
    throw new HttpsError('invalid-argument', 'Bukti harus base64 JPG/PNG maksimal 5 MB.');
  }
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length || buffer.length > 5 * 1024 * 1024 || buffer.toString('base64') !== encoded) throw new HttpsError('invalid-argument', 'Ukuran bukti tidak valid.');
  try {
    const options = {limitInputPixels: 16000000, failOn: 'warning' as const};
    const meta = await sharp(buffer, options).metadata();
    if (!['jpeg','png'].includes(meta.format ?? '') || (meta.pages ?? 1) !== 1) throw new Error('Unsupported');
    // Decode and re-encode removes metadata and trailing payloads; no original file is exposed.
    return await sharp(buffer, options).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).jpeg({quality:90}).toBuffer();
  } catch {
    throw new HttpsError('invalid-argument', 'Bukti bukan gambar JPG/PNG yang valid.');
  }
}

export async function uploadPaymentProof(uid: string, input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument','Payload tidak valid.');
  const data = input as Record<string,unknown>;
  if (Object.keys(data).some(k=>!['kind','billId','imageBase64'].includes(k)) || !['ipl','internet'].includes(String(data.kind)) || typeof data.billId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.billId)) throw new HttpsError('invalid-argument','Tagihan tidak valid.');
  const db = getFirestore(), billRef = db.doc(`${data.kind}_bills/${data.billId}`);
  const check = async (tx: FirebaseFirestore.Transaction) => {
    const user = (await tx.get(db.doc(`users/${uid}`))).data();
    const bill = (await tx.get(billRef)).data();
    if (!user?.active || !bill || bill.houseId !== user.houseId || bill.residentId !== uid) throw new HttpsError('permission-denied','Tagihan tidak dapat diakses.');
    if (!['UNPAID','OVERDUE'].includes(bill.status)) throw new HttpsError('failed-precondition','Tagihan tidak menerima bukti baru.');
  };
  await db.runTransaction(async tx=>{
    await check(tx);
    const rateRef = db.doc(`upload_limits/${uid}`), rate = (await tx.get(rateRef)).data();
    const window = Math.floor(Date.now()/60000);
    const count = rate?.window === window ? rate.count : 0;
    if (count >= 5) throw new HttpsError('resource-exhausted','Maksimal lima unggahan per menit.');
    tx.set(rateRef,{window,count:count+1});
  });
  const image = await sanitizeProof(data.imageBase64);
  const proofId = randomUUID(), path = `payment-proofs/${uid}/${proofId}.jpg`;
  const file = getStorage().bucket().file(path);
  await file.save(image,{resumable:false,metadata:{contentType:'image/jpeg',cacheControl:'private, no-store'}});
  try {
    await db.runTransaction(async tx=>{
      await check(tx);
      tx.create(db.doc(`payment_proofs/${proofId}`),{ownerId:uid,kind:data.kind,billId:data.billId,path,status:'VALIDATED',createdAt:Timestamp.now()});
    });
  } catch(error) {
    await file.delete({ignoreNotFound:true});
    throw error;
  }
  return {proofId};
}

export async function getPaymentProof(uid: string, input: unknown) {
  const proofId = (input as {proofId?:unknown})?.proofId;
  if (typeof proofId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(proofId)) throw new HttpsError('invalid-argument','ID tidak valid.');
  const db=getFirestore(), user=(await db.doc(`users/${uid}`).get()).data();
  const proof=(await db.doc(`payment_proofs/${proofId}`).get()).data();
  if (!user?.active || !proof || (proof.ownerId !== uid && !['committee','super_admin'].includes(user.role))) throw new HttpsError('permission-denied','Bukti tidak dapat diakses.');
  const [image]=await getStorage().bucket().file(proof.path).download();
  return {contentType:'image/jpeg',imageBase64:image.toString('base64')};
}
