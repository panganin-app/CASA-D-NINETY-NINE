import 'dart:convert';
import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/network/functions_client.dart';
import 'bill_models.dart';

/// Repository tagihan (IPL & internet). Baca tagihan langsung dari Firestore
/// (rules membatasi ke rumah sendiri). Semua aksi tulis lewat Cloud Functions.
class BillRepository {
  BillRepository({FirebaseFirestore? firestore, FunctionsClient? functions})
      : _db = firestore ?? FirebaseFirestore.instance,
        _functions = functions ?? FunctionsClient();

  final FirebaseFirestore _db;
  final FunctionsClient _functions;

  Future<List<Bill>> listBills(BillKind kind, String houseId) async {
    final snap = await _db
        .collection(kind.collection)
        .where('houseId', isEqualTo: houseId)
        .orderBy('period', descending: true)
        .limit(24)
        .get();
    return snap.docs.map((d) => Bill.fromFirestore(d.id, d.data())).toList();
  }

  Future<InternetSubscription?> getInternetSubscription(String houseId) async {
    final snap = await _db.doc('internet_subscriptions/$houseId').get();
    final data = snap.data();
    return data == null ? null : InternetSubscription.fromFirestore(data);
  }

  Future<Map<String, InternetPackage>> getInternetPackages() async {
    final result = await _functions.call('getBillingCatalog');
    final raw = (result['internetPackages'] as Map?) ?? const {};
    return {
      for (final e in raw.entries)
        e.key as String: InternetPackage(
          id: e.key as String,
          speedMbps: ((e.value as Map)['speedMbps'] as num).toInt(),
          amount: ((e.value as Map)['amount'] as num).toInt(),
        ),
    };
  }

  /// Buat tagihan internet (hanya kepala keluarga, dibatasi backend). Mengembalikan billId.
  /// requestId sekali per percobaan -- retry tidak menggandakan tagihan.
  Future<String> createInternetBill({
    required String houseId,
    required String period,
    required String packageId,
    required String requestId,
  }) async {
    final result = await _functions.call('createBill', {
      'kind': 'internet',
      'houseId': houseId,
      'period': period,
      'packageId': packageId,
      'requestId': requestId,
    });
    return result['billId'] as String;
  }

  Future<PaymentInstructions> getPaymentInstructions(BillKind kind, String billId) async {
    final result = await _functions.call('getPaymentInstructions', {'kind': kind.apiValue, 'billId': billId});
    return PaymentInstructions.fromMap(result);
  }

  Future<String> uploadProof({required BillKind kind, required String billId, required Uint8List imageBytes}) async {
    final result = await _functions.call('uploadPaymentProof', {
      'kind': kind.apiValue,
      'billId': billId,
      'imageBase64': base64Encode(imageBytes),
    });
    return result['proofId'] as String;
  }

  Future<String> submitPayment({
    required BillKind kind,
    required String billId,
    required String proofId,
    required String requestId,
  }) async {
    final result = await _functions.call('submitPayment', {
      'kind': kind.apiValue,
      'billId': billId,
      'proofId': proofId,
      'requestId': requestId,
    });
    return result['paymentId'] as String;
  }
}
