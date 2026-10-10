import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/profil/data/profil_models.dart';

void main() {
  test('kode hubungan keluarga cocok dengan backend', () {
    expect(Relationship.values.map((r) => r.code).toList(), ['PASANGAN', 'ANAK', 'ORANG_TUA', 'LAINNYA']);
    expect(Relationship.labelOf('ORANG_TUA'), 'Orang tua');
    expect(Relationship.labelOf('TIDAK_DIKENAL'), 'TIDAK_DIKENAL');
  });

  test('kode jenis kendaraan cocok dengan backend', () {
    expect(VehicleType.values.map((t) => t.code).toList(), ['MOBIL', 'MOTOR', 'LAINNYA']);
    expect(VehicleType.labelOf('MOTOR'), 'Motor');
  });

  test('versi dibaca dari data backend, default 1 kalau tidak ada', () {
    final m = FamilyMemberItem.fromMap({'id': 'f1', 'fullName': 'Budi', 'relationship': 'ANAK', 'version': 3});
    expect(m.version, 3);
    final v = VehicleItem.fromMap({'id': 'v1', 'plateNumber': 'B 1 X', 'type': 'MOBIL'});
    expect(v.version, 1);
  });
}
