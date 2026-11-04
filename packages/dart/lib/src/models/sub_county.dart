/// Represents a sub-county in Kenya.
///
/// Associates a sub-county with its unique administrative code, name, and
/// parent county.
class SubCounty {
  /// Creates a [SubCounty] with the given administrative code, name, and
  /// parent county.
  const new({
    required this.code,
    required this.name,
    required this.county,
    required this.countyCode,
  });

  /// Creates a [SubCounty] from a map containing sub-county data.
  ///
  /// The map is expected to contain the following keys:
  /// - `code`
  /// - `name`
  /// - `county`
  /// - `county_code`
  factory fromMap(Map<String, dynamic> map) => SubCounty(
    code: map['code'] as String,
    name: map['name'] as String,
    county: map['county'] as String,
    countyCode: map['county_code'] as String,
  );

  /// The unique administrative code of the sub-county.
  final String code;

  /// The name of the sub-county.
  final String name;

  /// The name of the county that contains the sub-county.
  final String county;

  /// The administrative code of the county that contains the sub-county.
  final String countyCode;
}
