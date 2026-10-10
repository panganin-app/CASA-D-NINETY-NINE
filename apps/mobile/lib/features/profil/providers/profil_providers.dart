import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../home/providers/home_providers.dart';
import '../data/profil_models.dart';
import '../data/profil_repository.dart';

final profilRepositoryProvider = Provider<ProfilRepository>((ref) {
  return ProfilRepository(functions: ref.watch(functionsClientProvider));
});

final profilSayaProvider = FutureProvider.autoDispose<ProfilSaya?>((ref) async {
  final household = await ref.watch(householdProvider.future);
  return ref.watch(profilRepositoryProvider).loadProfile(household.label);
});

final familyMembersProvider = FutureProvider.autoDispose<List<FamilyMemberItem>>((ref) {
  return ref.watch(profilRepositoryProvider).listFamilyMembers();
});

final vehiclesProvider = FutureProvider.autoDispose<List<VehicleItem>>((ref) {
  return ref.watch(profilRepositoryProvider).listVehicles();
});

/// Foto kendaraan. Null kalau kendaraan belum punya foto.
final vehiclePhotoProvider = FutureProvider.autoDispose.family<Uint8List?, String>((ref, vehicleId) async {
  return ref.watch(profilRepositoryProvider).getVehiclePhoto(vehicleId);
});
