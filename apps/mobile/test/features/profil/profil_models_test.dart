import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/profil/data/profil_models.dart';

void main() {
  group('ProfilSaya.initials', () {
    ProfilSaya named(String name) => ProfilSaya(
          displayName: name,
          email: '',
          phone: '',
          houseLabel: 'A1',
          isHead: false,
          version: 0,
        );

    test('dua kata -> huruf pertama tiap kata', () {
      expect(named('Arni Lo').initials, 'AL');
    });

    test('satu kata -> satu huruf', () {
      expect(named('Budi').initials, 'B');
    });

    test('nama kosong -> tanda tanya, tidak crash', () {
      expect(named('').initials, '?');
      expect(named('   ').initials, '?');
    });

    test('spasi berlebih di antara kata tidak merusak inisial', () {
      expect(named('  Arni    Lo  ').initials, 'AL');
    });
  });

  group('FamilyMemberItem.fromMap', () {
    test('memetakan anggota keluarga dengan telepon opsional', () {
      final item = FamilyMemberItem.fromMap({
        'id': 'f1',
        'fullName': 'Siti',
        'relationship': 'PASANGAN',
      });
      expect(item.fullName, 'Siti');
      expect(item.relationship, 'PASANGAN');
      expect(item.phone, isNull);
    });
  });

  group('VehicleItem.fromMap', () {
    test('memetakan kendaraan dengan merek dan warna opsional', () {
      final item = VehicleItem.fromMap({
        'id': 'v1',
        'plateNumber': 'B 1234 XYZ',
        'type': 'MOBIL',
        'brand': 'Toyota',
      });
      expect(item.plateNumber, 'B 1234 XYZ');
      expect(item.brand, 'Toyota');
      expect(item.color, isNull);
    });
  });
}
