import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/informasi/data/informasi_models.dart';

void main() {
  group('PublishedItem.fromMap', () {
    test('pengumuman tanpa waktu agenda -- field waktu dibiarkan null', () {
      final item = PublishedItem.fromMap({
        'id': 'a1',
        'title': 'Kerja bakti',
        'description': 'Sabtu pagi',
        'version': 1,
      });
      expect(item.id, 'a1');
      expect(item.title, 'Kerja bakti');
      expect(item.startsAt, isNull);
      expect(item.location, isNull);
    });

    test('agenda dengan waktu ISO string dan lokasi', () {
      final item = PublishedItem.fromMap({
        'id': 'e1',
        'title': 'Rapat warga',
        'description': 'Agenda bulanan',
        'startsAt': '2026-10-20T10:00:00.000Z',
        'endsAt': '2026-10-20T11:00:00.000Z',
        'location': 'Balai RW',
      });
      expect(item.startsAt, DateTime.parse('2026-10-20T10:00:00.000Z'));
      expect(item.endsAt, DateTime.parse('2026-10-20T11:00:00.000Z'));
      expect(item.location, 'Balai RW');
    });

    test('waktu dalam bentuk Timestamp Firestore (_seconds) juga dikenali', () {
      final item = PublishedItem.fromMap({
        'id': 'e2',
        'title': 'Olahraga',
        'description': '-',
        'startsAt': {'_seconds': 1792500000},
      });
      expect(item.startsAt, isNotNull);
      expect(item.startsAt!.isUtc, isTrue);
    });

    test('waktu tidak valid tidak membuat parsing gagal', () {
      final item = PublishedItem.fromMap({
        'id': 'e3',
        'title': 'Acara',
        'description': '-',
        'startsAt': 'bukan-tanggal',
      });
      expect(item.startsAt, isNull);
    });
  });

  group('ContentType', () {
    test('nilai API cocok dengan nama koleksi di backend', () {
      expect(ContentType.announcements.apiValue, 'announcements');
      expect(ContentType.events.apiValue, 'events');
    });
  });
}
