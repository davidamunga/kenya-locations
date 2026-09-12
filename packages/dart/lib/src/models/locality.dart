/// Represents a locality in Kenya.
///
/// Associates a locality with its name and parent county.
class Locality {
  /// Creates a [Locality] with the given name and parent county.
  const new({required this.name, required this.county});

  /// Creates a [Locality] from a map containing locality data.
  ///
  /// The map is expected to contain the following keys:
  /// - `name`
  /// - `county`
  factory fromMap(Map<String, dynamic> map) =>
      Locality(name: map['name'] as String, county: map['county'] as String);

  /// The name of the locality.
  final String name;

  /// The name of the county that contains the locality.
  final String county;
}
