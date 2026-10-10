import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/keuangan/data/keuangan_models.dart';

void main() {
  group('PublishedPeriod.fromMap', () {
    test('memetakan ringkasan dan transaksi sesuai respons backend', () {
      final period = PublishedPeriod.fromMap({
        'periodId': '2026-10',
        'totalIncome': 7800000,
        'totalExpense': 4250000,
        'net': 3550000,
        'transactions': [
          {'type': 'INCOME', 'category': 'IPL', 'amount': 7800000, 'description': 'Pemasukan IPL'},
          {'type': 'EXPENSE', 'category': 'KEAMANAN', 'amount': 2000000, 'description': 'Gaji satpam'},
        ],
      });

      expect(period.periodId, '2026-10');
      expect(period.totalIncome, 7800000);
      expect(period.totalExpense, 4250000);
      expect(period.net, 3550000);
      expect(period.transactions, hasLength(2));
      expect(period.transactions.first.isIncome, isTrue);
      expect(period.transactions.last.isIncome, isFalse);
    });

    test('periode tanpa transaksi tetap valid dan kosong', () {
      final period = PublishedPeriod.fromMap({
        'periodId': '2026-09',
        'totalIncome': 0,
        'totalExpense': 0,
        'net': 0,
      });
      expect(period.transactions, isEmpty);
    });
  });

  group('PublishedTransaction', () {
    test('jumlah dibaca sebagai bilangan bulat', () {
      final tx = PublishedTransaction.fromMap({
        'type': 'EXPENSE',
        'category': 'KEBERSIHAN',
        'amount': 1500000,
        'description': 'Kebersihan',
      });
      expect(tx.amount, 1500000);
      expect(tx.isIncome, isFalse);
    });
  });
}
