import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/casa_tokens.dart';
import '../data/bill_models.dart';
import '../providers/bill_providers.dart';
import 'bill_widgets.dart';

class IplListScreen extends ConsumerWidget {
  const IplListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bills = ref.watch(billsProvider(BillKind.ipl));
    return Scaffold(
      appBar: AppBar(title: const Text('IPL')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(billsProvider(BillKind.ipl)),
        child: bills.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => const BillMessage(text: 'Gagal memuat tagihan IPL. Tarik untuk coba lagi.'),
          data: (items) {
            if (items.isEmpty) return const BillMessage(text: 'Belum ada tagihan IPL.');
            return ListView.separated(
              padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
              itemCount: items.length,
              separatorBuilder: (_, _) => SizedBox(height: CasaTokens.spacing3),
              itemBuilder: (context, i) => BillCard(
                bill: items[i],
                kind: BillKind.ipl,
                onTap: () => context.push('/tagihan/ipl/${items[i].id}'),
              ),
            );
          },
        ),
      ),
    );
  }
}
