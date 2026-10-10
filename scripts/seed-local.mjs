import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync,existsSync,readFileSync,chmodSync} from 'node:fs';
// Fixed local-only destinations: never accept a cloud project from arguments.
process.env.GCLOUD_PROJECT='demo-casa-local';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
const require=createRequire(new URL('../backend/functions/package.json',import.meta.url));
const {initializeApp,deleteApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore}=require('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-casa-local'});
mkdirSync('.local',{recursive:true,mode:0o700});
chmodSync('.local',0o700);
const credentials=[];
try {
 for(const [uid,role,houseId] of [['demo-resident','resident','DEMO-A1'],['demo-other','resident','DEMO-A2'],['demo-committee','committee',null]]){
  const email=`${uid}@example.test`,password=randomUUID();
  let exists=false;
  try {await getAuth().getUser(uid);exists=true;}
  catch(e){if(e.code!=='auth/user-not-found') throw e;}
  if(!exists){await getAuth().createUser({uid,email,password});credentials.push({email,password,role});}
  const db=getFirestore(), userRef=db.doc(`users/${uid}`);
  await db.runTransaction(async tx=>{
   const current=(await tx.get(userRef)).data();
   const houseRef=houseId?db.doc(`houses/${houseId}`):null;
   const house=houseRef?(await tx.get(houseRef)).data():null;
   const residentRef=houseId?db.doc(`residents/${uid}`):null;
   const resident=residentRef?await tx.get(residentRef):null;
   if(current && (current.role!==role || current.houseId!==houseId)) throw new Error('Demo account mapping changed; seed will not overwrite it.');
   if(house && house.primaryResidentId!==uid) throw new Error('Demo household changed; seed will not overwrite it.');
   const displayName=role==='committee'?'Pengurus Uji':`Warga Uji ${houseId}`;
   if(!current) tx.create(userRef,{active:true,role,houseId,displayName,isHead:!!houseId});
   else if(current.displayName===undefined) tx.update(userRef,{displayName,isHead:!!houseId});
   if(houseRef && !house) tx.create(houseRef,{active:true,label:houseId,primaryResidentId:uid});
   if(residentRef && !resident.exists) tx.create(residentRef,{userId:uid,houseId,fullName:displayName,status:current?.active===false?'INACTIVE':'ACTIVE'});
  });
  console.log(`${uid}: synthetic profile ready; existing password preserved`);
 }
 if(credentials.length){mkdirSync('.local',{recursive:true});const path=`.local/seed-credentials-${Date.now()}.json`;writeFileSync(path,JSON.stringify(credentials,null,2),{mode:0o600});console.log(`Local test credentials saved to ${path}`);}
 if(existsSync('.local/payment-config.json')) {
  const configs=JSON.parse(readFileSync('.local/payment-config.json','utf8'));
  for(const kind of ['ipl','internet']) {
   const bank=configs[kind];
   if(bank?.bank!=='BCA' || !/^\d{10}$/.test(bank.accountNumber) || typeof bank.accountHolder!=='string') throw new Error('Invalid local bank configuration');
   await getFirestore().doc(`payment_config/${kind}`).set({bank:bank.bank,accountNumber:bank.accountNumber,accountHolder:bank.accountHolder});
  }
  console.log('Separate IPL/internet payment configuration loaded locally.');
 } else console.log('Bank configuration not seeded; .local/payment-config.json is absent.');
} finally {await deleteApp(app);}
