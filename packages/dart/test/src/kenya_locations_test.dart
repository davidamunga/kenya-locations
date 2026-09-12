import 'package:kenya_locations/kenya_locations.dart';
import 'package:test/test.dart';

void main() {
  group('KenyaLocations', () {
    test('loads all 47 counties', () {
      expect(KenyaLocations.getCounties().length, 47);
    });

    test('finds Nairobi by name', () {
      final nairobi = KenyaLocations.getCountyByName('Nairobi');

      expect(nairobi?.capital, 'Nairobi');
    });

    test('finds Nairobi by code', () {
      final nairobi = KenyaLocations.getCountyByCode('047');

      expect(nairobi?.name, 'Nairobi');
    });

    test('returns null for an unknown county name', () {
      final county = KenyaLocations.getCountyByName('Unknown County');

      expect(county, isNull);
    });

    test('returns null for an unknown county code', () {
      final county = KenyaLocations.getCountyByCode('999');

      expect(county, isNull);
    });

    test('loads sub-counties', () {
      final subCounties = KenyaLocations.getSubCounties();

      expect(subCounties, isNotEmpty);
    });

    test('loads constituencies', () {
      final constituencies = KenyaLocations.getConstituencies();

      expect(constituencies, isNotEmpty);
    });

    test('loads wards', () {
      final wards = KenyaLocations.getWards();

      expect(wards, isNotEmpty);
    });

    test('loads localities', () {
      final localities = KenyaLocations.getLocalities();

      expect(localities, isNotEmpty);
    });

    test('loads areas', () {
      final areas = KenyaLocations.getAreas();

      expect(areas, isNotEmpty);
    });

    test('finds constituencies in Nairobi County', () {
      final constituencies = KenyaLocations.getConstituenciesInCounty(
        'Nairobi',
      );

      expect(constituencies, isNotEmpty);
      expect(constituencies.every((item) => item.county == 'Nairobi'), isTrue);
    });

    test('finds wards in a constituency', () {
      final wards = KenyaLocations.getWardsInConstituency('Westlands');

      expect(wards, isNotEmpty);
      expect(wards.every((item) => item.constituency == 'Westlands'), isTrue);
    });

    test('finds localities in a county', () {
      final localities = KenyaLocations.getLocalitiesInCounty('Nairobi');

      expect(localities, isNotEmpty);
      expect(localities.every((item) => item.county == 'Nairobi'), isTrue);
    });

    test('finds areas in a locality', () {
      final areas = KenyaLocations.getAreasInLocality('Westlands');

      expect(areas, isNotEmpty);
      expect(areas.every((item) => item.locality == 'Westlands'), isTrue);
    });

    test('search finds an exact county match', () {
      final results = KenyaLocations.search('Nairobi');

      expect(results, isNotEmpty);
      expect(results.first.type, SearchType.county);
      expect(results.first.item, isA<County>());
      expect((results.first.item as County).name, 'Nairobi');
    });

    test('search is case-insensitive', () {
      final results = KenyaLocations.search('NAIROBI');

      expect(results, isNotEmpty);
      expect(
        results.any(
          (result) =>
              result.type == SearchType.county &&
              (result.item as County).name == 'Nairobi',
        ),
        isTrue,
      );
    });

    test('search matches substrings', () {
      final results = KenyaLocations.search('Nairo');

      expect(results, isNotEmpty);
      expect(
        results.any(
          (result) =>
              result.type == SearchType.county &&
              (result.item as County).name == 'Nairobi',
        ),
        isTrue,
      );
    });

    test('search tolerates spelling mistakes', () {
      final results = KenyaLocations.search('Nairob');

      expect(results, isNotEmpty);
      expect(
        results.any(
          (result) =>
              result.type == SearchType.county &&
              (result.item as County).name == 'Nairobi',
        ),
        isTrue,
      );
    });

    test('search returns fuzzy matches for typos', () {
      final results = KenyaLocations.search('Mombassa');

      expect(results, isNotEmpty);
      expect(
        results.any(
          (result) =>
              result.type == SearchType.county &&
              (result.item as County).name == 'Mombasa',
        ),
        isTrue,
      );
    });

    test('searches across supported location types', () {
      expect(
        KenyaLocations.search(
          'Nairobi',
          limit: 1000,
        ).any((result) => result.type == SearchType.county),
        isTrue,
      );
      expect(
        KenyaLocations.search(
          'Alego Usonga',
          limit: 1000,
        ).any((result) => result.type == SearchType.constituency),
        isTrue,
      );
      expect(
        KenyaLocations.search(
          'Bomet Central',
          limit: 1000,
        ).any((result) => result.type == SearchType.subCounty),
        isTrue,
      );
      expect(
        KenyaLocations.search(
          KenyaLocations.getWards().first.name,
          limit: 1000,
        ).any((result) => result.type == SearchType.ward),
        isTrue,
      );
      expect(
        KenyaLocations.search(
          KenyaLocations.getLocalities().first.name,
          limit: 1000,
        ).any((result) => result.type == SearchType.locality),
        isTrue,
      );
      expect(
        KenyaLocations.search(
          KenyaLocations.getAreas().first.name,
          limit: 1000,
        ).any((result) => result.type == SearchType.area),
        isTrue,
      );
    });

    test('searchByType restricts results to one type', () {
      final results = KenyaLocations.searchByType('Nairobi', SearchType.county);

      expect(results, isNotEmpty);
      expect(
        results.every((result) => result.type == SearchType.county),
        isTrue,
      );
    });

    test('search result exposes a display name', () {
      final results = KenyaLocations.search('Nairobi');

      expect(results, isNotEmpty);
      expect(results.first.name, 'Nairobi');
    });

    test('search respects the result limit', () {
      final results = KenyaLocations.search('West', limit: 5);

      expect(results.length, 5);
    });

    test('resolves a unique ward name to its constituency', () {
      final constituency = KenyaLocations.getConstituencyOfWard(
        'Mountain view',
      );

      expect(constituency?.name, 'Westlands');
    });

    test('resolves a ward by administrative code', () {
      final constituency = KenyaLocations.getConstituencyOfWard('1370');

      expect(constituency?.name, 'Westlands');
    });

    test('returns null when a ward name is used more than once', () {
      expect(KenyaLocations.getConstituencyOfWard('Township'), isNull);
    });

    test('resolves a colliding ward name via its code', () {
      final constituency = KenyaLocations.getConstituencyOfWard('0133');

      expect(constituency?.name, 'Garissa Township');
    });

    test('returns null for an unknown ward', () {
      expect(KenyaLocations.getConstituencyOfWard('Unknown Ward'), isNull);
    });

    test(
      'search returns empty results for a query shorter than two characters',
      () {
        final results = KenyaLocations.search('a');

        expect(results, isEmpty);
      },
    );

    test('search returns empty results for an unknown location', () {
      final results = KenyaLocations.search('zzzzzzzz');

      expect(results, isEmpty);
    });

    test('search returns empty results for a zero limit', () {
      final results = KenyaLocations.search('Nairobi', limit: 0);

      expect(results, isEmpty);
    });

    test('search ranks exact substring matches before fuzzy matches', () {
      final results = KenyaLocations.search('Nairobi');

      expect(results, isNotEmpty);
      expect(results.first.type, SearchType.county);
      expect((results.first.item as County).name, 'Nairobi');
    });
  });
}
