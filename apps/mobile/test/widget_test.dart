// Smoke test LoginScreen -- SENGAJA gak pumpWidget(CasaResidentApp) utuh,
// karena main.dart butuh Firebase.initializeApp() beneran (gak ada di
// widget test). LoginScreen sendiri aman dites berdiri sendiri: dia cuma
// nyentuh FirebaseAuth.instance pas tombol submit ditekan (lihat
// _LoginScreenState._submit), bukan pas build.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/features/auth/presentation/login_screen.dart';

void main() {
  testWidgets('LoginScreen menampilkan form email/kata sandi dan memvalidasi input kosong', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Kata Sandi'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Masuk'), findsOneWidget);

    await tester.tap(find.widgetWithText(ElevatedButton, 'Masuk'));
    await tester.pump();

    expect(find.text('Email tidak valid'), findsOneWidget);
    expect(find.text('Kata sandi wajib diisi'), findsOneWidget);
  });
}
