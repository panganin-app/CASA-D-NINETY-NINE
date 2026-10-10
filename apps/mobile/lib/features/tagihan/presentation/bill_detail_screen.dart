import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/casa_tokens.dart';
import '../../../shared/format/format.dart';
import '../data/bill_models.dart';
import '../providers/bill_providers.dart';

/// Detail tagihan (IPL atau internet): instruksi BCA, pilih bukti, kirim.
class BillDetailScreen extends ConsumerStatefulWidget {
  const BillDetailScreen({super.key, required this.kind, required this.billId});

  final BillKind kind;
  final String billId;

  @override
  ConsumerState<BillDetailScreen> createState() => _BillDetailScreenState();
}

class _BillDetailScreenState extends ConsumerState<BillDetailScreen> {
  Uint8List? _proofBytes;
  bool _busy = false;
  String? _message;
  bool _messageIsError = false;

  // requestId dibuat sekali per sesi layar -- retry tidak membuat pembayaran dobel.
  final String _requestId = _newRequestId();

  static String _newRequestId() {
    final r = Random.secure();
    return List.generate(16, (_) => r.nextInt(16).toRadixString(16)).join();
  }

  Future<void> _pickProof() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 2400);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    setState(() {
      _proofBytes = bytes;
      _message = null;
    });
  }

  Future<void> _submit() async {
    final bytes = _proofBytes;
    if (bytes == null) {
      setState(() {
        _message = 'Pilih foto bukti transfer dulu.';
        _messageIsError = true;
      });
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final repo = ref.read(billRepositoryProvider);
      final proofId = await repo.uploadProof(kind: widget.kind, billId: widget.billId, imageBytes: bytes);
      await repo.submitPayment(kind: widget.kind, billId: widget.billId, proofId: proofId, requestId: _requestId);
      ref.invalidate(billsProvider(widget.kind));
      if (!mounted) return;
      setState(() {
        _proofBytes = null;
        _message = 'Bukti terkirim. Menunggu verifikasi pengurus.';
        _messageIsError = false;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _message = e.message;
        _messageIsError = true;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final key = (widget.kind, widget.billId);
    final billAsync = ref.watch(billDetailProvider(key));
    return Scaffold(
      appBar: AppBar(title: Text('Detail ${widget.kind.label}')),
      body: billAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Gagal memuat tagihan.', style: Theme.of(context).textTheme.bodyMedium)),
        data: (bill) {
          if (bill == null) {
            return Center(child: Text('Tagihan tidak ditemukan.', style: Theme.of(context).textTheme.bodyMedium));
          }
          return ListView(
            padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
            children: [
              Text(
                bill.packageId != null ? 'Internet ${bill.packageId!.replaceAll('INTERNET_', '')} Mbps' : 'Periode ${bill.period}',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              SizedBox(height: CasaTokens.spacing1),
              Text(formatRupiah(bill.amount), style: Theme.of(context).textTheme.titleLarge),
              SizedBox(height: CasaTokens.spacing1),
              Text(
                widget.kind == BillKind.ipl
                    ? 'Iuran Pengelolaan Lingkungan -- mencakup keamanan, kebersihan, dan lingkungan.'
                    : 'Pembayaran paket internet. Masa aktif diperpanjang setelah pembayaran disetujui.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              SizedBox(height: CasaTokens.spacing6),
              if (bill.canPay) ...[
                _InstructionsCard(kind: widget.kind, billId: bill.id),
                SizedBox(height: CasaTokens.spacing4),
                _ProofSection(proofBytes: _proofBytes, onPick: _pickProof),
                SizedBox(height: CasaTokens.spacing4),
                if (_message != null) _Banner(text: _message!, isError: _messageIsError),
                SizedBox(height: CasaTokens.spacing3),
                ElevatedButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Kirim Bukti Transfer'),
                ),
              ] else
                _Banner(text: _statusText(bill.status), isError: false),
            ],
          );
        },
      ),
    );
  }

  String _statusText(BillStatus status) {
    switch (status) {
      case BillStatus.paid:
        return 'Tagihan ini sudah lunas. Terima kasih.';
      case BillStatus.pendingVerification:
        return 'Bukti Anda sedang diverifikasi pengurus.';
      default:
        return 'Tagihan tidak dapat dibayar saat ini.';
    }
  }
}

class _InstructionsCard extends ConsumerWidget {
  const _InstructionsCard({required this.kind, required this.billId});

  final BillKind kind;
  final String billId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final instructions = ref.watch(paymentInstructionsProvider((kind, billId)));
    return Card(
      child: Padding(
        padding: EdgeInsets.all(CasaTokens.spacing4),
        child: instructions.when(
          loading: () => const LinearProgressIndicator(),
          error: (e, _) => Text(
            e is AppException ? e.message : 'Gagal memuat rekening tujuan.',
            style: TextStyle(color: CasaTokens.colorSemanticError),
          ),
          data: (info) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Transfer ke rekening BCA', style: Theme.of(context).textTheme.titleLarge),
              SizedBox(height: CasaTokens.spacing3),
              _InfoRow(label: 'Bank', value: info.bank),
              _InfoRow(label: 'No. Rekening', value: info.accountNumber, copyable: true),
              _InfoRow(label: 'Atas nama', value: info.accountHolder),
              _InfoRow(label: 'Nominal', value: formatRupiah(info.amount)),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, this.copyable = false});

  final String label;
  final String value;
  final bool copyable;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: CasaTokens.spacing1),
      child: Row(
        children: [
          Expanded(child: Text(label, style: Theme.of(context).textTheme.bodySmall)),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
          if (copyable)
            IconButton(
              icon: const Icon(Icons.copy_rounded, size: 18),
              tooltip: 'Salin',
              onPressed: () {
                Clipboard.setData(ClipboardData(text: value));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nomor rekening disalin')));
              },
            ),
        ],
      ),
    );
  }
}

class _ProofSection extends StatelessWidget {
  const _ProofSection({required this.proofBytes, required this.onPick});

  final Uint8List? proofBytes;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Bukti transfer', style: Theme.of(context).textTheme.titleLarge),
        SizedBox(height: CasaTokens.spacing2),
        if (proofBytes != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
            child: Image.memory(proofBytes!, height: 180, fit: BoxFit.cover),
          ),
        SizedBox(height: CasaTokens.spacing2),
        OutlinedButton.icon(
          onPressed: onPick,
          icon: const Icon(Icons.photo_library_rounded),
          label: Text(proofBytes == null ? 'Pilih foto bukti' : 'Ganti foto bukti'),
        ),
      ],
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({required this.text, required this.isError});

  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? CasaTokens.colorSemanticError : CasaTokens.colorSemanticSuccess;
    return Container(
      padding: EdgeInsets.all(CasaTokens.spacing3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
      ),
      child: Text(text, style: TextStyle(color: color)),
    );
  }
}
