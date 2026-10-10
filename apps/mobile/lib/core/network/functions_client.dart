import 'package:cloud_functions/cloud_functions.dart';
import '../errors/app_exception.dart';

/// Pembungkus TIPIS di atas Cloud Functions callable -- SENGAJA gak ada
/// logic bisnis di sini (lihat PRD §9.1: "Frontend tidak boleh mengandung
/// business logic sensitif"). Satu-satunya tanggung jawab: panggil fungsi,
/// terjemahkan HttpsError jadi AppException yang enak ditampilkan UI.
class FunctionsClient {
  FunctionsClient({FirebaseFunctions? functions})
      : _functions = functions ?? FirebaseFunctions.instanceFor(region: 'asia-southeast2');

  final FirebaseFunctions _functions;

  Future<Map<String, dynamic>> call(String name, [Map<String, dynamic>? data]) async {
    try {
      final result = await _functions.httpsCallable(name).call<dynamic>(data ?? <String, dynamic>{});
      final raw = result.data;
      if (raw is Map) return Map<String, dynamic>.from(raw);
      return <String, dynamic>{'value': raw};
    } on FirebaseFunctionsException catch (e) {
      throw AppException(code: e.code, message: e.message ?? 'Terjadi kesalahan.');
    }
  }
}
