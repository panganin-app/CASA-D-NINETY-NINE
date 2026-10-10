import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/casa_tokens.dart';
import '../../../shared/format/format.dart';
import '../../home/providers/home_providers.dart';
import '../data/bill_models.dart';
import '../providers/bill_providers.dart';
import 'bill_widgets.dart';

const _statusLabel = {
  'ACTIVE': 'Aktif',
  'EXPIRING_SOON': 'Hampir habis',
  'EXPIRED': 'Sudah habis',
  'PENDING_ACTIVATION': 'Menunggu aktivasi',
  'SUSPENDED': 'Ditangguhkan',
  'TERMINATED': 'Dihentikan',
};

String _period(DateTime nowUtc) {
  // Periode kalender WIB (UTC+7).
  final wib = nowUtc.add(const Duration(hours: 7));
  return '${wib.year}-${wib.month.toString().padLeft(2, '0')}';
}

class InternetScreen extends ConsumerWidget {
  const InternetScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final household = ref.watch(householdProvider);
    final sub = ref.watch(internetSubscriptionProvider);
    final bills = ref.watch(billsProvider(BillKind.internet));
    final isHead = household.value?.isHead ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Internet')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(internetSubscriptionProvider);
          ref.invalidate(billsProvider(BillKind.internet));
        },
        child: ListView(
          padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
          children: [
            sub.when(
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => const Text('Gagal memuat status internet.'),
              data: (s) => _SubscriptionCard(sub: s),
            ),
            SizedBox(height: CasaTokens.spacing4),
            if (isHead) const _NewBillCard() else
              Padding(
                padding: EdgeInsets.only(bottom: CasaTokens.spacing4),
                child: Text(
                  'Hanya kepala keluarga yang dapat membuat tagihan internet.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            Text('Tagihan internet', style: Theme.of(context).textTheme.titleLarge),
            SizedBox(height: CasaTokens.spacing2),
            bills.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => const Text('Gagal memuat tagihan internet.'),
              data: (items) => items.isEmpty
                  ? Text('Belum ada tagihan internet.', style: Theme.of(context).textTheme.bodyMedium)
                  : Column(
                      children: [
                        for (final b in items) ...[
                          BillCard(
                            bill: b,
                            kind: BillKind.internet,
                            title: 'Paket ${b.packageId?.replaceAll('INTERNET_', '') ?? ''} Mbps · ${b.period}',
                            onTap: () => context.push('/tagihan/internet/${b.id}'),
                          ),
                          SizedBox(height: CasaTokens.spacing3),
                        ],
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SubscriptionCard extends StatelessWidget {
  const _SubscriptionCard({required this.sub});

  final InternetSubscription? sub;

  @override
  Widget build(BuildContext context) {
    final s = sub;
    return Card(
      child: Padding(
        padding: EdgeInsets.all(CasaTokens.spacing4),
        child: s == null
            ? Text('Belum ada langganan internet.', style: Theme.of(context).textTheme.bodyMedium)
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Status: ${_statusLabel[s.status] ?? s.status}', style: Theme.of(context).textTheme.titleLarge),
                  SizedBox(height: CasaTokens.spacing1),
                  if (s.packageId != null) Text('Paket ${s.packageId!.replaceAll('INTERNET_', '')} Mbps', style: Theme.of(context).textTheme.bodyMedium),
                  if (s.activeUntil != null)
                    Text(
                      'Masa aktif sampai ${s.activeUntil!.toLocal().day}/${s.activeUntil!.toLocal().month}/${s.activeUntil!.toLocal().year}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
      ),
    );
  }
}

/// Pilih paket lalu buat tagihan. Harga dari backend (getBillingCatalog), bukan dari client.
class _NewBillCard extends ConsumerStatefulWidget {
  const _NewBillCard();

  @override
  ConsumerState<_NewBillCard> createState() => _NewBillCardState();
}

class _NewBillCardState extends ConsumerState<_NewBillCard> {
  String? _packageId;
  bool _busy = false;
  String? _error;
  final String _requestId = _newRequestId();

  static String _newRequestId() {
    final r = Random.secure();
    return List.generate(16, (_) => r.nextInt(16).toRadixString(16)).join();
  }

  Future<void> _create() async {
    final pkg = _packageId;
    final household = ref.read(householdProvider).value;
    if (pkg == null || household == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final billId = await ref.read(billRepositoryProvider).createInternetBill(
            houseId: household.houseId,
            period: _period(DateTime.now().toUtc()),
            packageId: pkg,
            requestId: _requestId,
          );
      ref.invalidate(billsProvider(BillKind.internet));
      if (!mounted) return;
      context.push('/tagihan/internet/$billId');
    } on AppException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final packages = ref.watch(internetPackagesProvider);
    return Card(
      child: Padding(
        padding: EdgeInsets.all(CasaTokens.spacing4),
        child: packages.when(
          loading: () => const LinearProgressIndicator(),
          error: (e, _) => const Text('Gagal memuat paket.'),
          data: (map) {
            final list = map.values.toList()..sort((a, b) => a.speedMbps.compareTo(b.speedMbps));
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Buat tagihan internet', style: Theme.of(context).textTheme.titleLarge),
                SizedBox(height: CasaTokens.spacing3),
                RadioGroup<String>(
                  groupValue: _packageId,
                  onChanged: (v) {
                    if (!_busy) setState(() => _packageId = v);
                  },
                  child: Column(
                    children: [
                      for (final p in list)
                        RadioListTile<String>(
                          contentPadding: EdgeInsets.zero,
                          value: p.id,
                          title: Text(p.label),
                          subtitle: Text(formatRupiah(p.amount)),
                        ),
                    ],
                  ),
                ),
                if (_error != null) ...[
                  SizedBox(height: CasaTokens.spacing2),
                  Text(_error!, style: TextStyle(color: CasaTokens.colorSemanticError)),
                ],
                SizedBox(height: CasaTokens.spacing3),
                ElevatedButton(
                  onPressed: _busy || _packageId == null ? null : _create,
                  child: _busy ? const Text('Membuat tagihan...') : const Text('Buat tagihan'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
