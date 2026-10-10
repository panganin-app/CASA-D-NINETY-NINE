import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/casa_tokens.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/home_providers.dart';

/// Home (PRD §5.2) -- SEBAGIAN diimplementasikan di pass ini: greeting,
/// nomor rumah, pengumuman terbaru, quick actions. BELUM: status IPL,
/// agenda terdekat, notification indicator -- menyusul begitu
/// fitur/providernya sendiri dibangun (butuh halaman IPL & notifikasi
/// yang masih stub).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final displayName = ref.watch(myDisplayNameProvider);
    final household = ref.watch(householdProvider);
    final announcement = ref.watch(latestAnnouncementProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Beranda'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Keluar',
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(householdProvider);
          ref.invalidate(latestAnnouncementProvider);
        },
        child: ListView(
          padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
          children: [
            Text(
              'Halo, ${displayName.value ?? 'Warga'}',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            SizedBox(height: CasaTokens.spacing1),
            household.when(
              data: (h) => Text('Rumah ${h.label}', style: Theme.of(context).textTheme.bodyMedium),
              loading: () => const SizedBox(height: 16, width: 100, child: LinearProgressIndicator()),
              error: (e, _) => Text('Gagal memuat data rumah', style: TextStyle(color: CasaTokens.colorSemanticError)),
            ),
            SizedBox(height: CasaTokens.spacing8),
            Text('Menu Cepat', style: Theme.of(context).textTheme.titleLarge),
            SizedBox(height: CasaTokens.spacing3),
            _QuickActions(),
            SizedBox(height: CasaTokens.spacing8),
            Text('Pengumuman Terbaru', style: Theme.of(context).textTheme.titleLarge),
            SizedBox(height: CasaTokens.spacing3),
            announcement.when(
              data: (a) => a == null
                  ? Text('Belum ada pengumuman.', style: Theme.of(context).textTheme.bodyMedium)
                  : Card(
                      child: Padding(
                        padding: EdgeInsets.all(CasaTokens.spacing4),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(a.title, style: Theme.of(context).textTheme.titleLarge),
                            SizedBox(height: CasaTokens.spacing1),
                            Text(
                              a.description,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ),
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('Gagal memuat pengumuman', style: TextStyle(color: CasaTokens.colorSemanticError)),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions();

  @override
  Widget build(BuildContext context) {
    final actions = [
      (icon: Icons.receipt_long_rounded, label: 'IPL', path: '/ipl'),
      (icon: Icons.wifi_rounded, label: 'Internet', path: '/internet'),
      (icon: Icons.videocam_rounded, label: 'CCTV', path: '/cctv'),
      (icon: Icons.campaign_rounded, label: 'Informasi', path: '/informasi'),
      (icon: Icons.person_rounded, label: 'Profil', path: '/profile'),
    ];
    return Row(
      children: [
        for (final a in actions)
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: CasaTokens.spacing1),
              child: Material(
                color: CasaTokens.colorSurfacePrimary,
                borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
                child: InkWell(
                  borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
                  onTap: () => context.go(a.path),
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: CasaTokens.spacing3),
                    child: Column(
                      children: [
                        Icon(a.icon, color: CasaTokens.colorBrandNavy),
                        SizedBox(height: CasaTokens.spacing1),
                        Text(a.label, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
