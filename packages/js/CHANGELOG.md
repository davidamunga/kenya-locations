# Changelog

## 0.11.1

### Patch Changes

- Data update:

  - **Areas** (1,827 → 1,828)
    - Added area Kwa Jose (Juja, Kiambu)
      ([#68](https://github.com/DavidAmunga/kenya-locations/pull/68))

- Data update:

  - **Areas** (1,827 → 1,828)
    - Added area Highpoint (Juja, Kiambu)
      ([#69](https://github.com/DavidAmunga/kenya-locations/pull/69))

## 0.11.0

### Minor Changes

- Every record now carries its parents' codes, so data can be joined by code instead of by name.
  Counties gain their ISO 3166-2 code (numbered alphabetically, so Nairobi is `KE-30` while its IEBC
  code is `047`) and `aliases` (Nairobi: "Nairobi City"). The data now ships with `meta.json`
  (sources, license, boundary set) and `history.json` (changes by code), and is licensed CC BY 4.0.
  Library code stays MIT.

  In the JS package, every lookup now joins by code internally, the types include the new fields,
  and county aliases work as names: `getCountyByName("Nairobi City")` finds Nairobi.

  Data update:

  - **Counties** (47)
    - Added `iso_code` to all 47 counties
    - Added `aliases` to all 47 counties
  - **Constituencies** (290)
    - Added `county_code` to all 290 constituencies
  - **Sub-counties** (307)
    - Added `county_code` to all 307 sub-counties
  - **Wards** (1,450)
    - Added `constituency_code` to all 1,450 wards
    - Added `county_code` to all 1,450 wards
  - **Localities** (917)
    - Added `county_code` to all 917 localities
  - **Areas** (1,827)
    - Added `county_code` to all 1,827 areas
      ([#58](https://github.com/DavidAmunga/kenya-locations/pull/58))

## 0.10.0

### Minor Changes

- Fix lookups that returned wrong or arbitrary results:

  - Localities are now scoped to their county. `locality("Bura", "Garissa").areas()` previously also
    returned areas from Taita-Taveta and Tana River. `getAreasInLocality` takes an optional county,
    and `getLocalityOfArea` returns the locality in the area's own county.
  - Names shared by several records now return `undefined` instead of an arbitrary match. This
    affects `getWardByName`, `getCountyOfWard`, `getConstituencyOfWard`, `getSubCountyOfWard`,
    `getLocalityByName`, `getCountyOfLocality`, `getAreaByName`, `getCountyOfArea` and
    `getLocalityOfArea`, and `getAreasInLocality` without a county. Use the new `getWardsByName`,
    `getLocalitiesByName`, `getAreasByName`, a code, or pass a county.
  - Codes are zero-padded: `getCountyByCode("47")` finds Nairobi. Applies to county, constituency,
    sub-county and ward codes.
  - Every county and constituency argument accepts a name in any case or a code.
    `getLocalitiesInCounty("nairobi")`, `getAreasInCounty("047")` and
    `getWardsInConstituency("westlands")` previously returned nothing.
  - Names that differ only in spaces, hyphens or apostrophes now match when there is no exact match:
    `getCountyByName("Muranga")` finds Murang'a.

  The root import and the subpath imports (`kenya-locations/counties`, etc.) now share one
  implementation, so they always behave the same.
  ([#49](https://github.com/DavidAmunga/kenya-locations/pull/49))

### Patch Changes

- Data fixes:

  - Add the two IEBC wards that were missing: `0737` Cherang'any/Chebororwa (Marakwet West) and
    `1344` Kitutu Central (Kitutu Chache South). There are now 1,450 wards.
  - Add a Nairobi `Rosslyn` locality. The Nairobi Rosslyn area pointed to a locality that only
    existed in Kiambu.
  - Remove duplicate areas `Shimo La Tewa` (Kilifi South) and `Boikanga` (South Mugirango).
    `Shimo la Tewa` and `Boikang'a` remain.
  - Rename ward `0319` from `Central  ward` (double space) to `Central ward`.
    ([#46](https://github.com/DavidAmunga/kenya-locations/pull/46))

## 0.9.0

### Minor Changes

- ### kenya-locations

  - **County metadata** — every `County` now carries `capital`, `area_km2`, `population_2019`,
    `region` (former province), and `postal_code` sourced from KNBS
  - **`SearchResult` discriminated union** — TypeScript narrows `item` automatically by `type`
    (`"county" | "constituency" | "ward" | "sub-county" | "locality" | "area"`)
  - **New standalone functions** — `getCountyByName`, `getConstituenciesInCounty`,
    `getConstituencyOfWard`, `getSubCountyOfWard`, `getAreasByName`
  - **Root barrel exports** — `subCounties`, `localities`, `areas` raw arrays now exported from the
    root entry point
  - **`CountyWrapper` consistency fix** — wrapper methods now return `CountyWrapper` instances
    consistently
  - **Type declarations path fixed** — `dist/index.d.ts` now resolves correctly via
    `vite-plugin-dts` `entryRoot` config
  - **Cross-platform fuzzy search** — Kotlin and Swift now ship a native Levenshtein sliding-window
    implementation with full parity to the JS Fuse.js results; no external dependencies added

  ### kenya-locations-react — initial release

  React hooks for every level of the Kenya locations hierarchy, all memoised for stable references:

  - `useCounties()`, `useCounty(nameOrCode)`
  - `useConstituencies()`, `useConstituenciesInCounty(nameOrCode)`, `useConstituency(codeOrName)`
  - `useWards()`, `useWardsInCounty()`, `useWardsInConstituency()`, `useConstituencyOfWard()`,
    `useSubCountyOfWard()`
  - `useSubCounties()`, `useSubCountiesInCounty()`
  - `useLocalities()`, `useLocalitiesInCounty()`, `useLocality()`
  - `useAreas()`, `useAreasInLocality()`, `useAreasInCounty()`
  - `useSearch(query, { limit?, types?, debounceMs? })` — debounced fuzzy search returning
    `{ results: SearchResult[], isPending: boolean }`

## 0.7.0

### Minor Changes

- **kenya-locations v0.7.0**

  - Enriched `County` type with `capital`, `area_km2`, `population_2019`, `region`, and
    `postal_code` fields across all 47 counties
  - Added `SearchResult` discriminated union
    (`{ type: "county" | "constituency" | ... ; item: ... }`) for type-safe result handling
  - New standalone API functions: `getCountyByName`, `getConstituenciesInCounty`,
    `getConstituencyOfWard`, `getSubCountyOfWard`, `getAreasByName`
  - Root barrel now exports raw data arrays: `subCounties`, `localities`, `areas`
  - Fixed `CountyWrapper` methods to consistently return `CountyWrapper` instances
  - Fixed type declaration output path (`dist/index.d.ts`) via `vite-plugin-dts` config
  - Native fuzzy search (Levenshtein sliding-window) in Kotlin and Swift — no external dependencies,
    full cross-platform parity with the JS Fuse.js implementation

  **kenya-locations-react v0.1.0 — initial release**

  React hooks for every entity in the kenya-locations dataset:

  - `useCounties()` — all counties
  - `useCounty(code)` — single county wrapper
  - `useSubCounties(countyCode?)` — sub-counties, optionally filtered by county
  - `useConstituencies(countyCode?)` — constituencies, optionally filtered by county
  - `useWards(subCountyCode?, constituencyCode?)` — wards with optional filters
  - `useLocalities(subCountyCode?)` — localities, optionally filtered by sub-county
  - `useAreas(localityCode?)` — areas, optionally filtered by locality
  - `useSearch(query, options?)` — debounced search returning typed `SearchResult[]` with
    `isPending` state

## 0.6.0

### Minor Changes

- [#24](https://github.com/davidamunga/kenya-locations/pull/24) ## County metadata enrichment

  Every county object now ships five additional fields sourced from KNBS:

  - `capital` — county headquarters / main town
  - `area_km2` — land area in square kilometres
  - `population_2019` — population from the 2019 Kenya Population and Housing Census
  - `region` — former province (`CountyRegion` union type:
    `"Nairobi" | "Central" | "Coast" | "Eastern" | "North Eastern" | "Nyanza" | "Rift Valley" | "Western"`)
  - `postal_code` — Kenya Post primary postal code for the county capital

  Kotlin `County` data class and Swift `County` struct updated to match; a `CountyRegion` enum added
  to both.

  ## TypeScript: `SearchResult` discriminated union

  `SearchResult` is now a proper discriminated union instead of an intersection type. TypeScript
  narrows `item` automatically when you branch on `type`:

  ```ts
  for (const r of search("Nairobi")) {
    if (r.type === "county")
      console.log(r.item.capital); // County
    else if (r.type === "ward")
      console.log(r.item.constituency); // Ward
    else if (r.type === "area") console.log(r.item.locality); // Area
  }
  ```

  ## New standalone API functions

  Tree-shakeable functions added to the root barrel (`kenya-locations`):

  | Function                                | Description                                                      |
  | --------------------------------------- | ---------------------------------------------------------------- |
  | `getCountyByName(name)`                 | Look up a county by exact name                                   |
  | `getConstituencyByName(name)`           | Look up a constituency by exact name                             |
  | `getConstituenciesInCounty(nameOrCode)` | All constituencies in a county as `ConstituencyWrapper[]`        |
  | `getWardByCode(code)`                   | Look up a ward by code                                           |
  | `getWardByName(name)`                   | Look up a ward by name                                           |
  | `getSubCountyByCode(code)`              | Look up a sub-county by code                                     |
  | `getSubCountyByName(name)`              | Look up a sub-county by name                                     |
  | `getConstituencyOfWard(nameOrCode)`     | Resolve a ward → parent `ConstituencyWrapper`                    |
  | `getSubCountyOfWard(nameOrCode)`        | Resolve a ward → parent `SubCounty`                              |
  | `getAreasByName(name)`                  | All areas matching a name (handles duplicates across localities) |

  ## New root barrel exports

  `subCounties`, `localities`, and `areas` raw data arrays are now exported directly from the root
  `kenya-locations` import (previously only accessible via subpath modules).

  ## `CountyWrapper` consistency fix

  `CountyWrapper.constituencies()` and `CountyWrapper.constituency()` accessed via the
  `kenya-locations/counties` subpath now return `ConstituencyWrapper` instances (matching the
  behaviour of the main import). Previously they returned plain data objects.

  ## Build: type declarations path fixed

  `vite-plugin-dts` now uses `entryRoot: "lib"` so declaration files land at `dist/index.d.ts` (and
  siblings) instead of the incorrect `dist/packages/js/lib/…` path that was shipped in prior
  versions.

  ## Data validation script updated

  `scripts/validate-data.js` enforces presence of all new county fields and validates `region`
  against the allowed `CountyRegion` values.

  ## Cross-platform fuzzy search (Kotlin & Swift)

  Both platforms now implement the same Levenshtein sliding-window algorithm used in the JS package,
  replacing the previous plain substring match. Queries like `"Nairob"` now match `"Nairobi"` across
  all three platforms.

  The implementation is self-contained (zero new runtime dependencies). The effective threshold
  mirrors Fuse.js at ≈ 0.4: a pattern of length _n_ matches if the best sliding window has at most
  `floor(n × 0.4)` character errors. Results are returned sorted by relevance score, best match
  first.

## 0.5.4

### Patch Changes

- fix: releases workflow

## 0.5.3

### Patch Changes

- fix: release workflow

## 0.5.2

### Patch Changes

- chore: fix release workflow

## 0.5.1

### Patch Changes

- feat: unify platform releases

## 0.5.0

### Minor Changes

- [#18](https://github.com/davidamunga/kenya-locations/pull/18) Wire `kenya-locations/version`
  subpath export, auto-derive `DATA_VERSION`, deprecate `KenyaLocations` class.

  **New subpath export**

  `kenya-locations/version` is now a first-class subpath export (it was documented in the v0.4.0
  changelog but the entry was missing from `package.json`):

  ```ts
  import { DATA_VERSION } from "kenya-locations/version";
  ```

  **`DATA_VERSION` no longer drifts**

  `DATA_VERSION` is now derived directly from `package.json` instead of being a manually-maintained
  string. It will always match the published npm version — no more stale values after a release.

  **`KenyaLocations` class deprecated**

  `KenyaLocations` is now marked `@deprecated`. The tree-shakeable standalone functions (importable
  from `kenya-locations` or its subpaths) are the recommended API. The class will be removed in a
  future major version.

  **Housekeeping**

  Removed the empty `src/vite-env.d.ts` Vite template stub.

## 0.4.0

### Minor Changes

- [#16](https://github.com/davidamunga/kenya-locations/pull/16) Fix `getWardsInSubCounty`, add
  `getLocalitiesByName`, expand `CountyWrapper` API, expose `DATA_VERSION`, and migrate data to
  JSON.

  **Bug fixes**

  - `getWardsInSubCounty(nameOrCode)` was completely broken — it compared a ward's `constituency`
    name field against a sub-county numeric code, always returning an empty array. It now resolves
    the sub-county by code **or** name first, then matches wards whose `constituency` equals the
    sub-county name (sub-county names correspond to constituency names in the dataset). Both
    `kenya-locations` and `kenya-locations/sub-counties` are fixed.
  - `getSubCountiesInCounty` in the main module now uses county code as the map key (matching the
    `sub-counties` subpath module) — inconsistency that could cause drift is resolved.

  **New API**

  - `getLocalitiesByName(name)` — returns **all** localities matching a name across every county.
    The existing `getLocalityByName` returns only the first match when a name is duplicated across
    counties; this new function lets callers handle that case explicitly. Available from both
    `kenya-locations` and `kenya-locations/localities`.
  - `CountyWrapper.constituency(nameOrCode)` and `CountyWrapper.locality(name)` — the tree-shakeable
    `kenya-locations/counties` subpath `CountyWrapper` was missing these single-item lookup methods
    (with `LocationNotFoundError` on miss) that the main module's wrapper already had. Both subpaths
    now have a consistent API.
  - `DATA_VERSION` string constant — exported from `kenya-locations`. Consumers can read the current
    dataset version at runtime. Also available as
    `import { DATA_VERSION } from 'kenya-locations/version'` (new subpath not yet wired in
    package.json, constant lives in `lib/version.ts`).

  **Data**

  - All six data arrays (`counties`, `constituencies`, `wards`, `sub-counties`, `localities`,
    `areas`) are now stored as JSON source files (`lib/data/*.json`). The TypeScript files become
    4-line typed wrappers (`import raw from "./x.json"; export const x: X[] = raw`). The public API
    is completely unchanged.
  - `pnpm validate` no longer requires a prior `pnpm build` — it reads the JSON files directly. CI
    now runs validation **before** the build step.
  - `pnpm validate` gained a new **required-fields check** that catches entries with missing or
    empty `code`, `name`, `county`, `constituency`, or `locality` fields.
  - Pre-commit data hook (`lint-staged`) updated to trigger on `lib/data/*.json` changes instead of
    `*.ts`.

  **Tooling**

  - Added `@vitest/coverage-v8` — `pnpm test:coverage` now produces a full coverage report (94%
    statements, 88% branches). CI runs coverage instead of plain `pnpm test`.
  - `fuse.js` marked as external in Vite config — no longer bundled into each output chunk;
    consumers share one copy.
  - Pre-commit hook changed from `npm test` to `pnpm test` (project uses pnpm throughout).
  - `KenyaDivisionsOptions` interface marked `@deprecated` (was unused; use `DATA_VERSION` instead).

## 0.3.0

### Minor Changes

- [#15](https://github.com/davidamunga/kenya-locations/pull/15) Refactor internal map construction
  to use shared declarative utilities, unify the error hierarchy, and export the full error class
  tree from the main package entry point.

  **New exports** — all error classes are now importable from `"kenya-locations"`:

  ```ts
  import {
    LocationError,
    LocationNotFoundError,
    InvalidLocationCodeError,
    SearchError,
    DataValidationError,
    ConfigurationError,
  } from "kenya-locations";
  ```

  **Internal improvements (no API changes):**

  - `buildLookupMap` / `buildGroupMap` utilities replace all imperative `forEach` + `push`
    map-building blocks across every module
  - `KenyaLocations.ts` now imports errors from `errors/LocationErrors.ts`; `NotFoundError` and
    `KenyaLocationsError` remain exported as backward-compatible aliases
  - Removed duplicate `Area` / `Locality` interface definitions from data files — `types/index.ts`
    is the single source of truth for all entity shapes
  - Removed duplicate `SearchType` definition from `utils/search.ts`
  - `Fuse<any>` replaced with proper generic types in the search utility
  - Deleted unused `data-structures/Trie.ts`
  - Test suite split into per-module files for faster, clearer failures

### Patch Changes

- chore: improve release workflow

## 0.2.0

### Minor Changes

- cbd79cd: Add automated versioning and release.

All notable changes to the Kenya Locations package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8]

### Fixed

- Constituency & Wards Data

## [0.1.7]

### Fixed

- Remove Duplicate Localities

## [0.1.6]

### NEW

- data (garissa, homa bay, isiolo, kakamega, nyandarua, taita-taveta): added new areas and updated
  localities

### Fixed

- Fixed Validation Script
- Sorted Localities and Areas

## [0.1.5]

### Fixed

- fix(build): resolve ES module compatibility issue with CJS output

## [0.1.4]

### Fixed

- Added areas (Nairobi, Nakuru, Machakos, Kisumu and Machakos)

## [0.1.3]

### Fixed

- Changed `Constituency` interface: `county: County` → `county: string`
- Updated all 290 constituency entries to use county names instead of county objects

## [0.1.2]

### Fixed

- Updated area+locality sets (removed areas with estate)
- Removed searching by codes and other fields
- Improved search performance by lazy init fuse instances when needed.
- Added `searchByType` function to search for specific types of administrative divisions
- Added `search` function options to customize search results e.g. `limit`, `types`
- Added validatation scripts
- Added pre-commit hooks
-

## [0.1.1]

### Fixed

- Fixed county hierarchy example in examples/basic-usage.html
- Fixed ward hierarchy example in examples/basic-usage.html
- Corrected constituency → county reference data in `lib/data/constituencies.ts`

## [0.1.0]

### Added

- **NEW**: Complete localities and areas functionality
  - Added `Locality` and `Area` interfaces and data types
  - Added 880+ localities across all 47 counties
  - Added 670+ areas linked to their respective localities
  - New functions: `getLocalities()`, `getAreas()`, `getLocalityByName()`, `getAreaByName()`
  - New functions: `getLocalitiesInCounty()`, `getAreasInLocality()`, `getAreasInCounty()`
  - New relationship functions: `getCountyOfLocality()`, `getCountyOfArea()`, `getLocalityOfArea()`
  - Added `LocalityWrapper` class with methods to navigate locality data and relationships
  - Enhanced search functionality to include localities and areas in search results
  - Extended `CountyWrapper` class with `localities()`, `locality()`, `areas()`, and
    `areasByLocality()` methods

### Changed

- Updated search results to include "locality" and "area" types
- Enhanced the `SearchResult` interface to support new data types
- Updated examples and documentation for new functionality

## [0.0.4]

### Changed

- **BREAKING**: Renamed functions to remove "all" prefix:
  - `getAllCounties()` → `getCounties()`
  - `getAllSubCounties()` → `getSubCounties()`
  - `getAllWards()` → `getWards()`
  - `getAllConstituencies()` → `getConstituencies()`
  - `getAllWardsInCounty()` → `getWardsInCounty()`
- Updated all tests to use new function names
- Updated `Constituency` interface to use `county` object instead of `countyCode` string
- Updated constituency data structure to reference county objects directly
- Updated ConstituencyWrapper class with `getCounty()` method instead of `county()`
- Updated internal relationship maps and search utilities to support new constituency structure

### Fixed

- Fixed `getSubCountiesInCounty` to properly handle both county codes and names
- Improved sub-county lookup performance by using county maps

## [0.0.3]

### Added

- Comprehensive test suite for all functionality
- Test coverage for sub-counties and related functions
- Vitest setup for running tests
- Testing badges in README

### Changed

- **BREAKING**: Updated `SubCounty` interface to use `county` (name) instead of `countyCode`
- Updated sub-counties data structure to use county names directly
- Updated internal relationship maps to support new sub-county structure
- Enhanced README with sub-county functionality documentation
- Improved the implementation of `getSubCountiesInCounty` and `getCountyOfSubCounty` functions

### Fixed

- Fixed imports in test files

## [0.0.2]

Fixed Docs

## [0.0.1]

Initial public release.
