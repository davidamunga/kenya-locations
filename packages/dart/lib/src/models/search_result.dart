import 'package:kenya_locations/src/models/area.dart';
import 'package:kenya_locations/src/models/constituency.dart';
import 'package:kenya_locations/src/models/county.dart';
import 'package:kenya_locations/src/models/locality.dart';
import 'package:kenya_locations/src/models/sub_county.dart';
import 'package:kenya_locations/src/models/ward.dart';

/// Represents the type of entity returned by a location search.
enum SearchType {
  /// A county.
  county,

  /// A sub-county.
  subCounty,

  /// A constituency.
  constituency,

  /// A ward.
  ward,

  /// A locality.
  locality,

  /// An area.
  area,
}

/// Represents a search result containing the matched entity and its type.
class SearchResult<T> {
  /// Creates a [SearchResult] with the given entity type and matched item.
  const new({required this.type, required this.item});

  /// The type of location entity matched by the search.
  final SearchType type;

  /// The matched location entity.
  final T item;

  /// The display name of the matched entity.
  String get name => switch (item) {
    County(:final name) => name,
    SubCounty(:final name) => name,
    Constituency(:final name) => name,
    Ward(:final name) => name,
    Locality(:final name) => name,
    Area(:final name) => name,
    _ => item.toString(),
  };
}
