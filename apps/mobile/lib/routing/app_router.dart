import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/providers/auth_providers.dart';
import '../features/cctv/presentation/cctv_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/ipl/presentation/ipl_detail_screen.dart';
import '../features/informasi/presentation/informasi_screens.dart';
import '../features/ipl/presentation/ipl_list_screen.dart';
import '../features/reports/presentation/reports_screens.dart';
import '../shared/widgets/coming_soon_screen.dart';

/// Protected routing (PRD §9.4) -- redirect berbasis status login.
/// SEMUA route (kecuali /login) butuh user ter-autentikasi. Role/permission
/// check per-fitur (mis. hanya kepala keluarga boleh edit anggota keluarga)
/// TETAP ditegakkan backend (Firestore rules + Cloud Functions) -- redirect
/// di sini CUMA soal UX (jangan nampilin layar kosong), BUKAN lapisan
/// keamanan (lihat PRD §9.1: frontend gak boleh pegang business logic
/// sensitif).
final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: _AuthRefreshNotifier(ref),
    redirect: (context, state) {
      final isLoggedIn = authState.value != null;
      final isLoggingIn = state.matchedLocation == '/login';
      if (!isLoggedIn && !isLoggingIn) return '/login';
      if (isLoggedIn && isLoggingIn) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/ipl', builder: (context, state) => const IplListScreen()),
      GoRoute(
        path: '/ipl/:id',
        builder: (context, state) => IplDetailScreen(billId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/cctv', builder: (context, state) => const CctvScreen()),
      GoRoute(path: '/informasi', builder: (context, state) => const InformasiScreen()),
      GoRoute(path: '/reports', builder: (context, state) => const ReportHistoryScreen()),
      GoRoute(path: '/reports/new', builder: (context, state) => const ReportCreateScreen()),
      GoRoute(path: '/profile', builder: (context, state) => const ComingSoonScreen(title: 'Profil')),
    ],
  );
});

/// Jembatan StreamProvider (Riverpod) -> Listenable (GoRouter butuh
/// Listenable buat tau kapan harus re-evaluate redirect).
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(Ref ref) {
    ref.listen(authStateProvider, (_, _) => notifyListeners());
  }
}
