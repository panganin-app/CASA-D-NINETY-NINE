/// Format rupiah dengan titik ribuan, mis. 100000 -> "Rp100.000".
String formatRupiah(int amount) {
  final s = amount.abs().toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
    buf.write(s[i]);
  }
  return '${amount < 0 ? '-' : ''}Rp$buf';
}
