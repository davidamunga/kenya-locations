# kenya-locations-react

## 0.9.2

### Patch Changes

- [#44](https://github.com/davidamunga/kenya-locations/pull/44)
  [`2564d00`](https://github.com/davidamunga/kenya-locations/commit/2564d00b14192fa3e866da55c25fca4c855bb308)
  Thanks [@davidamunga](https://github.com/davidamunga)! - Add a README to the npm package with
  install steps, usage examples and the hooks reference.

## 0.9.1

### Patch Changes

- [#42](https://github.com/davidamunga/kenya-locations/pull/42)
  [`f1f3a00`](https://github.com/davidamunga/kenya-locations/commit/f1f3a00b165849c7a01279feb7b9d3c985787cef)
  Thanks [@davidamunga](https://github.com/davidamunga)! - Fix install failure
  (`EUNSUPPORTEDPROTOCOL: workspace:*`) by publishing with pnpm so the `kenya-locations` dependency
  is rewritten to a real version range.

## 0.9.0

### Minor Changes

- [`c9910ea`](https://github.com/davidamunga/kenya-locations/commit/c9910eab1e9e30e30b12f02f8272a7f4ecb2dd91)
  Thanks [@davidamunga](https://github.com/davidamunga)! - ### kenya-locations

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

### Patch Changes

- Updated dependencies
  [[`c9910ea`](https://github.com/davidamunga/kenya-locations/commit/c9910eab1e9e30e30b12f02f8272a7f4ecb2dd91)]:
  - kenya-locations@0.9.0

## 0.3.0

### Minor Changes

- [`80f5b2f`](https://github.com/davidamunga/kenya-locations/commit/80f5b2f02e7e940f482c57c23677ee876c12cc08)
  Thanks [@davidamunga](https://github.com/davidamunga)! - **kenya-locations v0.7.0**

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

### Patch Changes

- Updated dependencies
  [[`80f5b2f`](https://github.com/davidamunga/kenya-locations/commit/80f5b2f02e7e940f482c57c23677ee876c12cc08)]:
  - kenya-locations@0.7.0

## 0.2.0

### Minor Changes

- [#24](https://github.com/davidamunga/kenya-locations/pull/24)
  [`41cf80b`](https://github.com/davidamunga/kenya-locations/commit/41cf80bafc334ddb52daa5c85d570735955e11f1)
  Thanks [@davidamunga](https://github.com/davidamunga)! - ## Initial release of
  `kenya-locations-react`

  New companion package providing memoised React hooks for every level of Kenya's administrative
  hierarchy, with built-in debouncing for search.

  ### Install

  ```bash
  npm install kenya-locations-react
  ```

  Requires `react >= 18` and `kenya-locations` as a peer.

  ### Hooks

  | Hook                                    | Returns                                           | Description                                        |
  | --------------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
  | `useCounties()`                         | `County[]`                                        | All 47 counties (stable reference)                 |
  | `useCounty(nameOrCode)`                 | `CountyWrapper \| undefined`                      | Single county wrapper                              |
  | `useConstituencies()`                   | `Constituency[]`                                  | All 290 constituencies                             |
  | `useConstituency(codeOrName)`           | `ConstituencyWrapper \| undefined`                | Single constituency                                |
  | `useConstituenciesInCounty(nameOrCode)` | `ConstituencyWrapper[]`                           | Constituencies in a county                         |
  | `useWards()`                            | `Ward[]`                                          | All 1,448 wards                                    |
  | `useWardsInCounty(nameOrCode)`          | `Ward[]`                                          | Wards in a county                                  |
  | `useWardsInConstituency(nameOrCode)`    | `Ward[]`                                          | Wards in a constituency                            |
  | `useConstituencyOfWard(nameOrCode)`     | `ConstituencyWrapper \| undefined`                | Parent constituency of a ward                      |
  | `useSubCountyOfWard(nameOrCode)`        | `SubCounty \| undefined`                          | Parent sub-county of a ward                        |
  | `useSubCounties()`                      | `SubCounty[]`                                     | All 307 sub-counties                               |
  | `useSubCountiesInCounty(nameOrCode)`    | `SubCounty[]`                                     | Sub-counties in a county                           |
  | `useLocalities()`                       | `Locality[]`                                      | All 916 localities                                 |
  | `useLocalitiesInCounty(countyName)`     | `Locality[]`                                      | Localities in a county                             |
  | `useLocality(name, countyName?)`        | `LocalityWrapper \| undefined`                    | Single locality (county-scoped for disambiguation) |
  | `useAreas()`                            | `Area[]`                                          | All 1,829 areas                                    |
  | `useAreasInLocality(localityName)`      | `Area[]`                                          | Areas in a locality                                |
  | `useAreasInCounty(countyName)`          | `Area[]`                                          | Areas in a county                                  |
  | `useSearch(query, options?)`            | `{ results: SearchResult[], isPending: boolean }` | Debounced fuzzy search                             |

  ### `useSearch` options

  ```ts
  useSearch(query, {
    limit?: number;      // max results (default 10)
    types?: SearchType[]; // restrict to specific entity types
    debounceMs?: number; // debounce delay (default 300ms, 0 to disable)
  })
  ```

  `results` is typed as `SearchResult[]` — the discriminated union means TypeScript narrows `item`
  automatically when you branch on `type`.

  ### Example

  ```tsx
  import { useCounty, useSearch } from "kenya-locations-react";

  function LocationPicker() {
    const nairobi = useCounty("Nairobi");
    const constituencies = nairobi?.constituencies() ?? [];

    const [query, setQuery] = useState("");
    const { results, isPending } = useSearch(query, {
      types: ["constituency", "ward"],
      debounceMs: 300,
    });

    return (/* … */);
  }
  ```

### Patch Changes

- Updated dependencies
  [[`41cf80b`](https://github.com/davidamunga/kenya-locations/commit/41cf80bafc334ddb52daa5c85d570735955e11f1)]:
  - kenya-locations@0.6.0
