import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/reports/data/report_models.dart';

void main() {
  group('reportStatusFrom', () {
    test('memetakan setiap status backend ke enum yang benar', () {
      expect(reportStatusFrom('SUBMITTED'), ReportStatus.submitted);
      expect(reportStatusFrom('IN_REVIEW'), ReportStatus.inReview);
      expect(reportStatusFrom('IN_PROGRESS'), ReportStatus.inProgress);
      expect(reportStatusFrom('RESOLVED'), ReportStatus.resolved);
      expect(reportStatusFrom('REJECTED'), ReportStatus.rejected);
      expect(reportStatusFrom('CLOSED'), ReportStatus.closed);
    });

    test('status tidak dikenal jatuh ke unknown', () {
      expect(reportStatusFrom('NEW_STATUS'), ReportStatus.unknown);
      expect(reportStatusFrom(null), ReportStatus.unknown);
    });
  });

  group('ReportCategory', () {
    test('kode kategori cocok dengan daftar tetap di backend', () {
      expect(ReportCategory.values.map((c) => c.code).toList(), [
        'FACILITIES',
        'SECURITY',
        'CLEANLINESS',
        'ENVIRONMENT',
        'INTERNET',
        'OTHER',
      ]);
    });
  });

  group('ResidentReport.categoryLabel', () {
    test('menerjemahkan kode kategori ke label Indonesia', () {
      const report = ResidentReport(
        id: 'r1',
        title: 'Lampu jalan mati',
        description: 'Gelap',
        category: 'SECURITY',
        status: ReportStatus.submitted,
      );
      expect(report.categoryLabel, 'Keamanan');
    });
  });
}
