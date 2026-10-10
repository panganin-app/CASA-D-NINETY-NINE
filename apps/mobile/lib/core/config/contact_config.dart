/// Kontak resmi pengurus. Nilai ini WAJIB diisi pengurus sebelum rilis --
/// selama masih null, layar "Hubungi Pengurus" menampilkan "belum tersedia"
/// dan TIDAK menampilkan nomor palsu.
class ContactItem {
  const ContactItem({required this.label, required this.description, this.phone, this.whatsapp, this.email});

  final String label;
  final String description;
  final String? phone; // format internasional tanpa +, mis. 6281234567890
  final String? whatsapp; // format internasional tanpa +
  final String? email;
}

const List<ContactItem> pengurusContacts = [
  ContactItem(
    label: 'Ketua Pengurus',
    description: 'Pertanyaan umum, kebijakan komplek, dan keputusan pengurus.',
    // TODO(pengurus): isi nomor ketua pengurus.
  ),
  ContactItem(
    label: 'Keuangan / Bendahara',
    description: 'Pertanyaan pembayaran IPL dan internet, serta verifikasi bukti transfer.',
    // TODO(pengurus): isi nomor bendahara.
  ),
  ContactItem(
    label: 'Keamanan',
    description: 'Laporan gangguan keamanan darurat. Untuk keadaan darurat, hubungi 110 atau 112.',
    // TODO(pengurus): isi nomor pos keamanan.
  ),
];
