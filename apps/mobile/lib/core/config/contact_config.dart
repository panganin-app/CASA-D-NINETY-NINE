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
    label: 'Ketua Pengurus (Eki)',
    description: 'Pertanyaan umum, kebijakan komplek, dan keputusan pengurus.',
    phone: '6287780009065',
    whatsapp: '6287780009065',
  ),
  ContactItem(
    label: 'Bendahara (Dimas)',
    description: 'Pertanyaan pembayaran IPL dan internet, serta verifikasi bukti transfer.',
    phone: '6285781719262',
    whatsapp: '6285781719262',
  ),
  ContactItem(
    label: 'Keamanan (Lutfi)',
    description: 'Laporan gangguan keamanan. Untuk keadaan darurat, hubungi 110 atau 112.',
    phone: '6281288989786',
    whatsapp: '6281288989786',
  ),
];
