import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/errors/app_exception.dart';

/// Metode login: email + password (sesuai scripts/seed-local.mjs di root
/// repo, yang satu-satunya bukti konkret skema auth yang ada sekarang --
/// PRD §8.1 cuma nulis "Login" generik, gak merinci metode).
class AuthRepository {
  AuthRepository({FirebaseAuth? auth}) : _auth = auth ?? FirebaseAuth.instance;

  final FirebaseAuth _auth;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<void> signIn({required String email, required String password}) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
    } on FirebaseAuthException catch (e) {
      throw AppException(code: e.code, message: _friendlyMessage(e.code));
    }
  }

  Future<void> signOut() => _auth.signOut();

  String _friendlyMessage(String code) {
    switch (code) {
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Email atau kata sandi salah.';
      case 'user-disabled':
        return 'Akun ini dinonaktifkan.';
      case 'too-many-requests':
        return 'Terlalu banyak percobaan. Coba lagi nanti.';
      default:
        return 'Gagal masuk. Coba lagi.';
    }
  }
}
