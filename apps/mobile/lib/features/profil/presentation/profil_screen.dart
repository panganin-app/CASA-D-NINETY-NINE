import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/casa_tokens.dart';
import '../../auth/providers/auth_providers.dart';
import '../../home/providers/home_providers.dart';
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
            SizedBox(height: CasaTokens.spacing4),
            const _AccountSection(),
            SizedBox(height: CasaTokens.spacing4),
            const _HelpSection(),
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
          ListTile(
            leading: const Icon(Icons.house_rounded),
            title: const Text('Status Hunian'),
            subtitle: Text(_occupancyLabel(ref.watch(householdProvider).value?.occupancyType)),
          ),
        ],
      ),
    );
  }

  static String _occupancyLabel(String? type) {
    switch (type) {
      case 'OWNER':
        return 'Milik sendiri';
      case 'RENTER':
        return 'Sewa / kontrak';
      default:
        return 'Belum diatur pengurus';
    }
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
    final isHead = ref.watch(householdProvider).value?.isHead ?? false;
    return _SectionCard(
      title: 'Anggota Keluarga',
      action: isHead
          ? TextButton.icon(
              onPressed: () => _openFamilyForm(context, ref, null),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Tambah'),
            )
          : null,
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
                      subtitle: Text(Relationship.labelOf(m.relationship)),
                      trailing: isHead
                          ? PopupMenuButton<String>(
                              onSelected: (v) => v == 'edit'
                                  ? _openFamilyForm(context, ref, m)
                                  : _removeFamily(context, ref, m),
                              itemBuilder: (_) => const [
                                PopupMenuItem(value: 'edit', child: Text('Ubah')),
                                PopupMenuItem(value: 'delete', child: Text('Hapus')),
                              ],
                            )
                          : null,
                    ),
                ],
              ),
      ),
    );
  }

  Future<void> _openFamilyForm(BuildContext context, WidgetRef ref, FamilyMemberItem? existing) async {
    final nameCtrl = TextEditingController(text: existing?.fullName ?? '');
    final phoneCtrl = TextEditingController(text: existing?.phone ?? '');
    var rel = existing == null ? Relationship.anak : Relationship.values.firstWhere(
          (r) => r.code == existing.relationship,
          orElse: () => Relationship.lainnya,
        );
    final requestId = _newRequestId();

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setD) => AlertDialog(
          title: Text(existing == null ? 'Tambah anggota keluarga' : 'Ubah anggota keluarga'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nama lengkap')),
                const SizedBox(height: 8),
                DropdownButtonFormField<Relationship>(
                  initialValue: rel,
                  decoration: const InputDecoration(labelText: 'Hubungan'),
                  items: [for (final r in Relationship.values) DropdownMenuItem(value: r, child: Text(r.label))],
                  onChanged: (v) => setD(() => rel = v ?? rel),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Telepon (opsional)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
          ],
        ),
      ),
    );
    final name = nameCtrl.text.trim();
    final phone = phoneCtrl.text.trim();
    nameCtrl.dispose();
    phoneCtrl.dispose();
    if (saved != true || name.isEmpty || !context.mounted) return;

    try {
      final repo = ref.read(profilRepositoryProvider);
      if (existing == null) {
        await repo.saveFamilyMember(requestId: requestId, fullName: name, relationship: rel, phone: phone.isEmpty ? null : phone);
      } else {
        await repo.updateFamilyMember(member: existing, fullName: name, relationship: rel, phone: phone.isEmpty ? null : phone);
      }
      ref.invalidate(familyMembersProvider);
    } on AppException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _removeFamily(BuildContext context, WidgetRef ref, FamilyMemberItem m) async {
    final ok = await _confirm(context, 'Hapus ${m.fullName} dari daftar anggota keluarga?');
    if (!ok) return;
    try {
      await ref.read(profilRepositoryProvider).removeFamilyMember(m);
      ref.invalidate(familyMembersProvider);
    } on AppException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

class _VehicleThumb extends ConsumerWidget {
  const _VehicleThumb({required this.vehicle});

  final VehicleItem vehicle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!vehicle.hasPhoto) return const Icon(Icons.directions_car_rounded);
    final photo = ref.watch(vehiclePhotoProvider(vehicle.id));
    return photo.maybeWhen(
      data: (bytes) => bytes == null
          ? const Icon(Icons.directions_car_rounded)
          : ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.memory(bytes, width: 48, height: 48, fit: BoxFit.cover),
            ),
      orElse: () => const SizedBox(width: 48, height: 48, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
    );
  }
}

