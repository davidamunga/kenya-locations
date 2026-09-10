# kenya_locations

Kenyan administrative divisions — counties, sub-counties, constituencies,
wards, localities, and areas — as a fast, fully-typed Dart/Flutter library.

**47** counties · **307** sub-counties · **290** constituencies ·
**1,448** wards · **916** localities · **1,829** areas

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
  kenya_locations: ^0.1.0+1
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
```

### Resolving upward

```dart
final constituency = KenyaLocations.getConstituencyOfWard('Mountain View');
print(constituency?.name); // Westlands
```

### Search

Search is case-insensitive and typo-tolerant, matching common misspellings
and character substitutions via Levenshtein distance.

```dart
final results = KenyaLocations.search('Nairob', limit: 10);

for (final result in results) {
switch (result.type) {
case SearchType.county:
final county = result.item as County;
print(county.capital);
case SearchType.ward:
final ward = result.item as Ward;
print(ward.constituency);
case SearchType.area:
final area = result.item as Area;
print(area.locality);
default:
break;
}
}
```

## Data model

```
County (47)
├── code, name, capital, areaKm2, population2019, region, postalCode
├── Locality → Area          (informal addressing: estates, neighbourhoods)
│   916 localities · 1,829 areas
└── Constituency → Ward      (electoral / administrative)
    290 constituencies · 1,448 wards
    └── SubCounty (307)
```

| Type          | Fields                                                             |
| ------------- | ------------------------------------------------------------------ |
| `County`      | `code`, `name`, `capital`, `areaKm2`, `population2019`, `region`, `postalCode` |
| `SubCounty`   | `code`, `name`, `county`                                            |
| `Constituency`| `code`, `name`, `county`                                            |
| `Ward`        | `code`, `name`, `constituency`                                      |
| `Locality`    | `name`, `county`                                                    |
| `Area`        | `name`, `locality`, `county`                                        |

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
| `getConstituencyOfWard(wardName)`                 | `Constituency?`        |
| `getWards()`                                      | `List<Ward>`           |
| `getWardsInConstituency(constituencyName)`        | `List<Ward>`           |
| `getLocalities()`                                 | `List<Locality>`       |
| `getLocalitiesInCounty(countyName)`               | `List<Locality>`       |
| `getAreas()`                                      | `List<Area>`           |
| `getAreasInLocality(localityName)`                | `List<Area>`           |
| `search(query, {limit = 10})`                     | `List<SearchResult>`   |

All county/constituency/ward/locality-name lookups are case-insensitive.

## Example

A full Flutter example — a county → constituency → ward picker plus a
fuzzy-search screen — lives in
[`example/`](https://github.com/davidamunga/kenya-locations/tree/main/examples/flutter).

## Contributing

Data corrections and additions (new localities, areas, boundary fixes)
belong in the shared `data/` JSON files at the root of the
[kenya-locations](https://github.com/davidamunga/kenya-locations) monorepo —
this package is generated from that data, so edits there flow through to
every language binding. See the main repo's
[CONTRIBUTING](https://github.com/davidamunga/kenya-locations/blob/main/packages/js/CONTRIBUTING.md)
guide.

## License

MIT © [David Amunga](https://davidamunga.com)

Data sourced from the Independent Electoral and Boundaries Commission (IEBC)
and Kenya National Bureau of Statistics (KNBS).