import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/tagihan/data/bill_models.dart';
import 'package:casa_resident/shared/format/format.dart';

Bill _bill(BillStatus status) => Bill(id: 'b1', houseId: 'h1', period: '2026-10', amount: 100000, status: status);

void main() {
  group('billStatusFrom', () {
    test('memetakan setiap status backend', () {
      expect(billStatusFrom('UNPAID'), BillStatus.unpaid);
      expect(billStatusFrom('PENDING_VERIFICATION'), BillStatus.pendingVerification);
      expect(billStatusFrom('PAID'), BillStatus.paid);
      expect(billStatusFrom('OVERDUE'), BillStatus.overdue);
      expect(billStatusFrom('CANCELLED'), BillStatus.cancelled);
    });

    test('status tidak dikenal tidak dianggap bisa dibayar', () {
      expect(billStatusFrom('SOMETHING_NEW'), BillStatus.unknown);
      expect(billStatusFrom(null), BillStatus.unknown);
      expect(_bill(BillStatus.unknown).canPay, isFalse);
    });
  });

  group('Bill.canPay', () {
    test('hanya UNPAID dan OVERDUE yang boleh dibayar', () {
      expect(_bill(BillStatus.unpaid).canPay, isTrue);
      expect(_bill(BillStatus.overdue).canPay, isTrue);
      expect(_bill(BillStatus.paid).canPay, isFalse);
      expect(_bill(BillStatus.pendingVerification).canPay, isFalse);
      expect(_bill(BillStatus.cancelled).canPay, isFalse);
    });
  });

  group('BillKind', () {
    test('nilai API dan nama koleksi cocok dengan backend', () {
      expect(BillKind.ipl.apiValue, 'ipl');
      expect(BillKind.ipl.collection, 'ipl_bills');
      expect(BillKind.internet.apiValue, 'internet');
      expect(BillKind.internet.collection, 'internet_bills');
    });
  });

  group('InternetSubscription.fromFirestore', () {
    test('status dan paket dibaca, masa aktif opsional', () {
      final sub = InternetSubscription.fromFirestore({'status': 'ACTIVE', 'packageId': 'INTERNET_50'});
      expect(sub.status, 'ACTIVE');
      expect(sub.packageId, 'INTERNET_50');
      expect(sub.activeUntil, isNull);
    });
  });

  group('formatRupiah', () {
    test('format ribuan dengan titik', () {
      expect(formatRupiah(100000), 'Rp100.000');
      expect(formatRupiah(1500000), 'Rp1.500.000');
      expect(formatRupiah(500), 'Rp500');
      expect(formatRupiah(0), 'Rp0');
    });

    test('nilai negatif tetap benar', () {
      expect(formatRupiah(-2000000), '-Rp2.000.000');
    });
  });
}