class _VehicleSection extends ConsumerWidget {
  const _VehicleSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehicles = ref.watch(vehiclesProvider);
    final isHead = ref.watch(householdProvider).value?.isHead ?? false;
    return _SectionCard(
      title: 'Kendaraan',
      action: isHead
          ? TextButton.icon(
              onPressed: () => _openVehicleForm(context, ref, null),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Tambah'),
            )
          : null,
      child: vehicles.when(
        loading: () => const LinearProgressIndicator(),
        error: (e, _) => const _Note(text: 'Gagal memuat kendaraan.', isError: true),
        data: (items) => items.isEmpty
            ? const _Note(text: 'Belum ada kendaraan terdaftar.')
            : Column(
                children: [
                  for (final v in items)
                    ListTile(
                      leading: _VehicleThumb(vehicle: v),
                      title: Text(v.plateNumber),
                      subtitle: Text(
                        [VehicleType.labelOf(v.type), v.brand, v.color].whereType<String>().where((x) => x.isNotEmpty).join(' · '),
                      ),
                      trailing: isHead
                          ? PopupMenuButton<String>(
                              onSelected: (val) => val == 'edit'
                                  ? _openVehicleForm(context, ref, v)
                                  : _removeVehicle(context, ref, v),
                              itemBuilder: (_) => const [
                                PopupMenuItem(value: 'edit', child: Text('Ubah')),
                                PopupMenuItem(value: 'delete', child: Text('Hapus')),
                              ],
                            )
                          : null,
                    ),
                ],
              ),
      ),
    );
  }

  Future<void> _openVehicleForm(BuildContext context, WidgetRef ref, VehicleItem? existing) async {
    final plateCtrl = TextEditingController(text: existing?.plateNumber ?? '');
    final brandCtrl = TextEditingController(text: existing?.brand ?? '');
    final colorCtrl = TextEditingController(text: existing?.color ?? '');
    var type = existing == null ? VehicleType.mobil : VehicleType.values.firstWhere(
          (t) => t.code == existing.type,
          orElse: () => VehicleType.lainnya,
        );
    Uint8List? photo;
    final requestId = _newRequestId();

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setD) => AlertDialog(
          title: Text(existing == null ? 'Tambah kendaraan' : 'Ubah kendaraan'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (photo != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.memory(photo!, height: 120, fit: BoxFit.cover),
                  )
                else if (existing?.hasPhoto ?? false)
                  const Text('Foto sudah ada. Pilih lagi untuk menggantinya.')
                else
                  const Text('Foto kendaraan wajib dilampirkan.'),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () async {
                    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 2000);
                    if (picked == null) return;
                    final bytes = await picked.readAsBytes();
                    setD(() => photo = bytes);
                  },
                  icon: const Icon(Icons.photo_camera_rounded),
                  label: Text(photo == null ? 'Pilih foto' : 'Ganti foto'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: plateCtrl,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(labelText: 'Nomor plat'),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<VehicleType>(
                  initialValue: type,
                  decoration: const InputDecoration(labelText: 'Jenis'),
                  items: [for (final t in VehicleType.values) DropdownMenuItem(value: t, child: Text(t.label))],
                  onChanged: (v) => setD(() => type = v ?? type),
                ),
                const SizedBox(height: 8),
                TextField(controller: brandCtrl, decoration: const InputDecoration(labelText: 'Merek (opsional)')),
                const SizedBox(height: 8),
                TextField(controller: colorCtrl, decoration: const InputDecoration(labelText: 'Warna (opsional)')),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
          ],
        ),
      ),
    );
    final plate = plateCtrl.text.trim();
    final brand = brandCtrl.text.trim();
    final color = colorCtrl.text.trim();
    plateCtrl.dispose();
    brandCtrl.dispose();
    colorCtrl.dispose();
    if (saved != true || plate.isEmpty || !context.mounted) return;

    // Foto wajib untuk kendaraan baru; backend juga menolak tanpa foto.
    if (existing == null && photo == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Foto kendaraan wajib dilampirkan.')));
      return;
    }

    try {
      final repo = ref.read(profilRepositoryProvider);
      if (existing == null) {
        await repo.saveVehicle(
          requestId: requestId,
          plateNumber: plate,
          type: type,
          photo: photo!,
          brand: brand.isEmpty ? null : brand,
          color: color.isEmpty ? null : color,
        );
      } else {
        await repo.updateVehicle(
          vehicle: existing,
          plateNumber: plate,
          type: type,
          photo: photo,
          brand: brand.isEmpty ? null : brand,
          color: color.isEmpty ? null : color,
        );
      }
      ref.invalidate(vehiclesProvider);
      ref.invalidate(vehiclePhotoProvider);
    } on AppException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _removeVehicle(BuildContext context, WidgetRef ref, VehicleItem v) async {
    final ok = await _confirm(context, 'Hapus kendaraan ${v.plateNumber} dari daftar?');
    if (!ok) return;
    try {
      await ref.read(profilRepositoryProvider).removeVehicle(v);
      ref.invalidate(vehiclesProvider);
    } on AppException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

Future<bool> _confirm(BuildContext context, String text) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      content: Text(text),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ya')),
      ],
    ),
  );
  return ok == true;
}

