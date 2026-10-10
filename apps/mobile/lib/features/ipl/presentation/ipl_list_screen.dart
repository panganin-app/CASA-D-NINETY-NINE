import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/casa_tokens.dart';
import '../data/ipl_models.dart';
import '../providers/ipl_providers.dart';

class IplListScreen extends ConsumerWidget {
  const IplListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bills = ref.watch(iplBillsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('IPL')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(iplBillsProvider),
        child: bills.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _Message(text: 'Gagal memuat tagihan IPL. Tarik untuk coba lagi.'),
          data: (items) {
            if (items.isEmpty) return const _Message(text: 'Belum ada tagihan IPL.');
            return ListView.separated(
              padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
              itemCount: items.length,
              separatorBuilder: (_, _) => SizedBox(height: CasaTokens.spacing3),
              itemBuilder: (context, i) => _BillCard(bill: items[i]),
            );
          },
        ),
      ),
    );
  }
}

class _BillCard extends StatelessWidget {
  const _BillCard({required this.bill});

  final IplBill bill;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(CasaTokens.radiusLg),
        onTap: () => context.push('/ipl/${bill.id}'),
        child: Padding(
          padding: EdgeInsets.all(CasaTokens.spacing4),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Periode ${bill.period}', style: Theme.of(context).textTheme.titleLarge),
                    SizedBox(height: CasaTokens.spacing1),
                    Text(formatRupiah(bill.amount), style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              _StatusChip(status: bill.status),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final IplBillStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      IplBillStatus.paid => ('Lunas', CasaTokens.colorSemanticSuccess),
      IplBillStatus.pendingVerification => ('Menunggu verifikasi', CasaTokens.colorSemanticWarning),
      IplBillStatus.overdue => ('Terlambat', CasaTokens.colorSemanticError),
      IplBillStatus.unpaid => ('Belum bayar', CasaTokens.colorBrandNavy),
      IplBillStatus.cancelled => ('Dibatalkan', CasaTokens.colorSemanticDisabled),
      IplBillStatus.unknown => ('-', CasaTokens.colorSemanticDisabled),
    };
    return Container(
      padding: EdgeInsets.symmetric(horizontal: CasaTokens.spacing3, vertical: CasaTokens.spacing1),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(CasaTokens.radiusPill),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: CasaTokens.fontSizeSm)),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        Padding(
          padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding * 2),
          child: Text(text, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
        ),
      ],
    );
  }
}

/// Format rupiah sederhana tanpa dependensi tambahan.
String formatRupiah(int amount) {
  final s = amount.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
    buf.write(s[i]);
  }
  return 'Rp$buf';
}
