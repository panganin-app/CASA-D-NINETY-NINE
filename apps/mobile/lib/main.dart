import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/network/firebase_emulator.dart';
import 'core/theme/app_theme.dart';
import 'firebase_options.dart';
import 'routing/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // SELALU emulator di pass ini -- belum ada project Firebase production
  // (lihat firebase_options.dart). Ganti jadi kondisional begitu project
  // production sudah dibuat & flutterfire configure dijalankan ulang.
  connectToFirebaseEmulators();
  runApp(const ProviderScope(child: CasaResidentApp()));
}

class CasaResidentApp extends ConsumerWidget {
  const CasaResidentApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    return MaterialApp.router(
      title: "Casa D'Ninety Nine",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
