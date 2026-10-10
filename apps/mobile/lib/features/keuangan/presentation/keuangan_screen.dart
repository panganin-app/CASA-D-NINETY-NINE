import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/casa_tokens.dart';
import '../../home/providers/home_providers.dart';
import '../../../shared/format/format.dart';
import '../data/keuangan_models.dart';
import '../data/keuangan_repository.dart';

final keuanganRepositoryProvider = Provider<KeuanganRepository>((ref) {
  return KeuanganRepository(functions: ref.watch(functionsClientProvider));
});

final publishedPeriodsProvider = FutureProvider.autoDispose<List<PublishedPeriod>>((ref) {
  return ref.watch(keuanganRepositoryProvider).listPeriods();
});

/// Transparansi keuangan: pilih periode yang sudah dipublikasikan, lihat
/// ringkasan dan daftar transaksinya. Hanya data published (lihat rules &
/// backend), dan client tidak menghitung ulang angka dari transaksi.
class KeuanganScreen extends ConsumerStatefulWidget {
  const KeuanganScreen({super.key});

  @override
  ConsumerState<KeuanganScreen> createState() => _KeuanganScreenState();
}

class _KeuanganScreenState extends ConsumerState<KeuanganScreen> {
  String? _selectedPeriodId;

  @override
  Widget build(BuildContext context) {
    final periods = ref.watch(publishedPeriodsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Transparansi Keuangan')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(publishedPeriodsProvider),
        child: periods.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _Message(
            text: e is AppException ? e.message : 'Gagal memuat data keuangan. Tarik untuk coba lagi.',
          ),
          data: (items) {
            if (items.isEmpty) return const _Message(text: 'Belum ada laporan keuangan yang dipublikasikan.');
            final selected = items.firstWhere(
              (p) => p.periodId == _selectedPeriodId,
              orElse: () => items.first,
            );
            return ListView(
              padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
              children: [
                _PeriodPicker(
                  periods: items,
                  selected: selected.periodId,
                  onChanged: (id) => setState(() => _selectedPeriodId = id),
                ),
                SizedBox(height: CasaTokens.spacing4),
                _SummaryCards(period: selected),
                SizedBox(height: CasaTokens.spacing6),
                Text('Transaksi', style: Theme.of(context).textTheme.titleLarge),
                SizedBox(height: CasaTokens.spacing2),
                if (selected.transactions.isEmpty)
                  Text('Tidak ada transaksi di periode ini.', style: Theme.of(context).textTheme.bodyMedium)
                else
                  ...selected.transactions.map((t) => _TransactionTile(tx: t)),
                SizedBox(height: CasaTokens.spacing4),
                Text(
                  'Hanya data yang telah dipublikasikan pengurus yang ditampilkan.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _PeriodPicker extends StatelessWidget {
  const _PeriodPicker({required this.periods, required this.selected, required this.onChanged});

  final List<PublishedPeriod> periods;
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: selected,
      decoration: const InputDecoration(labelText: 'Periode', filled: true),
      items: [
        for (final p in periods) DropdownMenuItem(value: p.periodId, child: Text(p.periodId)),
      ],
      onChanged: (v) {
        if (v != null) onChanged(v);
      },
    );
  }
}

class _SummaryCards extends StatelessWidget {
  const _SummaryCards({required this.period});

  final PublishedPeriod period;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _StatCard(label: 'Pemasukan', value: formatRupiah(period.totalIncome), color: CasaTokens.colorSemanticSuccess),
        SizedBox(height: CasaTokens.spacing2),
        _StatCard(label: 'Pengeluaran', value: formatRupiah(period.totalExpense), color: CasaTokens.colorSemanticError),
        SizedBox(height: CasaTokens.spacing2),
        _StatCard(
          label: 'Selisih',
          value: formatRupiah(period.net),
          color: period.net >= 0 ? CasaTokens.colorBrandNavy : CasaTokens.colorSemanticError,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(CasaTokens.spacing4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
            Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color)),
          ],
        ),
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.tx});

  final PublishedTransaction tx;

  @override
  Widget build(BuildContext context) {
    final sign = tx.isIncome ? '+' : '-';
    final color = tx.isIncome ? CasaTokens.colorSemanticSuccess : CasaTokens.colorSemanticError;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: CasaTokens.spacing2),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.description, style: Theme.of(context).textTheme.bodyMedium),
                Text(tx.category, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Text('$sign ${formatRupiah(tx.amount)}', style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
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
