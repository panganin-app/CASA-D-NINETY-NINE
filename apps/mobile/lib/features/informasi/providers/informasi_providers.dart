import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../home/providers/home_providers.dart';
import '../data/informasi_models.dart';
import '../data/informasi_repository.dart';

final informasiRepositoryProvider = Provider<InformasiRepository>((ref) {
  return InformasiRepository(functions: ref.watch(functionsClientProvider));
});

class InformasiListState {
  const InformasiListState({
    this.items = const [],
    this.nextCursor,
    this.loading = false,
    this.error,
    this.initialized = false,
  });

  final List<PublishedItem> items;
  final String? nextCursor;
  final bool loading;
  final String? error;
  final bool initialized;

  bool get hasMore => nextCursor != null;

  InformasiListState copyWith({
    List<PublishedItem>? items,
    String? nextCursor,
    bool clearCursor = false,
    bool? loading,
    String? error,
    bool clearError = false,
    bool? initialized,
  }) {
    return InformasiListState(
      items: items ?? this.items,
      nextCursor: clearCursor ? null : (nextCursor ?? this.nextCursor),
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      initialized: initialized ?? this.initialized,
    );
  }
}

/// Daftar pengumuman/agenda dengan paginasi. `loadMore()` dipanggil saat
/// pengguna mencapai akhir daftar; `refresh()` mengulang dari awal.
class InformasiListNotifier extends Notifier<InformasiListState> {
  InformasiListNotifier(this.type);

  final ContentType type;

  @override
  InformasiListState build() => const InformasiListState();

  Future<void> loadFirstPage() async {
    state = const InformasiListState(loading: true);
    await _fetch(afterId: null, replace: true);
  }

  Future<void> loadMore() async {
    if (state.loading || !state.hasMore) return;
    state = state.copyWith(loading: true, clearError: true);
    await _fetch(afterId: state.nextCursor, replace: false);
  }

  Future<void> refresh() => loadFirstPage();

  Future<void> _fetch({required String? afterId, required bool replace}) async {
    try {
      final page = await ref
          .read(informasiRepositoryProvider)
          .listPage(type: type, afterId: afterId);
      state = state.copyWith(
        items: replace ? page.items : [...state.items, ...page.items],
        nextCursor: page.nextCursor,
        clearCursor: page.nextCursor == null,
        loading: false,
        initialized: true,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(loading: false, initialized: true, error: e.toString());
    }
  }
}

final announcementsListProvider =
    NotifierProvider.autoDispose<InformasiListNotifier, InformasiListState>(
  () => InformasiListNotifier(ContentType.announcements),
);

final eventsListProvider = NotifierProvider.autoDispose<InformasiListNotifier, InformasiListState>(
  () => InformasiListNotifier(ContentType.events),
);
