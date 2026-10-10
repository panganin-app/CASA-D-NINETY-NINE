import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/network/functions_client.dart';
import 'report_models.dart';

/// Riwayat laporan dibaca langsung dari Firestore (rules membatasi ke pemilik).
/// Pembuatan laporan lewat Cloud Function `createResidentReport` -- client
/// tidak pernah menulis `reports` langsung.
class ReportRepository {
  ReportRepository({FirebaseFirestore? firestore, FirebaseAuth? auth, FunctionsClient? functions})
      : _db = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance,
        _functions = functions ?? FunctionsClient();

  final FirebaseFirestore _db;
  final FirebaseAuth _auth;
  final FunctionsClient _functions;

  Future<List<ResidentReport>> listMyReports() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return const [];
    final snap = await _db
        .collection('reports')
        .where('residentId', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .limit(50)
        .get();
    return snap.docs.map((d) => ResidentReport.fromFirestore(d.id, d.data())).toList();
  }

  /// requestId dibuat sekali per percobaan kirim -- retry dengan requestId
  /// sama tidak membuat laporan ganda (backend idempotent).
  Future<String> createReport({
    required String requestId,
    required ReportCategory category,
    required String title,
    required String description,
  }) async {
    final result = await _functions.call('createResidentReport', {
      'requestId': requestId,
      'category': category.code,
      'title': title,
      'description': description,
    });
    return result['reportId'] as String;
  }
}
