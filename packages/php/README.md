# kenya-locations (PHP)

Kenyan administrative divisions — counties, sub-counties, constituencies,
wards, localities, and areas — as a typed PHP 8.2+ Composer library.

**47** counties · **307** sub-counties · **290** constituencies ·
**1,448** wards · **916** localities · **1,829** areas

JSON is loaded lazily from the shared `data/` files and cached for the
process lifetime. No framework or service container is required.

This is the PHP counterpart to the JavaScript, React, Kotlin, Swift, and
Dart libraries in the same
[kenya-locations](https://github.com/davidamunga/kenya-locations) project,
all sourced from the same underlying dataset.

## Installation

```bash
composer require davidamunga/kenya-locations
```

## Usage

```php
use KenyaLocations\KenyaLocations;
use KenyaLocations\SearchType;

$counties = KenyaLocations::getCounties();

$nairobi = KenyaLocations::getCountyByName('Nairobi');
echo $nairobi?->capital;          // Nairobi
echo $nairobi?->population2019;   // 4397073
echo $nairobi?->region;           // Nairobi
```

### Drilling down

```php
$constituencies = KenyaLocations::getConstituenciesInCounty('Nairobi');

$wards = KenyaLocations::getWardsInConstituency('Westlands');

$localities = KenyaLocations::getLocalitiesInCounty('Nairobi');

$areas = KenyaLocations::getAreasInLocality('Karen');
```

### Resolving upward

```php
$constituency = KenyaLocations::getConstituencyOfWard('Mountain view');
echo $constituency?->name; // Westlands

// Prefer a ward code when the name is reused (e.g. Township)
$byCode = KenyaLocations::getConstituencyOfWard('1370');

KenyaLocations::getCountyOfWard('1370');
KenyaLocations::getCountyOfConstituency('Westlands');
KenyaLocations::getLocalityOfArea('Gigiri');

// Same locality name in more than one county
$matches = KenyaLocations::getLocalitiesByName('Westlands');
$nairobiOnly = KenyaLocations::getLocality('Westlands', 'Nairobi');
```

### Search

Search is case-insensitive and typo-tolerant, matching common misspellings
via Levenshtein distance. It covers counties, sub-counties, constituencies,
wards, localities, and areas.

```php
$results = KenyaLocations::search('Nairob', limit: 20);
$wardsOnly = KenyaLocations::searchByType('West', SearchType::Ward);

foreach ($results as $result) {
    echo $result->type->value . ': ' . $result->name() . PHP_EOL;
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

| Type           | Fields                                                                      |
| -------------- | --------------------------------------------------------------------------- |
| `County`       | `code`, `name`, `capital`, `areaKm2`, `population2019`, `region`, `postalCode` |
| `SubCounty`    | `code`, `name`, `county`                                                    |
| `Constituency` | `code`, `name`, `county`                                                    |
| `Ward`         | `code`, `name`, `constituency`                                              |
| `Locality`     | `name`, `county`                                                            |
| `Area`         | `name`, `locality`, `county`                                                |

## API reference

| Method                                           | Returns              |
| ------------------------------------------------ | -------------------- |
| `getCounties()`                                  | `list<County>`       |
| `getCountyByCode(code)`                          | `?County`            |
| `getCountyByName(name)`                          | `?County`            |
| `getSubCounties()`                               | `list<SubCounty>`    |
| `getSubCountyByCode(code)`                       | `?SubCounty`         |
| `getSubCountyByName(name)`                       | `?SubCounty`         |
| `getSubCountiesInCounty(nameOrCode)`             | `list<SubCounty>`    |
| `getCountyOfSubCounty(nameOrCode)`               | `?County`            |
| `getConstituencies()`                            | `list<Constituency>` |
| `getConstituencyByCode(code)`                    | `?Constituency`      |
| `getConstituencyByName(name)`                    | `?Constituency`      |
| `getConstituenciesInCounty(nameOrCode)`          | `list<Constituency>` |
| `getCountyOfConstituency(nameOrCode)`            | `?County`            |
| `getConstituencyOfWard(wardNameOrCode)`          | `?Constituency`      |
| `getWards()`                                     | `list<Ward>`         |
| `getWardByCode(code)`                            | `?Ward`              |
| `getWardByName(name)`                            | `?Ward`              |
| `getWardsInConstituency(nameOrCode)`             | `list<Ward>`         |
| `getWardsInCounty(nameOrCode)`                   | `list<Ward>`         |
| `getWardsInSubCounty(nameOrCode)`                | `list<Ward>`         |
| `getCountyOfWard(wardNameOrCode)`                | `?County`            |
| `getSubCountyOfWard(wardNameOrCode)`             | `?SubCounty`         |
| `getLocalities()`                                | `list<Locality>`     |
| `getLocalityByName(name)`                        | `?Locality`          |
| `getLocality(name, countyName?)`                 | `?Locality`          |
| `getLocalitiesByName(name)`                      | `list<Locality>`     |
| `getLocalitiesInCounty(nameOrCode)`              | `list<Locality>`     |
| `getCountyOfLocality(name)`                      | `?County`            |
| `getAreas()`                                     | `list<Area>`         |
| `getAreaByName(name)`                            | `?Area`              |
| `getAreasByName(name)`                           | `list<Area>`         |
| `getAreasInLocality(localityName)`               | `list<Area>`         |
| `getAreasInCounty(nameOrCode)`                   | `list<Area>`         |
| `getCountyOfArea(name)`                          | `?County`            |
| `getLocalityOfArea(name)`                        | `?Locality`          |
| `search(query, limit: 20, types: null)`          | `list<SearchResult>` |
| `searchByType(query, type, limit: 20)`           | `list<SearchResult>` |

Name lookups are case-insensitive. County, constituency, and sub-county
scoped queries accept a name or an administrative code. Ward upward lookups
return `null` when a name is reused (for example `Township`); use the ward
code in that case.

## Local development

From this directory:

```bash
composer install
composer test
```

The package ships a copy of the monorepo `data/*.json` files in `data/` so a
Packagist install is self-contained. After editing the shared JSON at the
repo root, refresh that copy:

```bash
composer copy-data
```

CI fails if the copy is stale. Runtime also falls back to the monorepo
`data/` directory, so local tests work even before you copy. No codegen
step is required.

## Contributing

Data corrections and additions belong in the shared `data/` JSON files at the
root of the
[kenya-locations](https://github.com/davidamunga/kenya-locations) monorepo.
See the main repo's
[CONTRIBUTING](https://github.com/davidamunga/kenya-locations/blob/main/packages/js/CONTRIBUTING.md)
guide.

## License

MIT © [David Amunga](https://davidamunga.com)

Data sourced from the Independent Electoral and Boundaries Commission (IEBC)
and Kenya National Bureau of Statistics (KNBS).
