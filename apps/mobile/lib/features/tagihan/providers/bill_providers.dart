import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../home/providers/home_providers.dart';
import '../data/bill_models.dart';
import '../data/bill_repository.dart';

final billRepositoryProvider = Provider<BillRepository>((ref) {
  return BillRepository(functions: ref.watch(functionsClientProvider));
});

/// Tagihan per jenis untuk rumah pengguna (rumah dari getMyHousehold).
final billsProvider = FutureProvider.autoDispose.family<List<Bill>, BillKind>((ref, kind) async {
  final household = await ref.watch(householdProvider.future);
  return ref.watch(billRepositoryProvider).listBills(kind, household.houseId);
});

final billDetailProvider = FutureProvider.autoDispose.family<Bill?, (BillKind, String)>((ref, args) async {
  final bills = await ref.watch(billsProvider(args.$1).future);
  for (final bill in bills) {
    if (bill.id == args.$2) return bill;
  }
  return null;
});

final paymentInstructionsProvider =
    FutureProvider.autoDispose.family<PaymentInstructions, (BillKind, String)>((ref, args) async {
  return ref.watch(billRepositoryProvider).getPaymentInstructions(args.$1, args.$2);
});

final internetSubscriptionProvider = FutureProvider.autoDispose<InternetSubscription?>((ref) async {
  final household = await ref.watch(householdProvider.future);
  return ref.watch(billRepositoryProvider).getInternetSubscription(household.houseId);
});

final internetPackagesProvider = FutureProvider.autoDispose<Map<String, InternetPackage>>((ref) {
  return ref.watch(billRepositoryProvider).getInternetPackages();
});
