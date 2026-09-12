# Kenya Locations

[![npm version](https://img.shields.io/npm/v/kenya-locations.svg)](https://www.npmjs.com/package/kenya-locations)
[![npm version](https://img.shields.io/npm/v/kenya-locations-react.svg?label=kenya-locations-react)](https://www.npmjs.com/package/kenya-locations-react)
[![Maven Central](https://img.shields.io/maven-central/v/io.github.davidamunga/kenya-locations.svg)](https://central.sonatype.com/artifact/io.github.davidamunga/kenya-locations)
[![pub.dev](https://img.shields.io/pub/v/kenya_locations.svg)](https://pub.dev/packages/kenya_locations)
[![CI](https://github.com/DavidAmunga/kenya-locations/actions/workflows/ci.yml/badge.svg)](https://github.com/DavidAmunga/kenya-locations/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Kenyan administrative divisions — counties, sub-counties, constituencies, wards, localities, and areas — packaged as a fast, well-typed library for JavaScript/TypeScript, React, Kotlin/JVM, Swift, and Dart/Flutter.

**47** counties · **307** sub-counties · **290** constituencies · **1,448** wards · **916** localities · **1,829** areas

---

## Packages

| Platform | Package | Install |
|---|---|---|
| **JavaScript / TypeScript** | [`kenya-locations`](https://www.npmjs.com/package/kenya-locations) | `npm install kenya-locations` |
| **React** | [`kenya-locations-react`](https://www.npmjs.com/package/kenya-locations-react) | `npm install kenya-locations-react` |
| **Kotlin / JVM** (Android, Spring Boot, etc.) | [`io.github.davidamunga:kenya-locations`](https://central.sonatype.com/artifact/io.github.davidamunga/kenya-locations) | See below |
| **Swift** (iOS, macOS, tvOS, watchOS) | [`KenyaLocations`](https://swiftpackageindex.com/davidamunga/kenya-locations) | See below |
| **Dart / Flutter** | [`kenya_locations`](https://pub.dev/packages/kenya_locations) | See below |

All packages are built from the same JSON source data and share identical version numbers (except `kenya-locations-react` and `kenya_locations`, which version independently).

---

## Installation

### JavaScript / TypeScript

```bash
npm install kenya-locations
# pnpm add kenya-locations
# yarn add kenya-locations
```

### React

```bash
npm install kenya-locations-react
# peer deps: react >=18, kenya-locations
```

### Kotlin / JVM

```kotlin
// build.gradle.kts
dependencies {
    implementation("io.github.davidamunga:kenya-locations:0.5.4")
}
```

Works on Android, Spring Boot, Ktor, CLI tools, and any JVM project. No Android SDK or special initialisation required — data loads lazily from the JAR classpath on first access.

### Swift (iOS, macOS, tvOS, watchOS)

In Xcode: **File → Add Package Dependencies** and enter `https://github.com/DavidAmunga/kenya-locations`, or add to `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/DavidAmunga/kenya-locations", from: "0.5.0"),
],
targets: [
    .target(
        name: "YourTarget",
        dependencies: [
            .product(name: "KenyaLocations", package: "kenya-locations"),
        ]
    ),
]
```

Requires Swift 5.9+ / iOS 13+ / macOS 10.15+. Data loads lazily from the app bundle on first access.

### Dart / Flutter

```bash
flutter pub add kenya_locations
# dart pub add kenya_locations
```

```yaml
dependencies:
  kenya_locations: ^0.1.1
```

Works in any Dart or Flutter project. No initialisation required — data is compiled into the package as Dart constants and available immediately.

### Example apps

| App | Path | Uses |
| --- | --- | --- |
| Android (Compose) | [`examples/android`](examples/android) | Kotlin library (`packages/kotlin`) |
| Flutter | [`examples/flutter`](examples/flutter) | Dart library (`packages/dart`) |

---

## Quick Start

### JavaScript / TypeScript

```typescript
import {
  getCounties,
  county,
  getConstituenciesInCounty,
  getConstituencyOfWard,
  search,
  DATA_VERSION,
} from "kenya-locations";

// All 47 counties with rich metadata
const counties = getCounties();
console.log(counties[0].capital);       // "Nairobi"
console.log(counties[0].population_2019); // 4397073
console.log(counties[0].region);        // "Nairobi"

// Chainable wrapper API
const nairobi = county("Nairobi");
const westlands = nairobi?.constituency("Westlands");
const wards = westlands?.wards();

// Standalone functions (tree-shakeable)
const cs = getConstituenciesInCounty("Nairobi"); // ConstituencyWrapper[]
const parentCs = getConstituencyOfWard("Mountain View"); // ConstituencyWrapper

// Fuzzy search — typo-tolerant, results sorted by relevance
const results = search("karen", { limit: 10, types: ["locality", "area"] });
```

### React

```tsx
import { useCounty, useConstituenciesInCounty, useSearch } from "kenya-locations-react";

function LocationPicker() {
  const nairobi = useCounty("Nairobi");
  const constituencies = useConstituenciesInCounty("Nairobi");

  const [query, setQuery] = useState("");
  const { results, isPending } = useSearch(query, {
    types: ["constituency", "ward"],
    debounceMs: 300,
  });

  return (/* ... */);
}
```

### Kotlin / JVM

```kotlin
// No init() required — just call directly
val counties   = KenyaLocations.getCounties()
val nairobi    = KenyaLocations.getCountyByName("Nairobi")

println(nairobi?.capital)          // "Nairobi"
println(nairobi?.population_2019)  // 4397073

val wards      = KenyaLocations.getWardsInConstituency("Westlands")
val localities = KenyaLocations.getLocalitiesInCounty("Nairobi")

// Fuzzy search — tolerates typos, sorted by relevance
val results    = KenyaLocations.search("Nairob") // matches "Nairobi"

// Java
List<County> counties = KenyaLocations.INSTANCE.getCounties();
```

### Swift

```swift
import KenyaLocations

let kl = KenyaLocations.shared

let counties = kl.getCounties()
print(counties[0].capital)          // "Nairobi"
print(counties[0].population_2019)  // 4397073

let wards      = kl.getWardsInConstituency("Westlands")
let localities = kl.getLocalitiesInCounty("Nairobi")

// Fuzzy search — tolerates typos, sorted by relevance
let results = kl.search("Nairob", limit: 10) // matches "Nairobi"
```

### Dart / Flutter

```dart
import 'package:kenya_locations/kenya_locations.dart';

final counties = KenyaLocations.getCounties();
final nairobi = KenyaLocations.getCountyByName('Nairobi');

print(nairobi?.capital);          // Nairobi
print(nairobi?.population2019);   // 4397073

final wards = KenyaLocations.getWardsInConstituency('Westlands');
final localities = KenyaLocations.getLocalitiesInCounty('Nairobi');

// Fuzzy search — tolerates typos, sorted by relevance
final results = KenyaLocations.search('Nairob', limit: 20); // matches "Nairobi"
```

---

## Data Hierarchy

```
County (47)
├── Metadata: capital, area_km2, population_2019, region, postal_code
├── Locality → Area          (informal addressing: estates, neighbourhoods)
│   916 localities · 1,829 areas
└── Constituency → Ward      (electoral / administrative)
    290 constituencies · 1,448 wards
    └── Sub-County (307)
```

---

## JavaScript API

### Modules

Import only what you need for optimal tree-shaking:

| Module | Exports |
|---|---|
| `kenya-locations/counties` | `getCounties`, `getCountyByCode`, `getCountyByName`, `county` |
| `kenya-locations/constituencies` | `getConstituencies`, `getConstituencyByCode`, `getConstituencyByName`, `getConstituenciesInCounty` |
| `kenya-locations/wards` | `getWards`, `getWardByCode`, `getWardByName`, `getWardsInCounty`, `getWardsInConstituency`, `getConstituencyOfWard`, `getSubCountyOfWard` |
| `kenya-locations/sub-counties` | `getSubCounties`, `getSubCountiesInCounty`, `getSubCountyByCode`, `getSubCountyByName`, `getWardsInSubCounty` |
| `kenya-locations/localities` | `getLocalities`, `getLocalityByName`, `getLocalitiesByName`, `getLocalitiesInCounty`, `locality` |
| `kenya-locations/areas` | `getAreas`, `getAreaByName`, `getAreasByName`, `getAreasInLocality`, `getAreasInCounty` |
| `kenya-locations/search` | `search`, `searchByType` |
| `kenya-locations/version` | `DATA_VERSION` |

Or import everything from the root entry point:

```typescript
import { getCounties, getConstituenciesInCounty, search, county, DATA_VERSION } from "kenya-locations";
```

### County Metadata

Every `County` object now carries rich KNBS-sourced metadata:

```typescript
import { getCountyByCode, getCounties } from "kenya-locations";

const nairobi = getCountyByCode("047");
console.log(nairobi?.capital);          // "Nairobi"
console.log(nairobi?.area_km2);         // 694.9
console.log(nairobi?.population_2019);  // 4397073
console.log(nairobi?.region);           // "Nairobi"  (former province)
console.log(nairobi?.postal_code);      // "00100"

// Sort by population
const byPop = getCounties().sort((a, b) => b.population_2019 - a.population_2019);
```

### Chainable Wrappers

```typescript
import { county } from "kenya-locations/counties";
import { locality } from "kenya-locations/localities";

// County → drill down
county("Nairobi")?.constituencies();            // ConstituencyWrapper[]
county("Nairobi")?.constituency("Westlands");   // ConstituencyWrapper
county("Nairobi")?.localities();                // LocalityWrapper[]
county("Nairobi")?.locality("Westlands");       // LocalityWrapper
county("Nairobi")?.areas();                     // Area[]
county("047")?.wards();                         // Ward[]

// Constituency → wards
county("Nairobi")?.constituency("Westlands")?.wards();

// Locality → areas
locality("Westlands")?.areas();
locality("Westlands")?.area("Gigiri");
locality("Westlands")?.getCounty();
```

### Upward Traversal

```typescript
import {
  getConstituencyOfWard,
  getSubCountyOfWard,
  getCountyOfWard,
  getCountyOfConstituency,
  getCountyOfLocality,
  getLocalityOfArea,
} from "kenya-locations";

// Resolve a ward's parents
const constituency = getConstituencyOfWard("Mountain View");
// → ConstituencyWrapper { name: "Westlands", county: "Nairobi" }

const subCounty = getSubCountyOfWard("Mountain View");
// → SubCounty { name: "Westlands", county: "Nairobi" }

const county = getCountyOfWard("Mountain View");
// → County { name: "Nairobi", ... }
```

### Search

Search is fuzzy and typo-tolerant on all platforms. The JS package uses **Fuse.js** (Bitap algorithm, `threshold: 0.4`); Kotlin and Swift use the same effective behaviour via a Levenshtein sliding-window implementation.

```typescript
import { search, searchByType } from "kenya-locations/search";

// Fuzzy search all types — "karen" → Karen area, Karen locality, …
const results = search("karen");

// Limit and type-filter
const counties = search("nairobi", { types: ["county"], limit: 5 });
const localities = searchByType("west", "locality", 10);
```

`SearchResult` is a **discriminated union** — TypeScript narrows `item` automatically:

```typescript
import type { SearchResult } from "kenya-locations";

for (const result of search("Westlands")) {
  if (result.type === "county") {
    console.log(result.item.capital);       // County — capital is available
  } else if (result.type === "ward") {
    console.log(result.item.constituency);  // Ward — constituency is available
  } else if (result.type === "area") {
    console.log(result.item.locality);      // Area — locality is available
  }
}
```

### Data Types

```typescript
type CountyRegion =
  | "Nairobi" | "Central" | "Coast" | "Eastern"
  | "North Eastern" | "Nyanza" | "Rift Valley" | "Western";

interface County {
  code: string;
  name: string;
  capital: string;
  area_km2: number;
  population_2019: number;
  region: CountyRegion;
  postal_code: string;
}

interface SubCounty     { code: string; name: string; county: string; }
interface Constituency  { code: string; name: string; county: string; }
interface Ward          { code: string; name: string; constituency: string; }
interface Locality      { name: string; county: string; }
interface Area          { name: string; locality: string; county: string; }

// Discriminated union — item type is narrowed automatically by TypeScript
type SearchResult =
  | { type: "county";        item: County }
  | { type: "constituency";  item: Constituency }
  | { type: "ward";          item: Ward }
  | { type: "sub-county";    item: SubCounty }
  | { type: "locality";      item: Locality }
  | { type: "area";          item: Area };
```

### Error Handling

```typescript
import { LocationNotFoundError, LocationError } from "kenya-locations";

try {
  county("Nairobi")?.locality("NonExistent"); // throws LocationNotFoundError
} catch (e) {
  if (e instanceof LocationNotFoundError) { /* ... */ }
}
```

Error hierarchy: `LocationError` → `LocationNotFoundError`, `InvalidLocationCodeError`, `SearchError`, `DataValidationError`, `ConfigurationError`

---

## React API (`kenya-locations-react`)

Memoised hooks for every level of the hierarchy. All hooks return stable array references across renders.

### Installation

```bash
npm install kenya-locations-react
# peer deps: react >=18, kenya-locations
```

### Hooks

| Hook | Returns | Description |
|---|---|---|
| `useCounties()` | `County[]` | All 47 counties |
| `useCounty(nameOrCode)` | `CountyWrapper \| undefined` | Single county wrapper |
| `useConstituencies()` | `Constituency[]` | All 290 constituencies |
| `useConstituency(codeOrName)` | `ConstituencyWrapper \| undefined` | Single constituency |
| `useConstituenciesInCounty(nameOrCode)` | `ConstituencyWrapper[]` | Constituencies in a county |
| `useWards()` | `Ward[]` | All 1,448 wards |
| `useWardsInCounty(nameOrCode)` | `Ward[]` | Wards in a county |
| `useWardsInConstituency(nameOrCode)` | `Ward[]` | Wards in a constituency |
| `useConstituencyOfWard(nameOrCode)` | `ConstituencyWrapper \| undefined` | Parent constituency of a ward |
| `useSubCountyOfWard(nameOrCode)` | `SubCounty \| undefined` | Parent sub-county of a ward |
| `useSubCounties()` | `SubCounty[]` | All 307 sub-counties |
| `useSubCountiesInCounty(nameOrCode)` | `SubCounty[]` | Sub-counties in a county |
| `useLocalities()` | `Locality[]` | All 916 localities |
| `useLocalitiesInCounty(countyName)` | `Locality[]` | Localities in a county |
| `useLocality(name, countyName?)` | `LocalityWrapper \| undefined` | Single locality (county-scoped) |
| `useAreas()` | `Area[]` | All 1,829 areas |
| `useAreasInLocality(localityName)` | `Area[]` | Areas in a locality |
| `useAreasInCounty(countyName)` | `Area[]` | Areas in a county |
| `useSearch(query, options?)` | `{ results: SearchResult[], isPending: boolean }` | Debounced fuzzy search |

### `useSearch` options

```typescript
useSearch(query, {
  limit?: number;       // max results (default 10)
  types?: SearchType[]; // restrict to specific entity types
  debounceMs?: number;  // debounce delay in ms (default 300, set 0 to disable)
})
```

`isPending` is `true` while the debounce timer is running (query changed but search hasn't fired yet). `results` is typed as `SearchResult[]` — the discriminated union means TypeScript narrows `item` automatically.

---

## Kotlin API

### Getters

```kotlin
KenyaLocations.getCounties()                // List<County>
KenyaLocations.getCountyByCode("047")       // County?
KenyaLocations.getCountyByName("Nairobi")   // County?
KenyaLocations.getSubCounties()             // List<SubCounty>
KenyaLocations.getConstituencies()          // List<Constituency>
KenyaLocations.getConstituencyByCode("290") // Constituency?
KenyaLocations.getConstituencyByName("Westlands") // Constituency?
KenyaLocations.getWards()                   // List<Ward>
KenyaLocations.getLocalities()              // List<Locality>
KenyaLocations.getAreas()                   // List<Area>
```

### Relational queries

```kotlin
KenyaLocations.getSubCountiesInCounty("Nairobi")
KenyaLocations.getConstituenciesInCounty("Nairobi")
KenyaLocations.getWardsInConstituency("Westlands")
KenyaLocations.getWardsInCounty("Nairobi")
KenyaLocations.getLocalitiesInCounty("Nairobi")
KenyaLocations.getAreasInLocality("Karen")
KenyaLocations.getAreasInCounty("Nairobi")
```

### Search

Search is **fuzzy and typo-tolerant** — a query like `"Nairob"` matches `"Nairobi"`. Results are sorted by relevance (best match first).

```kotlin
KenyaLocations.search("karen", limit = 20)           // List<SearchResult<*>>
KenyaLocations.searchByType("west", SearchType.WARD) // List<SearchResult<*>>
```

### Data classes

```kotlin
data class County(
    val code: String,
    val name: String,
    val capital: String,
    val area_km2: Double,
    val population_2019: Long,
    val region: String,       // former province, e.g. "Nairobi", "Central"
    val postal_code: String,
)
data class SubCounty(val code: String, val name: String, val county: String)
data class Constituency(val code: String, val name: String, val county: String)
data class Ward(val code: String, val name: String, val constituency: String)
data class Locality(val name: String, val county: String)
data class Area(val name: String, val locality: String, val county: String)

enum class SearchType { COUNTY, SUB_COUNTY, CONSTITUENCY, WARD, LOCALITY, AREA }
data class SearchResult<T>(val type: SearchType, val item: T)
```

---

## Swift API

### Getters

```swift
let kl = KenyaLocations.shared

kl.getCounties()                    // [County]
kl.getCountyByCode("047")           // County?
kl.getCountyByName("Nairobi")       // County?
kl.getSubCounties()                 // [SubCounty]
kl.getConstituencies()              // [Constituency]
kl.getConstituencyByCode("290")     // Constituency?
kl.getConstituencyByName("Westlands") // Constituency?
kl.getWards()                       // [Ward]
kl.getLocalities()                  // [Locality]
kl.getAreas()                       // [Area]
```

### Relational queries

```swift
kl.getSubCountiesInCounty("Nairobi")
kl.getConstituenciesInCounty("Nairobi")
kl.getWardsInConstituency("Westlands")
kl.getWardsInCounty("Nairobi")
kl.getLocalitiesInCounty("Nairobi")
kl.getAreasInLocality("Karen")
kl.getAreasInCounty("Nairobi")
```

### Search

Search is **fuzzy and typo-tolerant** — a query like `"Nairob"` matches `"Nairobi"`. Results are sorted by relevance (best match first).

```swift
kl.search("karen", limit: 20)           // [SearchResult]
kl.searchByType("west", type: .ward)    // [SearchResult]

// SearchResult is an enum with associated values
for result in kl.search("Westlands") {
    switch result {
    case .county(let c):       print(c.capital)
    case .constituency(let c): print(c.county)
    case .ward(let w):         print(w.constituency)
    case .locality(let l):     print(l.county)
    case .area(let a):         print(a.locality)
    case .subCounty(let s):    print(s.county)
    }
}
```

### Structs

```swift
public struct County: Codable {
    public let code: String
    public let name: String
    public let capital: String
    public let area_km2: Double
    public let population_2019: Int
    public let region: CountyRegion    // enum: .nairobi, .central, .coast, …
    public let postal_code: String
}
public struct SubCounty:    Codable { let code, name, county: String }
public struct Constituency: Codable { let code, name, county: String }
public struct Ward:         Codable { let code, name, constituency: String }
public struct Locality:     Codable { let name, county: String }
public struct Area:         Codable { let name, locality, county: String }

public enum CountyRegion: String, Codable, CaseIterable {
    case nairobi, central, coast, eastern, northEastern,
         nyanza, riftValley, western
}
```

---

## Dart API

### Getters

```dart
KenyaLocations.getCounties();                          // List<County>
KenyaLocations.getCountyByCode('047');                  // County?
KenyaLocations.getCountyByName('Nairobi');               // County?
KenyaLocations.getSubCounties();                        // List<SubCounty>
KenyaLocations.getConstituencies();                     // List<Constituency>
KenyaLocations.getWards();                              // List<Ward>
KenyaLocations.getLocalities();                         // List<Locality>
KenyaLocations.getAreas();                              // List<Area>
```

### Relational queries

```dart
KenyaLocations.getSubCountiesInCounty('Nairobi');
KenyaLocations.getConstituenciesInCounty('Nairobi');
KenyaLocations.getWardsInConstituency('Westlands');
KenyaLocations.getLocalitiesInCounty('Nairobi');
KenyaLocations.getAreasInLocality('Karen');
KenyaLocations.getConstituencyOfWard('Mountain view'); // Constituency?
KenyaLocations.getConstituencyOfWard('1370');          // same ward, by code
```

### Search

Search is **fuzzy and typo-tolerant** — a query like `'Nairob'` matches `'Nairobi'`, using the same Levenshtein sliding-window approach as the Kotlin and Swift libraries. Results are sorted by relevance (best match first).

```dart
final results = KenyaLocations.search('karen', limit: 20); // List<SearchResult<dynamic>>
final wardsOnly = KenyaLocations.searchByType('West', SearchType.ward);

for (final result in results) {
  switch (result.type) {
    case SearchType.county:
      print((result.item as County).capital);
    case SearchType.ward:
      print((result.item as Ward).constituency);
    case SearchType.area:
      print((result.item as Area).locality);
    default:
      break;
  }
}
```

### Classes

```dart
class County {
  final String code;
  final String name;
  final String capital;
  final double areaKm2;
  final int population2019;
  final String region;
  final String postalCode;
}

class SubCounty    { final String code, name, county; }
class Constituency { final String code, name, county; }
class Ward         { final String code, name, constituency; }
class Locality     { final String name, county; }
class Area         { final String name, locality, county; }

enum SearchType { county, subCounty, constituency, ward, locality, area }
class SearchResult<T> { final SearchType type; final T item; String get name; }
```

---

## Contributing

Contributions are very welcome — especially data additions (new localities, areas, corrections).

**Data files are plain JSON** in `data/`. No TypeScript or Kotlin knowledge needed to add entries. The pre-commit hook validates data automatically on every commit.

```
data/
├── counties.json        ← includes capital, area_km2, population_2019, region, postal_code
├── sub-counties.json
├── constituencies.json
├── wards.json
├── locality.json
└── area.json
```

See [packages/js/CONTRIBUTING.md](packages/js/CONTRIBUTING.md) for data structure, validation rules, and submission guidelines. Submit new areas via the [web app](https://kenya-locations.web.app/) or directly via a PR.

After editing `data/*.json`, regenerate the Dart constants from the repo root with `dart run packages/dart/scripts/generate_data.dart`.

---

## Website

The interactive demo lives in `apps/web` and is published at [kenya-locations.web.app](https://kenya-locations.web.app). The UI is built with [coss ui](https://coss.com/ui) on Base UI.

```bash
pnpm install
pnpm start          # http://localhost:3000
```

It uses the local `kenya-locations` workspace package, so library changes show up immediately. Area submissions need Notion credentials in `apps/web/.env` — copy `apps/web/env.example`.

---

## Repository Structure

```
kenya-locations/
├── data/                    ← shared JSON source of truth (all libraries read from here)
├── packages/
│   ├── js/                  ← TypeScript library → npm: kenya-locations
│   ├── react/                ← React hooks library → npm: kenya-locations-react
│   ├── kotlin/               ← Kotlin/JVM library → Maven: io.github.davidamunga:kenya-locations
│   ├── swift/                ← Swift library → Swift Package Index: KenyaLocations
│   └── dart/                 ← Dart/Flutter library → pub.dev: kenya_locations
├── apps/
│   └── web/                  ← interactive demo (kenya-locations.web.app)
├── examples/
│   ├── android/               ← Compose app using the Kotlin library
│   └── flutter/                ← Flutter app using the Dart library (packages/dart)
└── scripts/
    └── validate-data.js      ← data integrity checks (runs on commit + CI)
```

---

## License

MIT © [David Amunga](https://davidamunga.com)

Data sourced from the Independent Electoral and Boundaries Commission (IEBC) and Kenya National Bureau of Statistics (KNBS).