// PLACEHOLDER -- project Firebase production BELUM ada (lihat
// AMBIGUITY: Firebase project ID staging/production belum ditentukan,
// docs/IMPLEMENTATION_PROGRESS.md). Nilai di sini CUMA buat konek ke
// Emulator Suite lokal (projectId "demo-casa-local" -- SAMA PERSIS yang
// dipakai scripts/seed-local.mjs & `npm run emulators` di root repo).
// Firebase SDK TIDAK memvalidasi apiKey/appId asli selama semua service
// di-redirect ke emulator (lihat core/network/firebase_emulator.dart) --
// JANGAN pernah pakai file ini buat build production sungguhan, ganti
// total pakai `flutterfire configure` begitu project Firebase production
// sudah dibuat.
import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  DefaultFirebaseOptions._();

  static const FirebaseOptions currentPlatform = FirebaseOptions(
    // Firebase SDK (khususnya FirebaseInstallations di iOS) VALIDASI
    // FORMAT apiKey di sisi client SEBELUM sempat di-redirect ke
    // emulator (connectToFirebaseEmulators() baru jalan setelah
    // Firebase.initializeApp()) -- harus 39 karakter & mulai 'A', kalau
    // enggak app CRASH langsung saat start (ketauan 10 Okt 2026 pas tes
    // di iOS Simulator beneran). Isinya tetap gak valid/gak pernah
    // nyentuh Firebase Installations API asli (service itu TIDAK
    // dipanggil app ini), cuma format-nya doang yang harus lolos.
    apiKey: 'AIzaSyDemoLocalEmulatorOnlyNotARealKey1',
    appId: '1:000000000000:ios:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'demo-casa-local',
    storageBucket: 'demo-casa-local.appspot.com',
    iosBundleId: 'com.casadninetynine.casaResident',
  );
}
