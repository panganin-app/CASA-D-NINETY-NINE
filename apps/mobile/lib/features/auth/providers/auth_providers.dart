import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository());

/// Stream status login -- SATU-SATUNYA sumber kebenaran "siapa yang login
/// sekarang", dipakai router (lihat routing/app_router.dart) buat redirect
/// protected routes. Firebase Auth SDK sendiri yang jaga token/sesi.
final authStateProvider = StreamProvider<User?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});
