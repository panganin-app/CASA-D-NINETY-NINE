import '../../../core/network/functions_client.dart';
import 'keuangan_models.dart';

/// Data keuangan dibaca lewat callable `listFinancePublications`. Backend hanya
/// mengembalikan periode yang sudah dipublikasikan.
class KeuanganRepository {
  KeuanganRepository({FunctionsClient? functions}) : _functions = functions ?? FunctionsClient();

  final FunctionsClient _functions;

  Future<List<PublishedPeriod>> listPeriods({int limit = 24}) async {
    final result = await _functions.call('listFinancePublications', {'limit': limit});
    final items = (result['items'] as List?) ?? const [];
    return items
        .map((e) => PublishedPeriod.fromMap(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}