/// requestId acak per dialog -- retry tidak membuat data ganda (backend idempoten).
String _newRequestId() {
  final r = Random.secure();
  return List.generate(16, (_) => r.nextInt(16).toRadixString(16)).join();
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child, this.action});

  final String title;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(CasaTokens.spacing4, CasaTokens.spacing2, CasaTokens.spacing2, 0),
            child: Row(
              children: [
                Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge)),
                ?action,
              ],
            ),
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

class _AccountSection extends ConsumerWidget {
  const _AccountSection();

  Future<void> _requestDeletion(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus akun?'),
        content: const Text(
          'Akun Anda akan langsung dikunci dan tidak bisa masuk. Data pribadi akan dihapus setelah 14 hari. '
          'Selama 14 hari, Anda dapat meminta pengurus memulihkan akun. Riwayat pembayaran dan laporan tetap '
          'disimpan sebagai catatan rumah.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: CasaTokens.colorSemanticError),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Ya, hapus akun'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(profilRepositoryProvider).requestAccountDeletion();
      messenger.showSnackBar(const SnackBar(content: Text('Permintaan hapus akun diterima.')));
      await ref.read(authRepositoryProvider).signOut();
    } on AppException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _SectionCard(
      title: 'Akun',
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.lock_rounded),
            title: const Text('Ubah Kata Sandi'),
            subtitle: const Text('Ganti kata sandi akun Anda'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/profile/password'),
          ),
          ListTile(
            leading: Icon(Icons.delete_outline_rounded, color: CasaTokens.colorSemanticError),
            title: Text('Hapus Akun', style: TextStyle(color: CasaTokens.colorSemanticError)),
            subtitle: const Text('Akun dikunci dan dihapus setelah 14 hari'),
            onTap: () => _requestDeletion(context, ref),
          ),
        ],
      ),
    );
  }
}

class _HelpSection extends StatelessWidget {
  const _HelpSection();

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Bantuan',
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.support_agent_rounded),
            title: const Text('Hubungi Pengurus'),
            subtitle: const Text('Pertanyaan atau laporan'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/profile/contact'),
          ),
          ListTile(
            leading: const Icon(Icons.policy_rounded),
            title: const Text('Kebijakan Privasi'),
            subtitle: const Text('Lihat kebijakan privasi aplikasi'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/profile/privacy'),
          ),
        ],
      ),
    );
  }
}
