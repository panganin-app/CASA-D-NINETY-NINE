import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/providers/auth_providers.dart';
import '../features/cctv/presentation/cctv_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/tagihan/data/bill_models.dart';
import '../features/tagihan/presentation/bill_detail_screen.dart';
import '../features/tagihan/presentation/internet_screen.dart';
import '../features/informasi/data/informasi_models.dart';
import '../features/informasi/presentation/informasi_screens.dart';
import '../features/keuangan/presentation/keuangan_screen.dart';
import '../features/auth/presentation/change_password_screen.dart';
import '../features/profil/presentation/contact_screen.dart';
import '../features/profil/presentation/privacy_policy_screen.dart';
import '../features/profil/presentation/profil_screen.dart';
import '../features/tagihan/presentation/ipl_list_screen.dart';
import '../features/reports/presentation/reports_screens.dart';

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
      GoRoute(path: '/internet', builder: (context, state) => const InternetScreen()),
      GoRoute(
        path: '/tagihan/:kind/:id',
        builder: (context, state) {
          final kind = state.pathParameters['kind'] == 'internet' ? BillKind.internet : BillKind.ipl;
          return BillDetailScreen(kind: kind, billId: state.pathParameters['id']!);
        },
      ),
      GoRoute(path: '/cctv', builder: (context, state) => const CctvScreen()),
      GoRoute(path: '/informasi', builder: (context, state) => const InformasiScreen()),
      GoRoute(path: '/keuangan', builder: (context, state) => const KeuanganScreen()),
      GoRoute(
        path: '/informasi/detail',
        builder: (context, state) {
          final (item, isEvent) = state.extra as (PublishedItem, bool);
          return InformasiDetailScreen(item: item, isEvent: isEvent);
        },
      ),
      GoRoute(path: '/reports', builder: (context, state) => const ReportHistoryScreen()),
      GoRoute(path: '/reports/new', builder: (context, state) => const ReportCreateScreen()),
      GoRoute(path: '/profile', builder: (context, state) => const ProfilScreen()),
      GoRoute(path: '/profile/password', builder: (context, state) => const ChangePasswordScreen()),
      GoRoute(path: '/profile/contact', builder: (context, state) => const ContactScreen()),
      GoRoute(path: '/profile/privacy', builder: (context, state) => const PrivacyPolicyScreen()),
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
