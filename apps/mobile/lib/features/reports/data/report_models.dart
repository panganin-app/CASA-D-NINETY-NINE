import 'package:cloud_firestore/cloud_firestore.dart';

/// Kategori tetap -- harus sama persis dengan `categories` di
/// backend/functions/src/community.ts (backend yang tetap jadi sumber kebenaran).
enum ReportCategory {
  facilities('FACILITIES', 'Fasilitas'),
  security('SECURITY', 'Keamanan'),
  cleanliness('CLEANLINESS', 'Kebersihan'),
  environment('ENVIRONMENT', 'Lingkungan'),
  internet('INTERNET', 'Internet'),
  other('OTHER', 'Lainnya');

  const ReportCategory(this.code, this.label);

  final String code;
  final String label;
}

enum ReportStatus { submitted, inReview, inProgress, resolved, rejected, closed, unknown }

ReportStatus reportStatusFrom(String? raw) {
  switch (raw) {
    case 'SUBMITTED':
      return ReportStatus.submitted;
    case 'IN_REVIEW':
      return ReportStatus.inReview;
    case 'IN_PROGRESS':
      return ReportStatus.inProgress;
    case 'RESOLVED':
      return ReportStatus.resolved;
    case 'REJECTED':
      return ReportStatus.rejected;
    case 'CLOSED':
      return ReportStatus.closed;
    default:
      return ReportStatus.unknown;
  }
}

class ResidentReport {
  const ResidentReport({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.status,
    this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final String category;
  final ReportStatus status;
  final DateTime? createdAt;

  String get categoryLabel {
    for (final c in ReportCategory.values) {
      if (c.code == category) return c.label;
    }
    return category;
  }

  factory ResidentReport.fromFirestore(String id, Map<String, dynamic> data) {
    final created = data['createdAt'];
    return ResidentReport(
      id: id,
      title: data['title'] as String? ?? '',
      description: data['description'] as String? ?? '',
      category: data['category'] as String? ?? '',
      status: reportStatusFrom(data['status'] as String?),
      createdAt: created is Timestamp ? created.toDate() : null,
    );
  }
}
