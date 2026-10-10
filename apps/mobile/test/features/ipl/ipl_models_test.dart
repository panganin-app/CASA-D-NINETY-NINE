import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/ipl/data/ipl_models.dart';
import 'package:casa_resident/features/ipl/presentation/ipl_list_screen.dart';

void main() {
  group('iplBillStatusFrom', () {
    test('memetakan setiap status backend ke enum yang benar', () {
      expect(iplBillStatusFrom('UNPAID'), IplBillStatus.unpaid);
      expect(iplBillStatusFrom('PENDING_VERIFICATION'), IplBillStatus.pendingVerification);
      expect(iplBillStatusFrom('PAID'), IplBillStatus.paid);
      expect(iplBillStatusFrom('OVERDUE'), IplBillStatus.overdue);
      expect(iplBillStatusFrom('CANCELLED'), IplBillStatus.cancelled);
    });

    test('status tidak dikenal jatuh ke unknown, bukan dianggap bisa dibayar', () {
      expect(iplBillStatusFrom('SOMETHING_NEW'), IplBillStatus.unknown);
      expect(iplBillStatusFrom(null), IplBillStatus.unknown);
    });
  });

  group('IplBill.canPay', () {
    IplBill billWith(IplBillStatus status) => IplBill(
          id: 'b1',
          houseId: 'h1',
          period: '2026-10',
          amount: 100000,
          status: status,
        );

    test('hanya UNPAID dan OVERDUE yang boleh dibayar', () {
      expect(billWith(IplBillStatus.unpaid).canPay, isTrue);
      expect(billWith(IplBillStatus.overdue).canPay, isTrue);
      expect(billWith(IplBillStatus.paid).canPay, isFalse);
      expect(billWith(IplBillStatus.pendingVerification).canPay, isFalse);
      expect(billWith(IplBillStatus.cancelled).canPay, isFalse);
    });
  });

  group('formatRupiah', () {
    test('format ribuan dengan titik sesuai format Indonesia', () {
      expect(formatRupiah(100000), 'Rp100.000');
      expect(formatRupiah(1500000), 'Rp1.500.000');
      expect(formatRupiah(500), 'Rp500');
    });
  });
}
