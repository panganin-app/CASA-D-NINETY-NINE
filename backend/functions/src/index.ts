import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {IPL_AMOUNT, INTERNET_PACKAGES} from './domain';

initializeApp();
const options = {region: 'asia-southeast2', enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true'};
export const getBillingCatalog = onCall(options, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Silakan masuk kembali.');
  const user = await getFirestore().doc(`users/${request.auth.uid}`).get();
  if (!user.exists || user.data()?.active !== true) {
    throw new HttpsError('permission-denied', 'Akun tidak aktif.');
  }
  return {currency: 'IDR', iplAmount: IPL_AMOUNT, internetPackages: INTERNET_PACKAGES};
});

import {createBill as createBillService, submitPayment as submitPaymentService, verifyPayment as verifyPaymentService} from './billing';
function callable(service: (uid: string, data: unknown) => Promise<unknown>) {
  return onCall(options, async request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Silakan masuk kembali.');
    return service(request.auth.uid, request.data);
  });
}
export const createBill = callable(createBillService);
export const submitPayment = callable(submitPaymentService);
export const verifyPayment = callable(verifyPaymentService);

import {uploadPaymentProof as uploadProofService, getPaymentProof as getProofService} from './proofs';
export const uploadPaymentProof = callable(uploadProofService);
export const getPaymentProof = callable(getProofService);

export const getMyHousehold = callable(async uid => {
  const db = getFirestore(), user = (await db.doc(`users/${uid}`).get()).data();
  if (!user?.active || typeof user.houseId !== 'string') throw new HttpsError('permission-denied','Rumah belum terdaftar.');
  const house = (await db.doc(`houses/${user.houseId}`).get()).data();
  if (!house?.active) throw new HttpsError('permission-denied','Rumah tidak aktif.');
  return {houseId:user.houseId, label:house.label ?? user.houseId, isHead:house.primaryResidentId === uid, occupancyType:house.occupancyType ?? null};
});

export const getPaymentInstructions = callable(async (uid,input) => {
  const data = input as {kind?: string; billId?:string};
  if (!data || !['ipl','internet'].includes(data.kind ?? '') || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.billId ?? '')) throw new HttpsError('invalid-argument','Tagihan tidak valid.');
  const db=getFirestore(), user=(await db.doc(`users/${uid}`).get()).data();
  const bill=(await db.doc(`${data.kind}_bills/${data.billId}`).get()).data();
  if (!user?.active || !bill || user.houseId !== bill.houseId) throw new HttpsError('permission-denied','Tagihan tidak dapat diakses.');
  const bank=(await db.doc(`payment_config/${data.kind}`).get()).data();
  if (!bank || bank.bank !== 'BCA' || typeof bank.accountNumber !== 'string' || typeof bank.accountHolder !== 'string') throw new HttpsError('failed-precondition','Rekening tujuan belum dikonfigurasi.');
  return {bank:'BCA',accountNumber:bank.accountNumber,accountHolder:bank.accountHolder,amount:bill.amount};
});

import * as operations from './operations';
export const createHouse = callable(operations.createHouse);
export const registerResident = callable(operations.registerResident);
export const setResidentActive = callable(operations.setResidentActive);
export const activateInternetService = callable(operations.activateInternetService);
export const listAdminRecords = callable(operations.listAdminRecords);
export const transferHouse = callable(operations.transferHouse);
export const setHouseOccupancy = callable(operations.setHouseOccupancy);
export const listAuditLogs = callable(operations.listAuditLogs);

import * as household from './household';
export const updateResidentProfile = callable(household.updateResidentProfile);
export const saveFamilyMember = callable(household.saveFamilyMember);
export const removeFamilyMember = callable(household.removeFamilyMember);
export const listFamilyMembers = callable(household.listFamilyMembers);
export const saveVehicle = callable(household.saveVehicle);
export const removeVehicle = callable(household.removeVehicle);
export const listVehicles = callable(household.listVehicles);

import * as systemSettings from './system-settings';
export const getSystemSettings = callable(systemSettings.getSystemSettings);
export const updateSystemSettings = callable(systemSettings.updateSystemSettings);

import {updateInternetSubscriptionStatuses as updateInternetSubscriptionStatusesService} from './internet-lifecycle';
export const updateInternetSubscriptionStatuses = callable(updateInternetSubscriptionStatusesService);

import * as finance from './finance';
import * as community from './community';
import * as notifications from './notifications';
import {generateMonthlyIpl as generateMonthlyIplService} from './monthly-ipl';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
export const saveCommunityContent = callable(community.saveCommunityContent);
export const listPublishedContent = callable(community.listPublishedContent);
export const createResidentReport = callable(community.createResidentReport);
export const updateReportStatus = callable(community.updateReportStatus);
export const markNotificationRead = callable(notifications.markNotificationRead);
export const reconcileNotifications = callable(notifications.reconcileNotifications);
export const generateMonthlyIpl = callable(generateMonthlyIplService);
export const saveFinanceTransaction = callable(finance.saveFinanceTransaction);
export const publishFinancePeriod = callable(finance.publishFinancePeriod);
export const listFinancePublications = callable(finance.listFinancePublications);
export const dispatchInAppNotification = onDocumentCreated({
 region:'asia-southeast2',document:'notification_outbox/{outboxId}',retry:true,
},async event=> {await notifications.deliverNotification(event.params.outboxId);});
