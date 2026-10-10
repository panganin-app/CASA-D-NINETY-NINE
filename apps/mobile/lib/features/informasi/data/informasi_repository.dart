import '../../../core/network/functions_client.dart';
import 'informasi_models.dart';

/// Pengumuman dan agenda dibaca lewat callable `listPublishedContent` --
/// backend yang menyaring status PUBLISHED dan memaginasi hasilnya.
class InformasiRepository {
  InformasiRepository({FunctionsClient? functions}) : _functions = functions ?? FunctionsClient();

  final FunctionsClient _functions;

  Future<PublishedPage> listPage({
    required ContentType type,
    String? afterId,
    int limit = 20,
  }) async {
    final result = await _functions.call('listPublishedContent', {
      'type': type.apiValue,
      'limit': limit,
      'afterId': ?afterId,
    });
    final items = ((result['items'] as List?) ?? const [])
        .map((e) => PublishedItem.fromMap(Map<String, dynamic>.from(e as Map)))
        .toList();
    return PublishedPage(items: items, nextCursor: result['nextCursor'] as String?);
  }
}
