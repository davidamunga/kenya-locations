# kenya_locations

Kenyan administrative divisions — counties, sub-counties, constituencies,
wards, localities, and areas — as a fast, fully-typed Dart/Flutter library.

**47** counties · **307** sub-counties · **290** constituencies ·
**1,450** wards · **917** localities · **1,827** areas

Data is compiled directly into the package as Dart constants, so there's no
asset loading, no `async` setup, and no bundling JSON in your app — just
import and call.

This is the Dart/Flutter counterpart to the JavaScript, React, Kotlin, and
Swift libraries in the same
[kenya-locations](https://github.com/davidamunga/kenya-locations) project,
all sourced from the same underlying dataset.

## Installation

```yaml
dependencies:
  kenya_locations: ^0.1.1
```

```bash
flutter pub add kenya_locations
```

## Usage

No initialization required — call `KenyaLocations` directly.

```dart
import 'package:kenya_locations/kenya_locations.dart';

// All 47 counties
final counties = KenyaLocations.getCounties();

final nairobi = KenyaLocations.getCountyByName('Nairobi');
print(nairobi?.capital);          // Nairobi
print(nairobi?.population2019);   // 4397073
print(nairobi?.region);           // Nairobi
```

### Drilling down

```dart
final constituencies = KenyaLocations.getConstituenciesInCounty('Nairobi');

final wards = KenyaLocations.getWardsInConstituency('Westlands');

final localities = KenyaLocations.getLocalitiesInCounty('Nairobi');

final areas = KenyaLocations.getAreasInLocality('Karen');

// Some locality names exist in more than one county; pass the county
final bura = KenyaLocations.getAreasInLocality('Bura', county: 'Tana River');
```

### Resolving upward

```dart
final constituency = KenyaLocations.getConstituencyOfWard('Mountain view');
print(constituency?.name); // Westlands

// Prefer a ward code when the name is reused (e.g. Township)
final byCode = KenyaLocations.getConstituencyOfWard('1370');
```

### Search

Search is case-insensitive and typo-tolerant, matching common misspellings
and character substitutions via Levenshtein distance. It covers counties,
sub-counties, constituencies, wards, localities, and areas.

```dart
final results = KenyaLocations.search('Nairob', limit: 20);
final wardsOnly = KenyaLocations.searchByType('West', SearchType.ward);

for (final result in results) {
  print('${result.type.name}: ${result.name}');
}
```

## Data model

```
County (47)
├── code, isoCode, name, capital, areaKm2, population2019, region,
│   postalCode, aliases
├── Locality → Area          (informal addressing: estates, neighbourhoods)
│   917 localities · 1,827 areas
└── Constituency → Ward      (electoral / administrative)
    290 constituencies · 1,450 wards
    └── SubCounty (307)
```

| Type           | Fields                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------ |
| `County`       | `code`, `isoCode`, `name`, `capital`, `areaKm2`, `population2019`, `region`, `postalCode`, `aliases` |
| `SubCounty`    | `code`, `name`, `county`, `countyCode`                                                     |
| `Constituency` | `code`, `name`, `county`, `countyCode`                                                     |
| `Ward`         | `code`, `name`, `constituency`, `constituencyCode`, `countyCode`                           |
| `Locality`     | `name`, `county`, `countyCode`                                                             |
| `Area`         | `name`, `locality`, `county`, `countyCode`                                                 |

`code` is the IEBC county code (`047` for Nairobi); `isoCode` is the ISO
3166-2 code (`KE-30`), which numbers counties alphabetically. `countyCode`
and `constituencyCode` are the parent's code, and every relationship lookup
joins on them rather than on names. `aliases` lists other names for a county
(`Nairobi City`) and may be empty.

## API reference

| Method                                          | Returns              |
| ------------------------------------------------ | --------------------- |
| `getCounties()`                                   | `List<County>`         |
| `getCountyByCode(code)`                           | `County?`              |
| `getCountyByName(name)`                           | `County?`              |
| `getSubCounties()`                                | `List<SubCounty>`      |
| `getSubCountiesInCounty(countyName)`              | `List<SubCounty>`      |
| `getConstituencies()`                             | `List<Constituency>`   |
| `getConstituenciesInCounty(countyName)`           | `List<Constituency>`   |
| `getConstituencyOfWard(wardNameOrCode)`           | `Constituency?`        |
| `getWards()`                                      | `List<Ward>`           |
| `getWardsInConstituency(constituencyName)`        | `List<Ward>`           |
| `getLocalities()`                                 | `List<Locality>`       |
| `getLocalitiesInCounty(countyName)`               | `List<Locality>`       |
| `getAreas()`                                      | `List<Area>`           |
| `getAreasInLocality(localityName, {county})`      | `List<Area>`           |
| `search(query, {limit = 20, types})`              | `List<SearchResult>`   |
| `searchByType(query, type, {limit = 20})`         | `List<SearchResult>`   |

All county/constituency/ward/locality-name lookups are case-insensitive. If
nothing matches exactly, accents, spaces and punctuation are ignored
(`Muranga` finds `Murang'a`). County names also match a county's aliases
(`Nairobi City` finds Nairobi). County and constituency arguments also accept a
code, and numeric codes are zero-padded (`47` finds Nairobi). A name shared by
several records (for example the ward `Township`) resolves to `null`, or an
empty list for `getAreasInLocality` without a `county`.

## Example

A full Flutter example — a county → constituency → ward picker plus a
fuzzy-search screen — lives in
[`examples/flutter`](https://github.com/davidamunga/kenya-locations/tree/main/examples/flutter).

## Contributing

Data corrections and additions (new localities, areas, boundary fixes)
belong in the shared `data/` JSON files at the root of the
[kenya-locations](https://github.com/davidamunga/kenya-locations) monorepo —
this package is generated from that data, so edits there flow through to
every language binding. See the main repo's
[CONTRIBUTING](https://github.com/davidamunga/kenya-locations/blob/main/packages/js/CONTRIBUTING.md)
guide.

After changing `data/*.json`, regenerate the Dart constants from the
monorepo root:

```bash
dart run packages/dart/scripts/generate_data.dart
```

## License

MIT © [David Amunga](https://davidamunga.com)

Data sourced from the Independent Electoral and Boundaries Commission (IEBC)
and Kenya National Bureau of Statistics (KNBS).