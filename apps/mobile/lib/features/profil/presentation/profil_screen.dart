import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/casa_tokens.dart';
import '../../auth/providers/auth_providers.dart';
import '../data/profil_models.dart';
import '../providers/profil_providers.dart';

class ProfilScreen extends ConsumerWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profil = ref.watch(profilSayaProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profil Saya')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(profilSayaProvider);
          ref.invalidate(familyMembersProvider);
          ref.invalidate(vehiclesProvider);
        },
        child: ListView(
          padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
          children: [
            profil.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => _Note(
                text: e is AppException ? e.message : 'Gagal memuat profil.',
                isError: true,
              ),
              data: (p) => p == null ? const _Note(text: 'Profil tidak ditemukan.', isError: true) : _Header(profil: p),
            ),
            SizedBox(height: CasaTokens.spacing4),
            profil.maybeWhen(
              data: (p) => p == null ? const SizedBox.shrink() : _ContactSection(profil: p),
              orElse: () => const SizedBox.shrink(),
            ),
            SizedBox(height: CasaTokens.spacing4),
            const _FamilySection(),
            SizedBox(height: CasaTokens.spacing4),
            const _VehicleSection(),
            SizedBox(height: CasaTokens.spacing6),
            OutlinedButton.icon(
              onPressed: () => ref.read(authRepositoryProvider).signOut(),
              icon: Icon(Icons.logout_rounded, color: CasaTokens.colorSemanticError),
              label: Text('Keluar dari Akun', style: TextStyle(color: CasaTokens.colorSemanticError)),
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.profil});

  final ProfilSaya profil;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(CasaTokens.spacing4),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: CasaTokens.colorSurfaceSubtle,
              child: Text(profil.initials,
                  style: TextStyle(color: CasaTokens.colorBrandNavy, fontWeight: FontWeight.w700)),
            ),
            SizedBox(width: CasaTokens.spacing4),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(profil.displayName, style: Theme.of(context).textTheme.titleLarge),
                  if (profil.isHead) ...[
                    SizedBox(height: CasaTokens.spacing1),
                    Text('Kepala Keluarga', style: TextStyle(color: CasaTokens.colorBrandGoldDark)),
                  ],
                  SizedBox(height: CasaTokens.spacing1),
                  Text('Rumah ${profil.houseLabel}', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactSection extends ConsumerWidget {
  const _ContactSection({required this.profil});

  final ProfilSaya profil;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.all(CasaTokens.spacing4),
            child: Text('Data Warga', style: Theme.of(context).textTheme.titleLarge),
          ),
          ListTile(
            leading: const Icon(Icons.phone_rounded),
            title: const Text('Nomor Telepon'),
            subtitle: Text(profil.phone.isEmpty ? 'Belum diisi' : profil.phone),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => _editPhone(context, ref, profil),
          ),
          ListTile(
            leading: const Icon(Icons.email_rounded),
            title: const Text('Email'),
            subtitle: Text(profil.email.isEmpty ? '-' : profil.email),
          ),
        ],
      ),
    );
  }

  Future<void> _editPhone(BuildContext context, WidgetRef ref, ProfilSaya profil) async {
    final controller = TextEditingController(text: profil.phone);
    final newPhone = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ubah Nomor Telepon'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: '+628xxxxxxxxxx'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text.trim()), child: const Text('Simpan')),
        ],
      ),
    );
    controller.dispose();
    if (newPhone == null || newPhone.isEmpty || newPhone == profil.phone) return;

    try {
      await ref.read(profilRepositoryProvider).updateContact(
            phone: newPhone,
            expectedVersion: profil.version,
          );
      ref.invalidate(profilSayaProvider);
    } on AppException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

class _FamilySection extends ConsumerWidget {
  const _FamilySection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final members = ref.watch(familyMembersProvider);
    return _SectionCard(
      title: 'Anggota Keluarga',
      child: members.when(
        loading: () => const LinearProgressIndicator(),
        error: (e, _) => const _Note(text: 'Gagal memuat anggota keluarga.', isError: true),
        data: (items) => items.isEmpty
            ? const _Note(text: 'Belum ada anggota keluarga terdaftar.')
            : Column(
                children: [
                  for (final m in items)
                    ListTile(
                      leading: const Icon(Icons.person_rounded),
                      title: Text(m.fullName),
                      subtitle: Text(m.relationship),
                    ),
                ],
              ),
      ),
    );
  }
}

class _VehicleSection extends ConsumerWidget {
  const _VehicleSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehicles = ref.watch(vehiclesProvider);
    return _SectionCard(
      title: 'Kendaraan',
      child: vehicles.when(
        loading: () => const LinearProgressIndicator(),
        error: (e, _) => const _Note(text: 'Gagal memuat kendaraan.', isError: true),
        data: (items) => items.isEmpty
            ? const _Note(text: 'Belum ada kendaraan terdaftar.')
            : Column(
                children: [
                  for (final v in items)
                    ListTile(
                      leading: const Icon(Icons.directions_car_rounded),
                      title: Text(v.plateNumber),
                      subtitle: Text([v.type, v.brand, v.color].whereType<String>().where((s) => s.isNotEmpty).join(' · ')),
                    ),
                ],
              ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.all(CasaTokens.spacing4),
            child: Text(title, style: Theme.of(context).textTheme.titleLarge),
          ),
          child,
        ],
      ),
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.text, this.isError = false});

  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(CasaTokens.spacing4),
      child: Text(
        text,
        style: TextStyle(color: isError ? CasaTokens.colorSemanticError : CasaTokens.colorTextSecondary),
      ),
    );
  }
}
