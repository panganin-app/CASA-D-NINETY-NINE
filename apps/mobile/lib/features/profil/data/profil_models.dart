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

class FamilyMemberItem {
  const FamilyMemberItem({
    required this.id,
    required this.fullName,
    required this.relationship,
    required this.phone,
  });

  final String id;
  final String fullName;
  final String relationship;
  final String? phone;

  factory FamilyMemberItem.fromMap(Map<String, dynamic> map) {
    return FamilyMemberItem(
      id: map['id'] as String,
      fullName: map['fullName'] as String? ?? '',
      relationship: map['relationship'] as String? ?? '',
      phone: map['phone'] as String?,
    );
  }
}

class VehicleItem {
  const VehicleItem({
    required this.id,
    required this.plateNumber,
    required this.type,
    this.brand,
    this.color,
  });

  final String id;
  final String plateNumber;
  final String type;
  final String? brand;
  final String? color;

  factory VehicleItem.fromMap(Map<String, dynamic> map) {
    return VehicleItem(
      id: map['id'] as String,
      plateNumber: map['plateNumber'] as String? ?? '',
      type: map['type'] as String? ?? '',
      brand: map['brand'] as String?,
      color: map['color'] as String?,
    );
  }
}
