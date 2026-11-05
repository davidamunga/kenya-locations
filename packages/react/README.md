# kenya-locations-react

[![npm version](https://img.shields.io/npm/v/kenya-locations-react.svg)](https://www.npmjs.com/package/kenya-locations-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/DavidAmunga/kenya-locations/blob/main/LICENSE)

React hooks for Kenyan administrative divisions: counties, sub-counties, constituencies, wards, localities and areas, plus fuzzy search.

Built on [`kenya-locations`](https://www.npmjs.com/package/kenya-locations). All data ships with the package, so there are no network requests, no API keys and no loading states.

**47** counties · **307** sub-counties · **290** constituencies · **1,450** wards · **917** localities · **1,828** areas

[Live demo](https://kenya-locations.web.app) · [Full documentation](https://github.com/DavidAmunga/kenya-locations#react-api-kenya-locations-react) · [Report an issue](https://github.com/DavidAmunga/kenya-locations/issues)

## Installation

```bash
npm install kenya-locations-react
# pnpm add kenya-locations-react
# yarn add kenya-locations-react
```

Requires React 18 or newer. `kenya-locations` is installed automatically as a dependency.

## Quick start

### Dependent dropdowns

```tsx
import { useState } from "react";
import { useCounties, useConstituenciesInCounty, useWardsInConstituency } from "kenya-locations-react";

export function LocationPicker() {
  const [county, setCounty] = useState<string>();
  const [constituency, setConstituency] = useState<string>();

  const counties = useCounties();
  const constituencies = useConstituenciesInCounty(county);
  const wards = useWardsInConstituency(constituency);

  return (
    <>
      <select onChange={(e) => { setCounty(e.target.value || undefined); setConstituency(undefined); }}>
        <option value="">County</option>
        {counties.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>

      <select disabled={!county} onChange={(e) => setConstituency(e.target.value || undefined)}>
        <option value="">Constituency</option>
        {constituencies.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>

      <select disabled={!constituency}>
        <option value="">Ward</option>
        {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
      </select>
    </>
  );
}
```

Hooks that take a parent value return an empty array while it is `undefined`, so you can pass state straight in.

### Search box

```tsx
import { useState } from "react";
import { useSearch } from "kenya-locations-react";

export function LocationSearch() {
  const [query, setQuery] = useState("");
  const { results, isPending } = useSearch(query, { types: ["county", "constituency", "ward"], limit: 8 });

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a place…" />
      {isPending && <span>Searching…</span>}
      <ul>
        {results.map((r, i) => <li key={i}>{r.item.name} <small>({r.type})</small></li>)}
      </ul>
    </>
  );
}
```

## Hooks

| Hook | Returns | Description |
|---|---|---|
| `useCounties()` | `County[]` | All 47 counties |
| `useCounty(nameOrCode)` | `CountyWrapper \| undefined` | A single county with chainable helpers |
| `useConstituencies()` | `Constituency[]` | All 290 constituencies |
| `useConstituency(codeOrName)` | `ConstituencyWrapper \| undefined` | A single constituency |
| `useConstituenciesInCounty(nameOrCode)` | `ConstituencyWrapper[]` | Constituencies in a county |
| `useWards()` | `Ward[]` | All 1,450 wards |
| `useWardsInCounty(nameOrCode)` | `Ward[]` | Wards in a county |
| `useWardsInConstituency(nameOrCode)` | `Ward[]` | Wards in a constituency |
| `useConstituencyOfWard(nameOrCode)` | `ConstituencyWrapper \| undefined` | Parent constituency of a ward |
| `useSubCountyOfWard(nameOrCode)` | `SubCounty \| undefined` | Parent sub-county of a ward |
| `useSubCounties()` | `SubCounty[]` | All 307 sub-counties |
| `useSubCountiesInCounty(nameOrCode)` | `SubCounty[]` | Sub-counties in a county |
| `useLocalities()` | `Locality[]` | All 917 localities |
| `useLocalitiesInCounty(countyName)` | `Locality[]` | Localities in a county |
| `useLocality(name, countyName?)` | `LocalityWrapper \| undefined` | A single locality; pass the county to disambiguate duplicate names |
| `useAreas()` | `Area[]` | All 1,828 areas |
| `useAreasInLocality(localityName, county?)` | `Area[]` | Areas in a locality; pass the county for names used in more than one county |
| `useAreasInCounty(countyName)` | `Area[]` | Areas in a county |
| `useSearch(query, options?)` | `{ results, isPending }` | Debounced fuzzy search |

All hooks are memoised, so returned arrays keep the same reference between renders and are safe to use in dependency arrays.

### `useSearch` options

| Option | Default | Description |
|---|---|---|
| `limit` | `10` | Maximum number of results |
| `types` | all types | Restrict to specific entity types, e.g. `["county", "ward"]` |
| `debounceMs` | `300` | Delay before the search runs after the query changes. `0` disables debouncing |

`isPending` is `true` while the debounce timer is running. `results` is a discriminated union on `type`, so TypeScript narrows `item` automatically.

### Wrappers

`useCounty`, `useConstituency` and `useLocality` return wrapper objects with chainable helpers:

```tsx
const nairobi = useCounty("Nairobi");
const constituencies = nairobi?.constituencies() ?? [];
```

See the [`kenya-locations` docs](https://github.com/DavidAmunga/kenya-locations#chainable-wrappers) for everything a wrapper offers.

## TypeScript

Types ship with the package. Entity types (`County`, `Ward`, `SearchResult` and so on) come from `kenya-locations`:

```ts
import type { County, Ward } from "kenya-locations";
import type { UseSearchOptions } from "kenya-locations-react";
```

## Server-side rendering

The hooks have no side effects on first render, so they work with Next.js, Remix and other SSR setups. The exception is `useSearch`, which uses a debounce timer in an effect and only updates on the client.

## Troubleshooting

**`EUNSUPPORTEDPROTOCOL … workspace:*` on install**: you are on `kenya-locations-react@0.3.0`, which was published with a broken dependency. Install `0.9.1` or newer.

## Contributing

The data and all language packages live in one repository: [DavidAmunga/kenya-locations](https://github.com/DavidAmunga/kenya-locations). Data corrections are welcome, see the contributing guide there.

## License

[MIT](https://github.com/DavidAmunga/kenya-locations/blob/main/LICENSE) © David Amunga
