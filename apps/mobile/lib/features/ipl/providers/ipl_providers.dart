import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../home/providers/home_providers.dart';
import '../data/ipl_models.dart';
import '../data/ipl_repository.dart';

final iplRepositoryProvider = Provider<IplRepository>((ref) {
  return IplRepository(functions: ref.watch(functionsClientProvider));
});

/// Daftar tagihan IPL rumah pengguna. Rumah diambil dari getMyHousehold
/// (sumber kebenaran backend, bukan dari dokumen user di client).
final iplBillsProvider = FutureProvider.autoDispose<List<IplBill>>((ref) async {
  final household = await ref.watch(householdProvider.future);
  return ref.watch(iplRepositoryProvider).listBills(household.houseId);
});

final iplBillDetailProvider = FutureProvider.autoDispose.family<IplBill?, String>((ref, billId) async {
  final bills = await ref.watch(iplBillsProvider.future);
  for (final bill in bills) {
    if (bill.id == billId) return bill;
  }
  return null;
});

final paymentInstructionsProvider =
    FutureProvider.autoDispose.family<PaymentInstructions, String>((ref, billId) async {
  return ref.watch(iplRepositoryProvider).getPaymentInstructions(billId);
});
