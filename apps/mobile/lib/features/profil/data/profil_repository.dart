import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/network/functions_client.dart';
import 'profil_models.dart';

/// Profil dibaca dari `users/{uid}` dan `residents/{uid}` (rules mengizinkan
/// pemilik membaca datanya sendiri). Semua perubahan lewat Cloud Functions.
class ProfilRepository {
  ProfilRepository({FirebaseFirestore? firestore, FirebaseAuth? auth, FunctionsClient? functions})
      : _db = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance,
        _functions = functions ?? FunctionsClient();

  final FirebaseFirestore _db;
  final FirebaseAuth _auth;
  final FunctionsClient _functions;

  Future<ProfilSaya?> loadProfile(String houseLabel) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return null;
    final user = (await _db.doc('users/$uid').get()).data() ?? const {};
    final resident = (await _db.doc('residents/$uid').get()).data() ?? const {};
    return ProfilSaya(
      displayName: user['displayName'] as String? ?? '',
      email: _auth.currentUser?.email ?? '',
      phone: resident['phone'] as String? ?? '',
      houseLabel: houseLabel,
      isHead: user['isHead'] == true,
      version: (resident['version'] as num?)?.toInt() ?? 0,
    );
  }

  Future<List<FamilyMemberItem>> listFamilyMembers() async {
    final result = await _functions.call('listFamilyMembers');
    return ((result['items'] as List?) ?? const [])
        .map((e) => FamilyMemberItem.fromMap(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<List<VehicleItem>> listVehicles() async {
    final result = await _functions.call('listVehicles');
    return ((result['items'] as List?) ?? const [])
        .map((e) => VehicleItem.fromMap(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  /// Ubah telepon/email. Backend menolak kalau `expectedVersion` sudah usang
  /// (profil diubah dari tempat lain) -- UI harus memuat ulang.
  Future<void> updateContact({String? phone, String? email, required int expectedVersion}) async {
    await _functions.call('updateResidentProfile', {
      'phone': ?phone,
      'email': ?email,
      'expectedVersion': expectedVersion,
    });
  }
}
