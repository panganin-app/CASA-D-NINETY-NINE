/// Konten yang sudah dipublikasikan (pengumuman atau agenda). Backend
/// (`listPublishedContent`) yang menyaring status PUBLISHED -- client tidak
/// pernah melihat draft/arsip.
enum ContentType {
  announcements('announcements', 'Pengumuman'),
  events('events', 'Agenda');

  const ContentType(this.apiValue, this.label);

  final String apiValue;
  final String label;
}

class PublishedItem {
  const PublishedItem({
    required this.id,
    required this.title,
    required this.description,
    this.startsAt,
    this.endsAt,
    this.location,
  });

  final String id;
  final String title;
  final String description;

  /// Hanya terisi untuk agenda. Backend mengirim ISO string/timestamp; kalau
  /// tidak bisa diparse, dibiarkan null supaya tampilan tetap jalan.
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? location;

  factory PublishedItem.fromMap(Map<String, dynamic> map) {
    return PublishedItem(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      startsAt: _parseDate(map['startsAt']),
      endsAt: _parseDate(map['endsAt']),
      location: map['location'] as String?,
    );
  }

  static DateTime? _parseDate(Object? raw) {
    if (raw is String) return DateTime.tryParse(raw);
    if (raw is Map && raw['_seconds'] is num) {
      return DateTime.fromMillisecondsSinceEpoch((raw['_seconds'] as num).toInt() * 1000, isUtc: true);
    }
    return null;
  }
}

class PublishedPage {
  const PublishedPage({required this.items, this.nextCursor});

  final List<PublishedItem> items;
  final String? nextCursor;
}
