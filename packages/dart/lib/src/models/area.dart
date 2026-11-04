/// Represents an area in Kenya.
///
/// Associates an area with its name, parent locality, and parent county.
class Area {
  /// Creates an [Area] with the given name, locality, and county.
  const new({
    required this.name,
    required this.locality,
    required this.county,
    required this.countyCode,
  });

  /// Creates an [Area] from a map containing area data.
  ///
  /// The map is expected to contain the following keys:
  /// - `name`
  /// - `locality`
  /// - `county`
  /// - `county_code`
  factory fromMap(Map<String, dynamic> map) => Area(
    name: map['name'] as String,
    locality: map['locality'] as String,
    county: map['county'] as String,
    countyCode: map['county_code'] as String,
  );

  /// The name of the area.
  final String name;

  /// The name of the locality that contains the area.
  final String locality;

  /// The name of the county that contains the area.
  final String county;

  /// The administrative code of the county that contains the area.
  final String countyCode;
}
