class ProfilSaya {
  const ProfilSaya({
    required this.displayName,
    required this.email,
    required this.phone,
    required this.houseLabel,
    required this.isHead,
    required this.version,
  });

  final String displayName;
  final String email;
  final String phone;
  final String houseLabel;
  final bool isHead;

  /// Versi optimistik profil residents/{uid} -- wajib dikirim saat update.
  final int version;

  String get initials {
    final parts = displayName.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1)).toUpperCase();
  }
}

/// Hubungan keluarga -- harus sama dengan backend (household.ts).
enum Relationship {
  pasangan('PASANGAN', 'Pasangan'),
  anak('ANAK', 'Anak'),
  orangTua('ORANG_TUA', 'Orang tua'),
  lainnya('LAINNYA', 'Lainnya');

  const Relationship(this.code, this.label);
  final String code;
  final String label;

  static String labelOf(String code) {
    for (final r in values) {
      if (r.code == code) return r.label;
    }
    return code;
  }
}

/// Jenis kendaraan -- harus sama dengan backend (household.ts).
enum VehicleType {
  mobil('MOBIL', 'Mobil'),
  motor('MOTOR', 'Motor'),
  lainnya('LAINNYA', 'Lainnya');

  const VehicleType(this.code, this.label);
  final String code;
  final String label;

  static String labelOf(String code) {
    for (final t in values) {
      if (t.code == code) return t.label;
    }
    return code;
  }
}

class FamilyMemberItem {
  const FamilyMemberItem({
    required this.id,
    required this.fullName,
    required this.relationship,
    required this.phone,
    required this.version,
  });

  final String id;
  final String fullName;
  final String relationship;
  final String? phone;
  final int version;

  factory FamilyMemberItem.fromMap(Map<String, dynamic> map) {
    return FamilyMemberItem(
      id: map['id'] as String,
      fullName: map['fullName'] as String? ?? '',
      relationship: map['relationship'] as String? ?? '',
      phone: map['phone'] as String?,
      version: (map['version'] as num?)?.toInt() ?? 1,
    );
  }
}

class VehicleItem {
  const VehicleItem({
    required this.id,
    required this.plateNumber,
    required this.type,
    required this.version,
    this.brand,
    this.color,
  });

  final String id;
  final String plateNumber;
  final String type;
  final int version;
  final String? brand;
  final String? color;

  factory VehicleItem.fromMap(Map<String, dynamic> map) {
    return VehicleItem(
      id: map['id'] as String,
      plateNumber: map['plateNumber'] as String? ?? '',
      type: map['type'] as String? ?? '',
      version: (map['version'] as num?)?.toInt() ?? 1,
      brand: map['brand'] as String?,
      color: map['color'] as String?,
    );
  }
}
