import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/cctv/presentation/cctv_screen.dart';

void main() {
  testWidgets('CctvScreen menampilkan 4 langkah dan tombol buka Hik-Connect', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: CctvScreen()));

    expect(find.text('Lihat CCTV lewat Hik-Connect'), findsOneWidget);
    expect(find.textContaining('Install aplikasi Hik-Connect'), findsOneWidget);
    expect(find.textContaining('Hubungi pengurus'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Install / Buka Hik-Connect'), findsOneWidget);
  });
}
