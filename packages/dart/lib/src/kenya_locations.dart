import 'package:kenya_locations/src/generated/data.dart';
import 'package:kenya_locations/src/models/models.dart';

/// Provides access to Kenya's administrative and geographical location data.
///
/// Includes methods for retrieving counties, sub-counties, constituencies,
/// wards, localities, and areas, as well as searching across supported
/// location types.
class KenyaLocations {
  static final List<County> _counties = rawCounties
      .map(County.fromMap)
      .toList();

  static final List<SubCounty> _subCounties = rawSubCounties
      .map(SubCounty.fromMap)
      .toList();

  static final List<Constituency> _constituencies = rawConstituencies
      .map(Constituency.fromMap)
      .toList();

  static final List<Ward> _wards = rawWards.map(Ward.fromMap).toList();

  static final List<Locality> _localities = rawLocalities
      .map(Locality.fromMap)
      .toList();

  static final List<Area> _areas = rawAreas.map(Area.fromMap).toList();

  /// Returns all counties in Kenya.
  static List<County> getCounties() => _counties;

  /// Returns the county with the given administrative code.
  ///
  /// Returns `null` if no county matches the [code].
  static County? getCountyByCode(String code) =>
      _counties.where((c) => c.code == code).firstOrNull;

  /// Returns the county with the given name.
  ///
  /// The comparison is case-insensitive. Returns `null` if no county matches
  /// the [name].
  static County? getCountyByName(String name) => _counties
      .where((c) => c.name.toLowerCase() == name.toLowerCase())
      .firstOrNull;

  /// Returns all sub-counties in Kenya.
  static List<SubCounty> getSubCounties() => _subCounties;

  /// Returns all sub-counties belonging to the given county.
  ///
  /// The comparison is case-insensitive.
  static List<SubCounty> getSubCountiesInCounty(String countyName) =>
      _subCounties
          .where((s) => s.county.toLowerCase() == countyName.toLowerCase())
          .toList();

  /// Returns all constituencies in Kenya.
  static List<Constituency> getConstituencies() => _constituencies;

  /// Returns all constituencies belonging to the given county.
  ///
  /// The comparison is case-insensitive.
  static List<Constituency> getConstituenciesInCounty(String countyName) =>
      _constituencies
          .where((c) => c.county.toLowerCase() == countyName.toLowerCase())
          .toList();

  /// Returns all wards in Kenya.
  static List<Ward> getWards() => _wards;

  /// Returns all wards belonging to the given constituency.
  ///
  /// The comparison is case-insensitive.
  static List<Ward> getWardsInConstituency(String constituencyName) => _wards
      .where(
        (w) => w.constituency.toLowerCase() == constituencyName.toLowerCase(),
      )
      .toList();

  /// Returns the constituency containing the given ward.
  ///
  /// The comparison of the ward name is case-insensitive. Returns `null` if
  /// the ward or its parent constituency cannot be found.
  static Constituency? getConstituencyOfWard(String wardName) {
    final ward = _wards
        .where((w) => w.name.toLowerCase() == wardName.toLowerCase())
        .firstOrNull;
    if (ward == null) return null;

    return _constituencies
        .where((c) => c.name == ward.constituency)
        .firstOrNull;
  }

  /// Returns all localities in Kenya.
  static List<Locality> getLocalities() => _localities;

  /// Returns all localities belonging to the given county.
  ///
  /// The comparison is case-insensitive.
  static List<Locality> getLocalitiesInCounty(String countyName) => _localities
      .where((l) => l.county.toLowerCase() == countyName.toLowerCase())
      .toList();

  /// Returns all areas in Kenya.
  static List<Area> getAreas() => _areas;

  /// Returns all areas belonging to the given locality.
  ///
  /// The comparison is case-insensitive.
  static List<Area> getAreasInLocality(String localityName) => _areas
      .where((a) => a.locality.toLowerCase() == localityName.toLowerCase())
      .toList();

  /// Searches across counties, wards, localities, and areas.
  ///
  /// The search is case-insensitive and matches locations whose names contain
  /// the [query]. Returns at most [limit] results.
  static List<SearchResult<dynamic>> search(String query, {int limit = 10}) {
    final q = query.toLowerCase();

    final results = <SearchResult<dynamic>>[
      ..._counties
          .where((c) => c.name.toLowerCase().contains(q))
          .map((c) => SearchResult(type: SearchType.county, item: c)),
      ..._wards
          .where((w) => w.name.toLowerCase().contains(q))
          .map((w) => SearchResult(type: SearchType.ward, item: w)),
      ..._localities
          .where((l) => l.name.toLowerCase().contains(q))
          .map((l) => SearchResult(type: SearchType.locality, item: l)),
      ..._areas
          .where((a) => a.name.toLowerCase().contains(q))
          .map((a) => SearchResult(type: SearchType.area, item: a)),
    ];

    return results.take(limit).toList();
  }
}
