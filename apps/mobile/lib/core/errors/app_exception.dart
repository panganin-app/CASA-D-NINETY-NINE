/// Error domain generik -- dipetakan dari kode HttpsError backend
/// (invalid-argument, permission-denied, failed-precondition, dst, lihat
/// backend/functions/src/*.ts) ke pesan yang enak ditampilkan UI.
class AppException implements Exception {
  const AppException({required this.code, required this.message});

  final String code;
  final String message;

  bool get isPermissionDenied => code == 'permission-denied';
  bool get isUnauthenticated => code == 'unauthenticated';

  @override
  String toString() => message;
}
