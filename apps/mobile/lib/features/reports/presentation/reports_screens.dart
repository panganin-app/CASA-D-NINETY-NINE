import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/casa_tokens.dart';
import '../../home/providers/home_providers.dart';
import '../data/report_models.dart';
import '../data/report_repository.dart';

final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  return ReportRepository(functions: ref.watch(functionsClientProvider));
});

final myReportsProvider = FutureProvider.autoDispose<List<ResidentReport>>((ref) {
  return ref.watch(reportRepositoryProvider).listMyReports();
});

/// Riwayat laporan + tombol kirim laporan baru.
class ReportHistoryScreen extends ConsumerWidget {
  const ReportHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reports = ref.watch(myReportsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Laporan Saya')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final sent = await context.push<bool>('/reports/new');
          if (sent == true) ref.invalidate(myReportsProvider);
        },
        icon: const Icon(Icons.add_rounded),
        label: const Text('Buat Laporan'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myReportsProvider),
        child: reports.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _Empty(text: 'Gagal memuat laporan. Tarik untuk coba lagi.'),
          data: (items) {
            if (items.isEmpty) return _Empty(text: 'Belum ada laporan. Tekan "Buat Laporan" untuk mengirim.');
            return ListView.separated(
              padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
              itemCount: items.length,
              separatorBuilder: (_, _) => SizedBox(height: CasaTokens.spacing3),
              itemBuilder: (context, i) => _ReportCard(report: items[i]),
            );
          },
        ),
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.report});

  final ResidentReport report;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(CasaTokens.spacing4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(report.title, style: Theme.of(context).textTheme.titleLarge)),
                _StatusChip(status: report.status),
              ],
            ),
            SizedBox(height: CasaTokens.spacing1),
            Text(report.categoryLabel, style: Theme.of(context).textTheme.bodySmall),
            SizedBox(height: CasaTokens.spacing2),
            Text(report.description, maxLines: 3, overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final ReportStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      ReportStatus.submitted => ('Terkirim', CasaTokens.colorBrandNavy),
      ReportStatus.inReview => ('Ditinjau', CasaTokens.colorSemanticWarning),
      ReportStatus.inProgress => ('Diproses', CasaTokens.colorSemanticWarning),
      ReportStatus.resolved => ('Selesai', CasaTokens.colorSemanticSuccess),
      ReportStatus.rejected => ('Ditolak', CasaTokens.colorSemanticError),
      ReportStatus.closed => ('Ditutup', CasaTokens.colorSemanticDisabled),
      ReportStatus.unknown => ('-', CasaTokens.colorSemanticDisabled),
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

class _Empty extends StatelessWidget {
  const _Empty({required this.text});

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

/// Form kirim laporan baru. Mengembalikan `true` ke layar sebelumnya kalau berhasil.
class ReportCreateScreen extends ConsumerStatefulWidget {
  const ReportCreateScreen({super.key});

  @override
  ConsumerState<ReportCreateScreen> createState() => _ReportCreateScreenState();
}

class _ReportCreateScreenState extends ConsumerState<ReportCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  ReportCategory _category = ReportCategory.facilities;
  bool _busy = false;
  String? _error;

  // Dibuat sekali per sesi form -- retry jaringan dengan requestId sama
  // tidak membuat laporan ganda.
  final String _requestId = _newRequestId();

  static String _newRequestId() {
    final r = Random.secure();
    return List.generate(16, (_) => r.nextInt(16).toRadixString(16)).join();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(reportRepositoryProvider).createReport(
            requestId: _requestId,
            category: _category,
            title: _titleController.text.trim(),
            description: _descController.text.trim(),
          );
      if (!mounted) return;
      context.pop(true);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buat Laporan')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                Container(
                  padding: EdgeInsets.all(CasaTokens.spacing3),
                  decoration: BoxDecoration(
                    color: CasaTokens.colorSemanticError.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
                  ),
                  child: Text(_error!, style: TextStyle(color: CasaTokens.colorSemanticError)),
                ),
                SizedBox(height: CasaTokens.spacing3),
              ],
              DropdownButtonFormField<ReportCategory>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Kategori', filled: true),
                items: [
                  for (final c in ReportCategory.values) DropdownMenuItem(value: c, child: Text(c.label)),
                ],
                onChanged: (v) => setState(() => _category = v ?? _category),
              ),
              SizedBox(height: CasaTokens.spacing3),
              TextFormField(
                controller: _titleController,
                maxLength: 120,
                decoration: const InputDecoration(labelText: 'Judul', filled: true),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Judul wajib diisi' : null,
              ),
              SizedBox(height: CasaTokens.spacing3),
              TextFormField(
                controller: _descController,
                maxLines: 5,
                maxLength: 2000,
                decoration: const InputDecoration(labelText: 'Deskripsi', alignLabelWithHint: true, filled: true),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Deskripsi wajib diisi' : null,
              ),
              SizedBox(height: CasaTokens.spacing4),
              ElevatedButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Kirim Laporan'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
