import 'package:cloud_firestore/cloud_firestore.dart';

/// Jenis tagihan. Nilai `apiValue` dipakai backend (callable & nama koleksi).
enum BillKind {
  ipl('ipl', 'ipl_bills', 'IPL'),
  internet('internet', 'internet_bills', 'Internet');

  const BillKind(this.apiValue, this.collection, this.label);

  final String apiValue;
  final String collection;
  final String label;
}

/// Status tagihan -- hanya dibaca dari backend. Client TIDAK PERNAH menetapkan PAID.
enum BillStatus { unpaid, pendingVerification, paid, overdue, cancelled, unknown }

BillStatus billStatusFrom(String? raw) {
  switch (raw) {
    case 'UNPAID':
      return BillStatus.unpaid;
    case 'PENDING_VERIFICATION':
      return BillStatus.pendingVerification;
    case 'PAID':
      return BillStatus.paid;
    case 'OVERDUE':
      return BillStatus.overdue;
    case 'CANCELLED':
      return BillStatus.cancelled;
    default:
      return BillStatus.unknown;
  }
}

class Bill {
  const Bill({
    required this.id,
    required this.houseId,
    required this.period,
    required this.amount,
    required this.status,
    this.packageId,
    this.dueDate,
  });

  final String id;
  final String houseId;
  final String period;
  final int amount;
  final BillStatus status;

  /// Hanya untuk tagihan internet (mis. INTERNET_50).
  final String? packageId;
  final DateTime? dueDate;

  bool get canPay => status == BillStatus.unpaid || status == BillStatus.overdue;

  factory Bill.fromFirestore(String id, Map<String, dynamic> data) {
    final due = data['dueDate'];
    return Bill(
      id: id,
      houseId: data['houseId'] as String? ?? '',
      period: data['period'] as String? ?? '',
      amount: (data['amount'] as num?)?.toInt() ?? 0,
      status: billStatusFrom(data['status'] as String?),
      packageId: data['packageId'] as String?,
      dueDate: due is Timestamp ? due.toDate() : null,
    );
  }
}

/// Instruksi transfer BCA dari backend (getPaymentInstructions). Nomor rekening
/// TIDAK pernah di-hardcode di client.
class PaymentInstructions {
  const PaymentInstructions({
    required this.bank,
    required this.accountNumber,
    required this.accountHolder,
    required this.amount,
  });

  final String bank;
  final String accountNumber;
  final String accountHolder;
  final int amount;

  factory PaymentInstructions.fromMap(Map<String, dynamic> data) {
    return PaymentInstructions(
      bank: data['bank'] as String? ?? 'BCA',
      accountNumber: data['accountNumber'] as String? ?? '',
      accountHolder: data['accountHolder'] as String? ?? '',
      amount: (data['amount'] as num?)?.toInt() ?? 0,
    );
  }
}

class InternetPackage {
  const InternetPackage({required this.id, required this.speedMbps, required this.amount});

  final String id;
  final int speedMbps;
  final int amount;

  String get label => '$speedMbps Mbps';
}

/// Status langganan internet rumah (dibaca langsung; rules membatasi ke rumah sendiri).
class InternetSubscription {
  const InternetSubscription({required this.status, this.packageId, this.activeUntil});

  final String status;
  final String? packageId;
  final DateTime? activeUntil;

  factory InternetSubscription.fromFirestore(Map<String, dynamic> data) {
    final until = data['activeUntil'];
    return InternetSubscription(
      status: data['status'] as String? ?? 'UNKNOWN',
      packageId: data['packageId'] as String?,
      activeUntil: until is Timestamp ? until.toDate() : null,
    );
  }
}
