import 'package:kenya_locations/kenya_locations.dart';
import 'package:test/test.dart';

void main() {
  group('code normalisation', () {
    test('zero-pads county codes', () {
      expect(KenyaLocations.getCountyByCode('47')?.name, 'Nairobi');
      expect(KenyaLocations.getCountyByCode(' 047 ')?.name, 'Nairobi');
    });

    test('zero-pads ward codes', () {
      expect(
        KenyaLocations.getConstituencyOfWard('133')?.name,
        'Garissa Township',
      );
    });

    test('zero-pads constituency codes', () {
      final code = KenyaLocations.getConstituencies()
          .firstWhere((c) => c.name == 'Westlands')
          .code;
      final unpadded = int.parse(code).toString();

      expect(KenyaLocations.getWardsInConstituency(unpadded).length, 5);
    });
  });

  group('name matching', () {
    test('county names are case-insensitive and trimmed', () {
      expect(KenyaLocations.getCountyByName('  nairobi ')?.code, '047');
    });

    test('falls back to a folded match', () {
      expect(KenyaLocations.getCountyByName('Muranga')?.name, "Murang'a");
      expect(
        KenyaLocations.getCountyByName('Elgeyo Marakwet')?.name,
        'Elgeyo-Marakwet',
      );
      expect(KenyaLocations.getCountyByName('homabay')?.name, 'Homa Bay');
      expect(KenyaLocations.getCountyByName('Nyerí')?.name, 'Nyeri');
    });

    test('an exact match wins over a folded match', () {
      expect(KenyaLocations.getConstituencyOfWard('Iriaini')?.name, 'Mathira');
      expect(KenyaLocations.getConstituencyOfWard('Iria-ini')?.name, 'Othaya');
    });
  });

  group('ambiguous names', () {
    test('a ward name shared by several wards resolves to null', () {
      expect(
        KenyaLocations.getWards().where((w) => w.name == 'Township').length,
        9,
      );
      expect(KenyaLocations.getConstituencyOfWard('township'), isNull);
    });

    test('an ambiguous locality name without a county lists no areas', () {
      expect(KenyaLocations.getAreasInLocality('Bura'), isEmpty);
      expect(KenyaLocations.getAreasInLocality('Makadara'), isEmpty);
    });
  });

  group('county and constituency arguments', () {
    test('accept a name in any case or a code', () {
      final constituencies = KenyaLocations.getConstituenciesInCounty(
        'Nairobi',
      );
      final subCounties = KenyaLocations.getSubCountiesInCounty('Nairobi');

      expect(constituencies, isNotEmpty);
      expect(subCounties, isNotEmpty);

      for (final county in ['nairobi', 'Nairobi', 'NAIROBI', '047', '47']) {
        expect(
          KenyaLocations.getLocalitiesInCounty(county).length,
          77,
          reason: county,
        );
        expect(
          KenyaLocations.getConstituenciesInCounty(county),
          constituencies,
          reason: county,
        );
        expect(
          KenyaLocations.getSubCountiesInCounty(county),
          subCounties,
          reason: county,
        );
      }
    });

    test('accept a folded county name', () {
      final expected = KenyaLocations.getConstituenciesInCounty("Murang'a");

      expect(expected, isNotEmpty);
      expect(KenyaLocations.getConstituenciesInCounty('Muranga'), expected);
    });

    test('wards in a constituency accept any case', () {
      expect(KenyaLocations.getWardsInConstituency('westlands').length, 5);
    });

    test('unknown county or constituency returns an empty list', () {
      expect(KenyaLocations.getLocalitiesInCounty('Atlantis'), isEmpty);
      expect(KenyaLocations.getWardsInConstituency('Atlantis'), isEmpty);
    });
  });

  group('areas in a locality', () {
    test('are scoped by county', () {
      final garissa = KenyaLocations.getAreasInLocality(
        'Bura',
        county: 'Garissa',
      );
      expect(garissa.length, 3);
      expect(garissa.every((a) => a.county == 'Garissa'), isTrue);

      final tanaRiver = KenyaLocations.getAreasInLocality(
        'Bura',
        county: 'tana river',
      );
      expect(tanaRiver.length, 2);
      expect(tanaRiver.every((a) => a.county == 'Tana River'), isTrue);
    });

    test('county may be a code', () {
      final code = KenyaLocations.getCountyByName('Garissa')!.code;
      final unpadded = int.parse(code).toString();

      expect(
        KenyaLocations.getAreasInLocality('Bura', county: unpadded).length,
        3,
      );
    });

    test('Kisumu Kaloleni has its own areas', () {
      final areas = KenyaLocations.getAreasInLocality(
        'Kaloleni',
        county: 'Kisumu',
      );

      expect(areas.length, 2);
      expect(
        areas.every((a) => a.county == 'Kisumu' && a.locality == 'Kaloleni'),
        isTrue,
      );
    });

    test('a locality missing from the given county returns no areas', () {
      expect(
        KenyaLocations.getAreasInLocality('Bura', county: 'Nairobi'),
        isEmpty,
      );
      expect(
        KenyaLocations.getAreasInLocality('Bura', county: 'Atlantis'),
        isEmpty,
      );
    });

    test('a unique locality name works without a county', () {
      expect(KenyaLocations.getAreasInLocality('Westlands'), isNotEmpty);
      expect(KenyaLocations.getAreasInLocality('westlands'), isNotEmpty);
    });
  });
}
