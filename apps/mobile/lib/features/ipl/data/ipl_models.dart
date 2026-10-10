import 'package:cloud_firestore/cloud_firestore.dart';

/// Status tagihan -- hanya dibaca dari backend, client TIDAK PERNAH menulis
/// PAID (lihat IPL_BUSINESS_RULES.md "Critical state rule").
enum IplBillStatus { unpaid, pendingVerification, paid, overdue, cancelled, unknown }

IplBillStatus iplBillStatusFrom(String? raw) {
  switch (raw) {
    case 'UNPAID':
      return IplBillStatus.unpaid;
    case 'PENDING_VERIFICATION':
      return IplBillStatus.pendingVerification;
    case 'PAID':
      return IplBillStatus.paid;
    case 'OVERDUE':
      return IplBillStatus.overdue;
    case 'CANCELLED':
      return IplBillStatus.cancelled;
    default:
      return IplBillStatus.unknown;
  }
}

class IplBill {
  const IplBill({
    required this.id,
    required this.houseId,
    required this.period,
    required this.amount,
    required this.status,
    this.dueDate,
  });

  final String id;
  final String houseId;
  final String period;
  final int amount;
  final IplBillStatus status;
  final DateTime? dueDate;

  bool get canPay => status == IplBillStatus.unpaid || status == IplBillStatus.overdue;

  factory IplBill.fromFirestore(String id, Map<String, dynamic> data) {
    final due = data['dueDate'];
    return IplBill(
      id: id,
      houseId: data['houseId'] as String? ?? '',
      period: data['period'] as String? ?? '',
      amount: (data['amount'] as num?)?.toInt() ?? 0,
      status: iplBillStatusFrom(data['status'] as String?),
      dueDate: due is Timestamp ? due.toDate() : null,
    );
  }
}

/// Instruksi transfer BCA dari backend (getPaymentInstructions) -- nomor
/// rekening TIDAK pernah di-hardcode di client.
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
