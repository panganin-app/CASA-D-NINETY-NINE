import 'package:flutter/material.dart';
import '../../../core/theme/casa_tokens.dart';

/// Kebijakan privasi. DRAFT -- wajib ditinjau pengurus/penasihat hukum
/// sebelum dipublikasikan ke toko aplikasi. Isinya merangkum data yang
/// benar-benar dikumpulkan aplikasi ini (lihat backend/functions), bukan
/// klaim tambahan yang belum diverifikasi.
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const _sections = <(String, String)>[
    (
      'Data yang kami kumpulkan',
      'Nama lengkap, nomor telepon, email, nomor rumah, status hunian, data anggota keluarga '
          'yang Anda masukkan, data kendaraan (plat, jenis, merek, warna) beserta foto kendaraan, bukti transfer pembayaran IPL/internet, '
          'serta isi laporan yang Anda kirim.',
    ),
    (
      'Untuk apa data digunakan',
      'Mengelola tagihan IPL dan internet, memverifikasi pembayaran, menerima dan menindaklanjuti laporan warga, '
          'menampilkan pengumuman dan transparansi keuangan, serta menghubungi Anda terkait layanan komplek.',
    ),
    (
      'Siapa yang dapat melihat data Anda',
      'Hanya Anda, dan pengurus komplek yang berwenang (Ketua/Bendahara/Keamanan) sesuai kebutuhan tugasnya. '
          'Warga lain tidak dapat melihat data pribadi Anda. Bukti transfer hanya dapat dilihat Anda dan pengurus yang memverifikasi.',
    ),
    (
      'Kamera CCTV',
      'Aplikasi ini hanya mengarahkan Anda ke aplikasi Hik-Connect. Rekaman dan akses kamera dikelola oleh pengurus '
          'dan layanan Hikvision di luar aplikasi ini, mengikuti kebijakan privasi Hikvision.',
    ),
    (
      'Penyimpanan dan penghapusan akun',
      'Data disimpan selama Anda menjadi warga komplek. Anda dapat meminta hapus akun dari menu Profil. '
          'Akun langsung dikunci, dan data pribadi (nama, telepon, email, data keluarga dan kendaraan) dihapus '
          'otomatis setelah 14 hari. Selama 14 hari, pengurus dapat memulihkan akun atas permintaan Anda. '
          'Riwayat pembayaran dan laporan tetap disimpan sebagai catatan rumah.',
    ),
    (
      'Hak Anda',
      'Anda dapat meminta data Anda diperbarui melalui menu Profil, atau menghubungi pengurus untuk permintaan lain, '
          'termasuk penghapusan data sesuai ketentuan yang berlaku.',
    ),
    (
      'Kontak',
      'Pertanyaan tentang privasi dapat disampaikan lewat menu Hubungi Pengurus. [DRAFT: alamat email khusus privasi belum ditetapkan.]',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kebijakan Privasi')),
      body: ListView(
        padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
        children: [
          Container(
            padding: EdgeInsets.all(CasaTokens.spacing3),
            decoration: BoxDecoration(
              color: CasaTokens.colorSemanticWarning.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
            ),
            child: Text(
              'DRAFT -- belum ditinjau. Jangan dipublikasikan ke toko aplikasi sebelum ditinjau.',
              style: TextStyle(color: CasaTokens.colorSemanticWarning),
            ),
          ),
          SizedBox(height: CasaTokens.spacing4),
          for (final (title, body) in _sections) ...[
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            SizedBox(height: CasaTokens.spacing1),
            Text(body, style: Theme.of(context).textTheme.bodyMedium),
            SizedBox(height: CasaTokens.spacing4),
          ],
        ],
      ),
    );
  }
}
