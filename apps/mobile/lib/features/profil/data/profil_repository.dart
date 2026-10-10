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

  /// Tambah anggota keluarga (hanya kepala keluarga, dibatasi backend).
  Future<void> saveFamilyMember({
    required String requestId,
    required String fullName,
    required Relationship relationship,
    String? phone,
  }) async {
    await _functions.call('saveFamilyMember', {
      'requestId': requestId,
      'fullName': fullName,
      'relationship': relationship.code,
      'phone': ?phone,
    });
  }

  Future<void> updateFamilyMember({
    required FamilyMemberItem member,
    required String fullName,
    required Relationship relationship,
    String? phone,
  }) async {
    await _functions.call('saveFamilyMember', {
      'familyMemberId': member.id,
      'expectedVersion': member.version,
      'fullName': fullName,
      'relationship': relationship.code,
      'phone': ?phone,
    });
  }

  Future<void> removeFamilyMember(FamilyMemberItem member) async {
    await _functions.call('removeFamilyMember', {'familyMemberId': member.id, 'expectedVersion': member.version});
  }

  Future<void> saveVehicle({
    required String requestId,
    required String plateNumber,
    required VehicleType type,
    String? brand,
    String? color,
  }) async {
    await _functions.call('saveVehicle', {
      'requestId': requestId,
      'plateNumber': plateNumber,
      'type': type.code,
      'brand': ?brand,
      'color': ?color,
    });
  }

  Future<void> updateVehicle({
    required VehicleItem vehicle,
    required String plateNumber,
    required VehicleType type,
    String? brand,
    String? color,
  }) async {
    await _functions.call('saveVehicle', {
      'vehicleId': vehicle.id,
      'expectedVersion': vehicle.version,
      'plateNumber': plateNumber,
      'type': type.code,
      'brand': ?brand,
      'color': ?color,
    });
  }

  Future<void> removeVehicle(VehicleItem vehicle) async {
    await _functions.call('removeVehicle', {'vehicleId': vehicle.id, 'expectedVersion': vehicle.version});
  }
}
