import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/casa_tokens.dart';
import '../domain/password_rules.dart';
import '../providers/auth_providers.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _done = false;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).changePassword(
            currentPassword: _currentController.text,
            newPassword: _newController.text,
          );
      if (!mounted) return;
      setState(() => _done = true);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ubah Kata Sandi')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
        child: _done
            ? Column(
                children: [
                  SizedBox(height: CasaTokens.spacing6),
                  Icon(Icons.check_circle_rounded, size: 56, color: CasaTokens.colorSemanticSuccess),
                  SizedBox(height: CasaTokens.spacing3),
                  Text('Kata sandi berhasil diubah.', style: Theme.of(context).textTheme.titleLarge),
                  SizedBox(height: CasaTokens.spacing6),
                  ElevatedButton(onPressed: () => Navigator.of(context).maybePop(), child: const Text('Kembali')),
                ],
              )
            : Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_error != null) ...[
                      Container(
                        padding: EdgeInsets.all(CasaTokens.spacing3),
                        decoration: BoxDecoration(
                          color: CasaTokens.colorSemanticError.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
                        ),
                        child: Text(_error!, style: TextStyle(color: CasaTokens.colorSemanticError)),
                      ),
                      SizedBox(height: CasaTokens.spacing3),
                    ],
                    TextFormField(
                      controller: _currentController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Kata sandi saat ini', filled: true),
                      validator: (v) => (v == null || v.isEmpty) ? 'Wajib diisi' : null,
                    ),
                    SizedBox(height: CasaTokens.spacing3),
                    TextFormField(
                      controller: _newController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Kata sandi baru',
                        helperText: 'Minimal $minPasswordLength karakter',
                        filled: true,
                      ),
                      validator: (v) => validateNewPassword(
                        v ?? '',
                        currentPassword: _currentController.text,
                      ),
                    ),
                    SizedBox(height: CasaTokens.spacing3),
                    TextFormField(
                      controller: _confirmController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Ulangi kata sandi baru', filled: true),
                      validator: (v) => v != _newController.text ? 'Kata sandi tidak sama' : null,
                    ),
                    SizedBox(height: CasaTokens.spacing6),
                    ElevatedButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Simpan Kata Sandi'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
