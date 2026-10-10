import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/casa_tokens.dart';
import '../data/informasi_models.dart';
import '../providers/informasi_providers.dart';
import 'package:go_router/go_router.dart';

/// Layar Informasi: dua tab, Pengumuman dan Agenda (PRD §5.2).
class InformasiScreen extends StatelessWidget {
  const InformasiScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Informasi'),
          bottom: const TabBar(tabs: [Tab(text: 'Pengumuman'), Tab(text: 'Agenda')]),
        ),
        body: TabBarView(
          children: [
            _ContentList(provider: announcementsListProvider, emptyText: 'Belum ada pengumuman.'),
            _ContentList(provider: eventsListProvider, emptyText: 'Belum ada agenda.'),
          ],
        ),
      ),
    );
  }
}

class _ContentList extends ConsumerStatefulWidget {
  const _ContentList({required this.provider, required this.emptyText});

  final NotifierProvider<InformasiListNotifier, InformasiListState> provider;
  final String emptyText;

  @override
  ConsumerState<_ContentList> createState() => _ContentListState();
}

class _ContentListState extends ConsumerState<_ContentList> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_maybeLoadMore);
    // Muat halaman pertama setelah frame pertama supaya tidak memodifikasi
    // provider saat build.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(widget.provider.notifier).loadFirstPage();
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _maybeLoadMore() {
    if (!_scroll.hasClients) return;
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) {
      ref.read(widget.provider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(widget.provider);
    final notifier = ref.read(widget.provider.notifier);

    if (!state.initialized && state.loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.initialized && state.items.isEmpty && state.error == null) {
      return RefreshIndicator(
        onRefresh: notifier.refresh,
        child: ListView(children: [_Message(text: widget.emptyText)]),
      );
    }
    if (state.items.isEmpty && state.error != null) {
      return RefreshIndicator(
        onRefresh: notifier.refresh,
        child: ListView(children: [_Message(text: 'Gagal memuat. Tarik untuk coba lagi.')]),
      );
    }

    return RefreshIndicator(
      onRefresh: notifier.refresh,
      child: ListView.separated(
        controller: _scroll,
        padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
        itemCount: state.items.length + (state.hasMore ? 1 : 0),
        separatorBuilder: (_, _) => SizedBox(height: CasaTokens.spacing3),
        itemBuilder: (context, i) {
          if (i >= state.items.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _ItemCard(
            item: state.items[i],
            onTap: () => context.push('/informasi/detail', extra: (state.items[i], widget.provider == eventsListProvider)),
          );
        },
      ),
    );
  }
}

class _ItemCard extends StatelessWidget {
  const _ItemCard({required this.item, required this.onTap});

  final PublishedItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(CasaTokens.radiusLg),
        onTap: onTap,
        child: Padding(
        padding: EdgeInsets.all(CasaTokens.spacing4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.title, style: Theme.of(context).textTheme.titleLarge),
            if (item.startsAt != null) ...[
              SizedBox(height: CasaTokens.spacing1),
              Text(_formatWhen(item), style: Theme.of(context).textTheme.bodySmall),
            ],
            if (item.location != null && item.location!.isNotEmpty) ...[
              SizedBox(height: CasaTokens.spacing1),
              Text(item.location!, style: Theme.of(context).textTheme.bodySmall),
            ],
            SizedBox(height: CasaTokens.spacing2),
            Text(item.description, maxLines: 3, overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
        ),
      ),
    );
  }

  String _formatWhen(PublishedItem item) {
    final s = item.startsAt!.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(s.day)}/${two(s.month)}/${s.year} ${two(s.hour)}:${two(s.minute)}';
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding * 2),
      child: Text(text, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
    );
  }
}

/// Detail pengumuman atau agenda. Data dikirim dari daftar (lihat router),
/// jadi tidak perlu panggilan backend tambahan.
class InformasiDetailScreen extends StatelessWidget {
  const InformasiDetailScreen({super.key, required this.item, required this.isEvent});

  final PublishedItem item;
  final bool isEvent;

  @override
  Widget build(BuildContext context) {
    final start = item.startsAt?.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return Scaffold(
      appBar: AppBar(title: Text(isEvent ? 'Agenda' : 'Pengumuman')),
      body: ListView(
        padding: EdgeInsets.all(CasaTokens.layoutMobileContentPadding),
        children: [
          Text(item.title, style: Theme.of(context).textTheme.headlineMedium),
          if (start != null) ...[
            SizedBox(height: CasaTokens.spacing2),
            Text(
              '${two(start.day)}/${two(start.month)}/${start.year} ${two(start.hour)}:${two(start.minute)}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
          if (item.location != null && item.location!.isNotEmpty) ...[
            SizedBox(height: CasaTokens.spacing1),
            Text(item.location!, style: Theme.of(context).textTheme.bodyMedium),
          ],
          SizedBox(height: CasaTokens.spacing4),
          Text(item.description, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}
