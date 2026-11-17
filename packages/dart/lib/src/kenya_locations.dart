import 'dart:math' as math;

import 'package:kenya_locations/src/lookup.dart';
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

  static const _countyCodeWidth = 3;
  static const _constituencyCodeWidth = 3;
  static const _wardCodeWidth = 4;

  static final Map<String, County> _countyByCode = {
    for (final c in _counties) c.code: c,
  };
  static final _countyNames = NameIndex<County>(
    _counties,
    (c) => c.name,
    aliasesOf: (c) => c.aliases,
  );

  static final Map<String, Constituency> _constituencyByCode = {
    for (final c in _constituencies) c.code: c,
  };
  static final _constituencyNames = NameIndex<Constituency>(
    _constituencies,
    (c) => c.name,
  );

  static final Map<String, Ward> _wardByCode = {
    for (final w in _wards) w.code: w,
  };
  static final _wardNames = NameIndex<Ward>(_wards, (w) => w.name);

  static final Map<String, List<SubCounty>> _subCountiesByCounty = groupBy(
    _subCounties,
    (s) => s.countyCode,
  );
  static final Map<String, List<Constituency>> _constituenciesByCounty =
      groupBy(_constituencies, (c) => c.countyCode);
  static final Map<String, List<Ward>> _wardsByConstituency = groupBy(
    _wards,
    (w) => w.constituencyCode,
  );
  static final Map<String, List<Locality>> _localitiesByCounty = groupBy(
    _localities,
    (l) => l.countyCode,
  );
  static final _localityNames = NameIndex<Locality>(_localities, (l) => l.name);
  static final Map<String, List<Area>> _areasByLocality = groupBy(
    _areas,
    (a) => _localityKey(a.countyCode, a.locality),
  );

  static String _localityKey(String countyCode, String locality) =>
      '$countyCode|${lowerName(locality)}';

  /// Resolves a county from its name or code.
  static County? _resolveCounty(String nameOrCode) =>
      getCountyByCode(nameOrCode) ?? _countyNames.unique(nameOrCode);

  /// Resolves a constituency from its name or code.
  static Constituency? _resolveConstituency(String nameOrCode) =>
      _constituencyByCode[normalizeCode(nameOrCode, _constituencyCodeWidth)] ??
      _constituencyNames.unique(nameOrCode);

  /// Returns the records grouped under the county's code, or an empty list if
  /// [countyNameOrCode] does not resolve to a county.
  static List<T> _inCounty<T>(
    Map<String, List<T>> byCounty,
    String countyNameOrCode,
  ) {
    final county = _resolveCounty(countyNameOrCode);
    if (county == null) return [];
    return List.of(byCounty[county.code] ?? const []);
  }

  /// Returns all counties in Kenya.
  static List<County> getCounties() => _counties;

  /// Returns the county with the given administrative code.
  ///
  /// County codes are three-digit strings, for example `047` for Nairobi
  /// County. All-digit input is zero-padded, so `47` also finds Nairobi.
  ///
  /// Returns `null` if no county matches the [code].
  static County? getCountyByCode(String code) =>
      _countyByCode[normalizeCode(code, _countyCodeWidth)];

  /// Returns the county with the given name.
  ///
  /// The comparison is case-insensitive. If nothing matches exactly, accents,
  /// spaces and punctuation are ignored, so `Muranga` finds `Murang'a`.
  /// Returns `null` if no county matches the [name].
  static County? getCountyByName(String name) => _countyNames.unique(name);

  /// Returns all sub-counties in Kenya.
  static List<SubCounty> getSubCounties() => _subCounties;

  /// Returns all sub-counties belonging to the given county.
  ///
  /// [countyName] may be a county name (matched as in [getCountyByName]) or
  /// a county code (as in [getCountyByCode]).
  static List<SubCounty> getSubCountiesInCounty(String countyName) =>
      _inCounty(_subCountiesByCounty, countyName);

  /// Returns all constituencies in Kenya.
  static List<Constituency> getConstituencies() => _constituencies;

  /// Returns all constituencies belonging to the given county.
  ///
  /// [countyName] may be a county name (matched as in [getCountyByName]) or
  /// a county code (as in [getCountyByCode]).
  static List<Constituency> getConstituenciesInCounty(String countyName) =>
      _inCounty(_constituenciesByCounty, countyName);

  /// Returns all wards in Kenya.
  static List<Ward> getWards() => _wards;

  /// Returns all wards belonging to the given constituency.
  ///
  /// [constituencyName] may be a constituency name (case-insensitive, with
  /// the same loose fallback as [getCountyByName]) or a constituency code.
  /// Returns an empty list if the constituency cannot be found.
  static List<Ward> getWardsInConstituency(String constituencyName) {
    final constituency = _resolveConstituency(constituencyName);
    if (constituency == null) return [];
    return List.of(_wardsByConstituency[constituency.code] ?? const []);
  }

  /// Returns the constituency containing the given ward.
  ///
  /// [wardNameOrCode] may be a ward administrative code (all-digit input is
  /// zero-padded to four digits) or a ward name (matched as in
  /// [getCountyByName]). Codes win when both a code and a name could match.
  ///
  /// Returns `null` if the ward cannot be found, the name is used by more
  /// than one ward (for example `Township`), or the parent constituency
  /// cannot be found.
  static Constituency? getConstituencyOfWard(String wardNameOrCode) {
    if (wardNameOrCode.trim().isEmpty) return null;

    final ward =
        _wardByCode[normalizeCode(wardNameOrCode, _wardCodeWidth)] ??
        _wardNames.unique(wardNameOrCode);
    if (ward == null) return null;

    return _constituencyByCode[ward.constituencyCode];
  }

  /// Returns all localities in Kenya.
  static List<Locality> getLocalities() => _localities;

  /// Returns all localities belonging to the given county.
  ///
  /// [countyName] may be a county name (matched as in [getCountyByName]) or
  /// a county code (as in [getCountyByCode]).
  static List<Locality> getLocalitiesInCounty(String countyName) =>
      _inCounty(_localitiesByCounty, countyName);

  /// Returns all areas in Kenya.
  static List<Area> getAreas() => _areas;

  /// Returns all areas belonging to the given locality.
  ///
  /// The same locality name can exist in more than one county (for example
  /// `Bura`), so pass [county] (a name or code) to pick one. Without
  /// [county] the locality name must be unique across Kenya; an ambiguous
  /// name returns an empty list.
  ///
  /// Locality names are matched as in [getCountyByName].
  static List<Area> getAreasInLocality(String localityName, {String? county}) {
    var matches = _localityNames.all(localityName);
    if (county != null) {
      final resolved = _resolveCounty(county);
      if (resolved == null) return [];
      matches = matches.where((l) => l.countyCode == resolved.code).toList();
    }
    if (matches.length != 1) return [];

    final locality = matches.single;
    return List.of(
      _areasByLocality[_localityKey(locality.countyCode, locality.name)] ??
          const [],
    );
  }

  /// Searches across counties, sub-counties, constituencies, wards,
  /// localities, and areas.
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
  /// and limited to [limit] results. Pass [types] to restrict which entity
  /// kinds are searched.
  static List<SearchResult<dynamic>> search(
    String query, {
    int limit = 20,
    List<SearchType>? types,
  }) {
    final q = query.trim();

    if (q.length < 2 || limit <= 0) return [];

    final allowed = types?.toSet();
    final scored = <({double score, SearchResult<dynamic> result})>[];

    void collect<T>(
      List<T> items,
      SearchType type,
      String Function(T item) nameOf,
    ) {
      if (allowed != null && !allowed.contains(type)) return;

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
    collect(_subCounties, SearchType.subCounty, (item) => item.name);
    collect(_constituencies, SearchType.constituency, (item) => item.name);
    collect(_wards, SearchType.ward, (item) => item.name);
    collect(_localities, SearchType.locality, (item) => item.name);
    collect(_areas, SearchType.area, (item) => item.name);

    scored.sort((a, b) => a.score.compareTo(b.score));

    return scored.take(limit).map((entry) => entry.result).toList();
  }

  /// Searches a single location type. See [search].
  static List<SearchResult<dynamic>> searchByType(
    String query,
    SearchType type, {
    int limit = 20,
  }) => search(query, limit: limit, types: [type]);
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
