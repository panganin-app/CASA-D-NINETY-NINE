import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/config/contact_config.dart';
import '../../../core/theme/casa_tokens.dart';

/// Uri panggilan atau WhatsApp untuk satu kontak, atau null kalau belum diisi.
Uri? phoneUri(ContactItem c) => c.phone == null ? null : Uri.parse('tel:+${c.phone}');
Uri? whatsappUri(ContactItem c) => c.whatsapp == null ? null : Uri.parse('https://wa.me/${c.whatsapp}');

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  Future<void> _open(BuildContext context, Uri uri) async {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak dapat membuka aplikasi.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Hubungi Pengurus')),
      body: ListView.separated(
        padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
        itemCount: pengurusContacts.length,
        separatorBuilder: (_, _) => SizedBox(height: CasaTokens.spacing3),
        itemBuilder: (context, i) {
          final c = pengurusContacts[i];
          final call = phoneUri(c);
          final wa = whatsappUri(c);
          final available = call != null || wa != null;
          return Card(
            child: Padding(
              padding: EdgeInsets.all(CasaTokens.spacing4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(c.label, style: Theme.of(context).textTheme.titleLarge),
                  SizedBox(height: CasaTokens.spacing1),
                  Text(c.description, style: Theme.of(context).textTheme.bodySmall),
                  SizedBox(height: CasaTokens.spacing3),
                  if (!available)
                    Text('Nomor belum tersedia.', style: TextStyle(color: CasaTokens.colorTextSecondary))
                  else
                    Row(
                      children: [
                        if (call != null)
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _open(context, call),
                              icon: const Icon(Icons.phone_rounded),
                              label: const Text('Telepon'),
                            ),
                          ),
                        if (call != null && wa != null) SizedBox(width: CasaTokens.spacing2),
                        if (wa != null)
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _open(context, wa),
                              icon: const Icon(Icons.chat_rounded),
                              label: const Text('WhatsApp'),
                            ),
                          ),
                      ],
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
