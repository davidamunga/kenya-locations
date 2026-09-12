/// Represents a county in Kenya.
///
/// Contains the county's identifying information, administrative region,
/// geographical area, population, and postal code.
class County {
  /// Creates a [County] with the given administrative and demographic data.
  const new({
    required this.code,
    required this.name,
    required this.capital,
    required this.areaKm2,
    required this.population2019,
    required this.region,
    required this.postalCode,
  });

  /// Creates a [County] from a map containing county data.
  ///
  /// The map is expected to contain the following keys:
  /// - `code`
  /// - `name`
  /// - `capital`
  /// - `area_km2`
  /// - `population_2019`
  /// - `region`
  /// - `postal_code`
  factory fromMap(Map<String, dynamic> map) => County(
    code: map['code'] as String,
    name: map['name'] as String,
    capital: map['capital'] as String,
    areaKm2: (map['area_km2'] as num).toDouble(),
    population2019: map['population_2019'] as int,
    region: map['region'] as String,
    postalCode: map['postal_code'] as String,
  );

  /// The unique administrative code of the county.
  final String code;

  /// The name of the county.
  final String name;

  /// The capital or administrative headquarters of the county.
  final String capital;

  /// The geographical area of the county in square kilometres.
  final double areaKm2;

  /// The county's population according to the 2019 Kenya Population and
  /// Housing Census.
  final int population2019;

  /// The geographical or administrative region associated with the county.
  final String region;

  /// The postal code associated with the county.
  final String postalCode;
}
