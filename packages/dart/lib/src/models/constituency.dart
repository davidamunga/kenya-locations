/// Represents a constituency in Kenya.
///
/// Associates a constituency with its unique administrative code, name, and
/// parent county.
class Constituency {
  /// Creates a [Constituency] with the given administrative code, name, and
  /// parent county.
  const new({required this.code, required this.name, required this.county});

  /// Creates a [Constituency] from a map containing constituency data.
  ///
  /// The map is expected to contain the following keys:
  /// - `code`
  /// - `name`
  /// - `county`
  factory fromMap(Map<String, dynamic> map) => Constituency(
    code: map['code'] as String,
    name: map['name'] as String,
    county: map['county'] as String,
  );

  /// The unique administrative code of the constituency.
  final String code;

  /// The name of the constituency.
  final String name;

  /// The name of the county that contains the constituency.
  final String county;
}
