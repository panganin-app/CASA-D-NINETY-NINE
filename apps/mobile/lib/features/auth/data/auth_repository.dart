import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/errors/app_exception.dart';

/// Metode login: email + password (sesuai scripts/seed-local.mjs).
class AuthRepository {
  AuthRepository({FirebaseAuth? auth}) : _auth = auth ?? FirebaseAuth.instance;

  final FirebaseAuth _auth;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<void> signIn({required String email, required String password}) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
    } on FirebaseAuthException catch (e) {
      throw AppException(code: e.code, message: _signInMessage(e.code));
    }
  }

  Future<void> signOut() => _auth.signOut();

  /// Kirim tautan reset ke email. Pesan sukses SENGAJA sama apa pun hasilnya
  /// (email terdaftar atau tidak) supaya tidak bisa dipakai untuk menebak
  /// akun mana yang terdaftar.
  Future<void> sendPasswordReset(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      if (e.code == 'invalid-email' || e.code == 'too-many-requests') {
        throw AppException(code: e.code, message: _resetMessage(e.code));
      }
      // user-not-found dan lainnya: tetap dianggap berhasil dari sisi UI.
    }
  }

  /// Ubah kata sandi. Firebase mewajibkan login baru-baru ini, jadi kata sandi
  /// lama diverifikasi ulang dulu (reauthenticate) sebelum diganti.
  Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    final user = _auth.currentUser;
    final email = user?.email;
    if (user == null || email == null) {
      throw const AppException(code: 'unauthenticated', message: 'Silakan masuk kembali.');
    }
    try {
      final credential = EmailAuthProvider.credential(email: email, password: currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
    } on FirebaseAuthException catch (e) {
      throw AppException(code: e.code, message: _changeMessage(e.code));
    }
  }

  String _signInMessage(String code) {
    switch (code) {
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Email atau kata sandi salah.';
      case 'user-disabled':
        return 'Akun ini dinonaktifkan. Hubungi pengurus.';
      case 'too-many-requests':
        return 'Terlalu banyak percobaan. Coba lagi nanti.';
      default:
        return 'Gagal masuk. Coba lagi.';
    }
  }

  String _resetMessage(String code) {
    switch (code) {
      case 'invalid-email':
        return 'Format email tidak valid.';
      case 'too-many-requests':
        return 'Terlalu banyak permintaan. Coba lagi nanti.';
      default:
        return 'Gagal mengirim tautan. Coba lagi.';
    }
  }

  String _changeMessage(String code) {
    switch (code) {
      case 'wrong-password':
      case 'invalid-credential':
        return 'Kata sandi saat ini salah.';
      case 'weak-password':
        return 'Kata sandi baru terlalu lemah.';
      case 'requires-recent-login':
        return 'Silakan masuk ulang, lalu coba lagi.';
      case 'too-many-requests':
        return 'Terlalu banyak percobaan. Coba lagi nanti.';
      default:
        return 'Gagal mengubah kata sandi. Coba lagi.';
    }
  }
}
