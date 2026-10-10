import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/auth/domain/password_rules.dart';

void main() {
  test('kata sandi kurang dari 8 karakter ditolak', () {
    expect(validateNewPassword('abc1234'), isNotNull);
  });

  test('kata sandi 8 karakter atau lebih diterima', () {
    expect(validateNewPassword('abcd1234'), isNull);
  });

  test('kata sandi baru tidak boleh sama dengan yang lama', () {
    expect(validateNewPassword('abcd1234', currentPassword: 'abcd1234'), isNotNull);
    expect(validateNewPassword('wxyz9876', currentPassword: 'abcd1234'), isNull);
  });
}
