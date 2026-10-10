import 'package:flutter/material.dart';
import '../../core/theme/casa_tokens.dart';

/// Placeholder JUJUR -- bukan UI final. Dipakai halaman yang route-nya
/// sudah ada di router (biar app bisa dinavigasi end-to-end) tapi
/// layarnya sendiri belum dibangun (lihat IMPLEMENTATION_PROGRESS.md
/// buat status per fitur).
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.construction_rounded, size: 48, color: CasaTokens.colorTextSecondary),
              SizedBox(height: CasaTokens.spacing3),
              Text('Halaman $title sedang dibangun', style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}
