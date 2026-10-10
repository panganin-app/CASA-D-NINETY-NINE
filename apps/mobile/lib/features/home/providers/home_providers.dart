import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/functions_client.dart';

final functionsClientProvider = Provider<FunctionsClient>((ref) => FunctionsClient());

class HouseholdInfo {
  const HouseholdInfo({required this.houseId, required this.label, required this.isHead, this.occupancyType});
  final String houseId;
  final String label;
  final bool isHead;

  /// 'OWNER' (milik sendiri), 'RENTER' (sewa/kontrak), atau null kalau belum diatur pengurus.
  final String? occupancyType;
}

/// getMyHousehold (callable) -- lihat backend/functions/src/index.ts.
/// autoDispose: data rumah gak sering berubah tapi kecil & murah, gak ada
/// alasan nyangkut di cache sepanjang sesi app.
final householdProvider = FutureProvider.autoDispose<HouseholdInfo>((ref) async {
  final client = ref.watch(functionsClientProvider);
  final result = await client.call('getMyHousehold');
  return HouseholdInfo(
    houseId: result['houseId'] as String,
    label: result['label'] as String,
    isHead: result['isHead'] as bool,
    occupancyType: result['occupancyType'] as String?,
  );
});

/// users/{uid} dibaca LANGSUNG lewat Firestore client SDK (bukan
/// callable) -- rules sudah mengizinkan resident baca dokumen users milik
/// sendiri (lihat firebase/firestore/firestore.rules), jadi gak perlu
/// bikin callable baru cuma buat baca displayName.
final myDisplayNameProvider = StreamProvider.autoDispose<String?>((ref) {
  final uid = FirebaseAuth.instance.currentUser?.uid;
  if (uid == null) return const Stream.empty();
  return FirebaseFirestore.instance
      .doc('users/$uid')
      .snapshots()
      .map((snap) => snap.data()?['displayName'] as String?);
});

class AnnouncementSummary {
  const AnnouncementSummary({required this.id, required this.title, required this.description});
  final String id;
  final String title;
  final String description;
}

/// Pengumuman terbaru -- satu item teratas saja (Home cuma nampilin
/// preview, daftar lengkap ada di halaman Pengumuman tersendiri yang
/// belum dibangun di pass ini).
final latestAnnouncementProvider = FutureProvider.autoDispose<AnnouncementSummary?>((ref) async {
  final client = ref.watch(functionsClientProvider);
  final result = await client.call('listPublishedContent', {'type': 'announcements', 'limit': 1});
  final items = (result['items'] as List?) ?? const [];
  if (items.isEmpty) return null;
  final first = Map<String, dynamic>.from(items.first as Map);
  return AnnouncementSummary(
    id: first['id'] as String,
    title: first['title'] as String,
    description: first['description'] as String,
  );
});
