/// Represents an area in Kenya.
///
/// Associates an area with its name, parent locality, and parent county.
class Area {
  /// Creates an [Area] with the given name, locality, and county.
  const Area({
    required this.name,
    required this.locality,
    required this.county,
  });

  /// Creates an [Area] from a map containing area data.
  ///
  /// The map is expected to contain the following keys:
  /// - `name`
  /// - `locality`
  /// - `county`
  factory Area.fromMap(Map<String, dynamic> map) => Area(
    name: map['name'] as String,
    locality: map['locality'] as String,
    county: map['county'] as String,
  );

  /// The name of the area.
  final String name;

  /// The name of the locality that contains the area.
  final String locality;

  /// The name of the county that contains the area.
  final String county;
}
