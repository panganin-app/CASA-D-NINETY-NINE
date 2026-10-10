import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/casa_tokens.dart';

// Keputusan Product Owner 10 Okt 2026 -- hand-off ke Hik-Connect, BUKAN
// integrasi API resmi Hikvision (butuh daftar developer di tpp.hikvision.com
// + approval AK/SK, ditunda). Casa TIDAK punya cctv_channels/cctv_permissions
// sendiri -- sharing kamera per warga dikelola PENGURUS LANGSUNG di app
// Hik-Connect (fitur "Manage Sharing Settings" bawaan), DI LUAR sistem Casa.
// Trade-off yang SENGAJA diterima: audit akses CCTV gak tercatat di
// audit_logs Casa, dan revoke akses CCTV TIDAK otomatis ikut transferHouse/
// setResidentActive -- pengurus harus cabut share di Hik-Connect manual
// kalau ada warga pindah/nonaktif.
//
// Store link iOS pakai App Store ID asli Hik-Connect (1087803190,
// terverifikasi ada). Android pakai LINK PENCARIAN Play Store (bukan tebak
// package ID) -- lebih aman daripada nebak ID yang bisa salah/ganti.
const _iosStoreUrl = 'https://apps.apple.com/app/id1087803190';
const _androidStoreUrl = 'https://play.google.com/store/search?q=Hik-Connect&c=apps';

class CctvScreen extends StatelessWidget {
  const CctvScreen({super.key});

  Future<void> _openStore(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal membuka toko aplikasi.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('CCTV')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.videocam_rounded, size: 48, color: CasaTokens.colorBrandNavy),
            SizedBox(height: CasaTokens.spacing4),
            Text('Lihat CCTV lewat Hik-Connect', style: Theme.of(context).textTheme.titleLarge),
            SizedBox(height: CasaTokens.spacing2),
            Text(
              'CCTV komplek bisa dilihat lewat aplikasi Hik-Connect (resmi dari '
              'Hikvision). Ikuti langkah berikut:',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            SizedBox(height: CasaTokens.spacing4),
            _Step(number: 1, text: 'Install aplikasi Hik-Connect dari App Store/Play Store.'),
            _Step(number: 2, text: 'Buat akun Hik-Connect (pakai email Anda).'),
            _Step(
              number: 3,
              text: 'Hubungi pengurus untuk dibagikan akses kamera ke email Hik-Connect Anda.',
            ),
            _Step(number: 4, text: 'Terima undangan berbagi di aplikasi Hik-Connect, lalu kamera siap dilihat.'),
            SizedBox(height: CasaTokens.spacing6),
            ElevatedButton.icon(
              onPressed: () => _openStore(
                context,
                Theme.of(context).platform == TargetPlatform.iOS ? _iosStoreUrl : _androidStoreUrl,
              ),
              icon: const Icon(Icons.open_in_new_rounded),
              label: const Text('Install / Buka Hik-Connect'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: CasaTokens.spacing3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: CasaTokens.colorBrandNavy, shape: BoxShape.circle),
            child: Text(
              '$number',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(fontSize: CasaTokens.fontSizeSm),
            ),
          ),
          SizedBox(width: CasaTokens.spacing3),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
