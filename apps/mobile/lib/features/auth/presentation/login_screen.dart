import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/casa_tokens.dart';
import '../providers/auth_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).signIn(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
      // Navigasi ke /home ditangani router (redirect otomatis begitu
      // authStateProvider berubah, lihat routing/app_router.dart) -- gak
      // perlu context.go() manual di sini.
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      "Casa D'Ninety Nine",
                      style: Theme.of(context).textTheme.headlineMedium,
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: CasaTokens.spacing1),
                    Text(
                      'Masuk ke akun warga Anda',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: CasaTokens.spacing8),
                    if (_error != null) ...[
                      Container(
                        padding: EdgeInsets.all(CasaTokens.spacing3),
                        decoration: BoxDecoration(
                          color: CasaTokens.colorSemanticError.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
                        ),
                        child: Text(
                          _error!,
                          style: TextStyle(color: CasaTokens.colorSemanticError),
                        ),
                      ),
                      SizedBox(height: CasaTokens.spacing4),
                    ],
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(labelText: 'Email', filled: true),
                      validator: (value) =>
                          (value == null || !value.contains('@')) ? 'Email tidak valid' : null,
                    ),
                    SizedBox(height: CasaTokens.spacing3),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      textInputAction: TextInputAction.done,
                      decoration: const InputDecoration(labelText: 'Kata Sandi', filled: true),
                      validator: (value) =>
                          (value == null || value.isEmpty) ? 'Kata sandi wajib diisi' : null,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    SizedBox(height: CasaTokens.spacing6),
                    ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Masuk'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
