import 'dart:math' as math;

import 'package:kenya_locations/src/src.dart';

/// Provides access to Kenya's administrative and geographical location data.
///
/// Includes methods for retrieving counties, sub-counties, constituencies,
/// wards, localities, and areas, as well as searching across supported
/// location types.
///
/// Search supports case-insensitive substring matching and typo-tolerant
/// matching using Levenshtein distance.
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
  /// County codes are represented as three-digit strings, for example `047`
  /// for Nairobi County.
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
  /// The search is case-insensitive and supports typo-tolerant matching.
  /// Exact substring matches are ranked first, followed by fuzzy matches
  /// based on Levenshtein distance.
  ///
  /// A fuzzy match is accepted when its edit distance is within 40% of the
  /// query length. This allows common spelling mistakes, character
  /// substitutions, insertions, and deletions.
  ///
  /// Queries shorter than two characters return no results.
  ///
  /// Results are ordered from the closest match to the least similar match
  /// and limited to [limit] results.
  static List<SearchResult<dynamic>> search(String query, {int limit = 10}) {
    final q = query.trim();

    if (q.length < 2 || limit <= 0) return [];

    final scored = <({double score, SearchResult<dynamic> result})>[];

    void collect<T>(
      List<T> items,
      SearchType type,
      String Function(T item) nameOf,
    ) {
      for (final item in items) {
        final score = _fuzzyScore(q, nameOf(item));

        if (score != null) {
          scored.add((
            score: score,
            result: SearchResult(type: type, item: item),
          ));
        }
      }
    }

    collect(_counties, SearchType.county, (item) => item.name);
    collect(_wards, SearchType.ward, (item) => item.name);
    collect(_localities, SearchType.locality, (item) => item.name);
    collect(_areas, SearchType.area, (item) => item.name);

    scored.sort((a, b) => a.score.compareTo(b.score));

    return scored.take(limit).map((entry) => entry.result).toList();
  }
}

/// Calculates a fuzzy match score between [pattern] and [text].
///
/// Returns `0` for an exact substring match. Otherwise, compares the pattern
/// against windows of [text] using Levenshtein distance.
///
/// A lower score indicates a better match. Returns `null` when the text does
/// not fall within the allowed typo tolerance.
double? _fuzzyScore(String pattern, String text) {
  final p = pattern.toLowerCase();
  final t = text.toLowerCase();

  if (t.contains(p)) return 0;
  if (p.length < 2 || t.isEmpty) return null;

  final maxErrors = math.max(1, (p.length * 0.4).floor());
  final windowSize = p.length + maxErrors;
  var best = double.infinity;

  for (var start = 0; start < t.length; start++) {
    final end = math.min(start + windowSize, t.length);
    final window = t.substring(start, end);
    final distance = _levenshtein(p, window);

    if (distance <= maxErrors) {
      final score = distance / p.length;

      if (score < best) {
        best = score;
      }
    }

    if (best == 0) break;
  }

  return best <= 0.4 ? best : null;
}

/// Calculates the Levenshtein distance between two strings.
///
/// The distance represents the minimum number of insertions, deletions, and
/// substitutions required to transform [s] into [t].
int _levenshtein(String s, String t) {
  if (s.isEmpty) return t.length;
  if (t.isEmpty) return s.length;

  final dp = List<int>.generate(t.length + 1, (i) => i);

  for (var i = 1; i <= s.length; i++) {
    var previous = dp[0];
    dp[0] = i;

    for (var j = 1; j <= t.length; j++) {
      final current = dp[j];

      dp[j] = s[i - 1] == t[j - 1]
          ? previous
          : 1 + math.min(previous, math.min(dp[j], dp[j - 1]));

      previous = current;
    }
  }

  return dp[t.length];
}
