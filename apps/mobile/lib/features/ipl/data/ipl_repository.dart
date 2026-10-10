import 'dart:convert';
import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/network/functions_client.dart';
import 'ipl_models.dart';

/// Repository IPL. Baca daftar tagihan LANGSUNG dari Firestore (rules sudah
/// mengizinkan warga membaca tagihan rumahnya sendiri). SEMUA aksi tulis
/// (buat/bayar/upload bukti) lewat Cloud Functions -- tidak pernah tulis
/// langsung ke Firestore dari client.
class IplRepository {
  IplRepository({FirebaseFirestore? firestore, FunctionsClient? functions})
      : _db = firestore ?? FirebaseFirestore.instance,
        _functions = functions ?? FunctionsClient();

  final FirebaseFirestore _db;
  final FunctionsClient _functions;

  /// Tagihan IPL untuk rumah tertentu, terbaru dulu.
  Future<List<IplBill>> listBills(String houseId) async {
    final snap = await _db
        .collection('ipl_bills')
        .where('houseId', isEqualTo: houseId)
        .orderBy('period', descending: true)
        .limit(24)
        .get();
    return snap.docs.map((d) => IplBill.fromFirestore(d.id, d.data())).toList();
  }

  Future<PaymentInstructions> getPaymentInstructions(String billId) async {
    final result = await _functions.call('getPaymentInstructions', {'kind': 'ipl', 'billId': billId});
    return PaymentInstructions.fromMap(result);
  }

  /// Upload bukti transfer. Gambar dikirim base64 -- backend yang validasi,
  /// re-encode, dan simpan (client gak pernah tau path Storage asli).
  Future<String> uploadProof({required String billId, required Uint8List imageBytes}) async {
    final result = await _functions.call('uploadPaymentProof', {
      'kind': 'ipl',
      'billId': billId,
      'imageBase64': base64Encode(imageBytes),
    });
    return result['proofId'] as String;
  }

  /// Kirim pembayaran setelah bukti diupload. requestId dibuat sekali per
  /// percobaan supaya retry jaringan tidak bikin pembayaran dobel.
  Future<String> submitPayment({
    required String billId,
    required String proofId,
    required String requestId,
  }) async {
    final result = await _functions.call('submitPayment', {
      'kind': 'ipl',
      'billId': billId,
      'proofId': proofId,
      'requestId': requestId,
    });
    return result['paymentId'] as String;
  }
}
