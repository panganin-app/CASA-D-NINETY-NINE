/// Satu transaksi yang sudah dipublikasikan. Backend hanya mengirim field ini
/// (tanpa createdBy/audit), jadi client tidak pernah melihat data internal.
class PublishedTransaction {
  const PublishedTransaction({
    required this.type,
    required this.category,
    required this.amount,
    required this.description,
  });

  final String type; // INCOME | EXPENSE
  final String category;
  final int amount;
  final String description;

  bool get isIncome => type == 'INCOME';

  factory PublishedTransaction.fromMap(Map<String, dynamic> map) {
    return PublishedTransaction(
      type: map['type'] as String? ?? '',
      category: map['category'] as String? ?? '',
      amount: (map['amount'] as num?)?.toInt() ?? 0,
      description: map['description'] as String? ?? '',
    );
  }
}

class PublishedPeriod {
  const PublishedPeriod({
    required this.periodId,
    required this.totalIncome,
    required this.totalExpense,
    required this.net,
    required this.transactions,
  });

  final String periodId;
  final int totalIncome;
  final int totalExpense;
  final int net;
  final List<PublishedTransaction> transactions;

  factory PublishedPeriod.fromMap(Map<String, dynamic> map) {
    final rawTx = (map['transactions'] as List?) ?? const [];
    return PublishedPeriod(
      periodId: map['periodId'] as String? ?? '',
      totalIncome: (map['totalIncome'] as num?)?.toInt() ?? 0,
      totalExpense: (map['totalExpense'] as num?)?.toInt() ?? 0,
      net: (map['net'] as num?)?.toInt() ?? 0,
      transactions: rawTx
          .map((e) => PublishedTransaction.fromMap(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}
