/// Aturan kata sandi baru di sisi app. Firebase punya minimum 6 karakter;
/// untuk akun warga kita pakai 8 sebagai batas yang lebih aman.
const int minPasswordLength = 8;

/// Pesan error untuk kata sandi baru, atau null kalau sudah valid.
String? validateNewPassword(String value, {String? currentPassword}) {
  if (value.length < minPasswordLength) {
    return 'Kata sandi minimal $minPasswordLength karakter.';
  }
  if (currentPassword != null && value == currentPassword) {
    return 'Kata sandi baru harus berbeda dari yang lama.';
  }
  return null;
}
