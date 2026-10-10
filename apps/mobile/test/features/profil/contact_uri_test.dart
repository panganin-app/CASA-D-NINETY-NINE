import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/core/config/contact_config.dart';
import 'package:casa_resident/features/profil/presentation/contact_screen.dart';

void main() {
  test('kontak tanpa nomor tidak menghasilkan tautan (tidak ada nomor palsu)', () {
    const c = ContactItem(label: 'Ketua', description: '-');
    expect(phoneUri(c), isNull);
    expect(whatsappUri(c), isNull);
  });

  test('nomor telepon dan WhatsApp dibentuk dari format internasional', () {
    const c = ContactItem(label: 'Ketua', description: '-', phone: '6281234567890', whatsapp: '6281234567890');
    expect(phoneUri(c).toString(), 'tel:+6281234567890');
    expect(whatsappUri(c).toString(), 'https://wa.me/6281234567890');
  });
}
