import 'package:flutter/material.dart';
import '../../../core/theme/casa_tokens.dart';
import '../data/bill_models.dart';

class BillStatusChip extends StatelessWidget {
  const BillStatusChip({super.key, required this.status});

  final BillStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      BillStatus.paid => ('Lunas', CasaTokens.colorSemanticSuccess),
      BillStatus.pendingVerification => ('Menunggu verifikasi', CasaTokens.colorSemanticWarning),
      BillStatus.overdue => ('Terlambat', CasaTokens.colorSemanticError),
      BillStatus.unpaid => ('Belum bayar', CasaTokens.colorBrandNavy),
      BillStatus.cancelled => ('Dibatalkan', CasaTokens.colorSemanticDisabled),
      BillStatus.unknown => ('-', CasaTokens.colorSemanticDisabled),
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

class BillCard extends StatelessWidget {
  const BillCard({super.key, required this.bill, required this.kind, required this.onTap, this.title});

  final Bill bill;
  final BillKind kind;
  final VoidCallback onTap;
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(CasaTokens.radiusLg),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(CasaTokens.spacing4),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title ?? 'Periode ${bill.period}', style: Theme.of(context).textTheme.titleLarge),
                    SizedBox(height: CasaTokens.spacing1),
                    Text('${bill.period} · ${_money(bill.amount)}', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              BillStatusChip(status: bill.status),
            ],
          ),
        ),
      ),
    );
  }
}

class BillMessage extends StatelessWidget {
  const BillMessage({super.key, required this.text});

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

String _money(int amount) => 'Rp${amount.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => '.')}';
