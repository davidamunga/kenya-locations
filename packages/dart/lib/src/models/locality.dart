/// Represents a locality in Kenya.
///
/// Associates a locality with its name and parent county.
class Locality {
  /// Creates a [Locality] with the given name and parent county.
  const new({
    required this.name,
    required this.county,
    required this.countyCode,
  });

  /// Creates a [Locality] from a map containing locality data.
  ///
  /// The map is expected to contain the following keys:
  /// - `name`
  /// - `county`
  /// - `county_code`
  factory fromMap(Map<String, dynamic> map) => Locality(
    name: map['name'] as String,
    county: map['county'] as String,
    countyCode: map['county_code'] as String,
  );

  /// The name of the locality.
  final String name;

  /// The name of the county that contains the locality.
  final String county;

  /// The administrative code of the county that contains the locality.
  final String countyCode;
}
