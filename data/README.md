# Data

The JSON files here are the source of truth for every package. Libraries copy or generate from them; never edit a package's copy.

## Hierarchy

```
County ─┬─ Constituency ── Ward        (electoral, IEBC 2012)
        ├─ Sub-county                  (administrative)
        └─ Locality ── Area            (informal places)
```

Records link to their parents **by code** (`county_code`, `constituency_code`). The name fields (`county`, `constituency`, `locality`) are kept for display and for compatibility; don't use them as keys.

## Files and fields

All codes are zero-padded strings. Field names are `snake_case`.

### `counties.json` — 47 records, key `code`

| Field | Example | Notes |
|---|---|---|
| `code` | `"047"` | IEBC county code, `001`–`047` |
| `iso_code` | `"KE-30"` | ISO 3166-2:KE. Numbered alphabetically, so it differs from `code` |
| `name` | `"Nairobi"` | |
| `capital` | `"Nairobi"` | KNBS |
| `area_km2` | `694.9` | KNBS |
| `population_2019` | `4397073` | KNBS 2019 census |
| `region` | `"Nairobi"` | Former province |
| `postal_code` | `"00100"` | Postal code of the capital |
| `aliases` | `["Nairobi City"]` | Other names, searchable by every library. `[]` when none |

### `constituencies.json` — 290 records, key `code`

`code` (`001`–`290`), `name`, `county`, `county_code`.

### `wards.json` — 1,450 records, key `code`

`code` (`0001`–`1450`), `name`, `constituency`, `constituency_code`, `county_code`. 31 ward names repeat across constituencies (e.g. 9 × "Township"), so always identify wards by code.

### `sub-counties.json` — 307 records, key `code`

`code`, `name`, `county`, `county_code`. Many records are constituency names rather than KNBS sub-counties; this file is being rebuilt from the KNBS list for 1.0.

### `locality.json` — 917 records, key `county_code` + `name`

`name`, `county`, `county_code`. The same locality name can exist in several counties ("Bura", "Makadara"). Stable IDs and ward links are planned for 0.12.

### `area.json` — 1,827 records, key `county_code` + `locality` + `name`

`name`, `locality`, `county`, `county_code`.

### `admin/` — KNBS administrative hierarchy

A separate hierarchy from the electoral one, from the KNBS 2019 census (Volume II):

```
County ── Sub-county ── Division ── Location ── Sub-location
   47         349          999         3,837        8,934
```

These are the national government's units (sub-county administrators, chiefs and assistant chiefs). They don't line up with constituencies and wards.

| File | Key | Parents |
|---|---|---|
| `admin/sub-counties.json` | `code` (5 digits) | `county_code` |
| `admin/divisions.json` | `code` (7) | `sub_county_code`, `county_code` |
| `admin/locations.json` | `code` (9) | `division_code`, `sub_county_code`, `county_code` |
| `admin/sub-locations.json` | `code` (11) | `location_code`, `division_code`, `sub_county_code`, `county_code` |

Each record also has its immediate parent's name, `population_2019` and `area_km2`.

- **Codes** extend the parent's code by two digits in KNBS order: sub-county `00101`, division `0010101`, location `001010101`, sub-location `00101010101`. They're assigned by this project, not by KNBS.
- **It's a 2019 snapshot.** Units created by later gazette notices are missing.
- **Zero-population units:** 26 national parks and forests are listed with a population of 0.
- **Duplicate names:** names can repeat within a parent (Nyamira division has two locations named Bonyamatuta), so always use codes.
- **Sources and caveats** are in `admin/meta.json`.
- **Don't hand-edit these files.** They're generated from `sources/knbs-2019/` by `node scripts/admin/build-knbs.js`, which fixes five names garbled in the scanned source (e.g. "GATONGrgOORA" → Gatong'oora). `pnpm validate` checks that codes nest and that every unit's population equals the sum of its children's, down to the county totals in `counties.json`.

`data/sub-counties.json` (the older 307-record list, mostly constituency names) is unchanged for now; v1.0 replaces it with this hierarchy.

### `meta.json`

License, attribution, boundary set, and the sources, key and parents of each file.

### `history.json`

Renames, merges, additions and removals, by code, so apps that store codes can migrate:

```json
{ "date": "2026-11-04", "release": "0.10.0", "type": "ward", "code": "0319", "change": "renamed", "from": "Central  ward", "to": "Central ward" }
```

`date`, `type` and `change` are required. Add an entry for any change to an existing code.

## Changing the data

```bash
# edit data/*.json
pnpm validate          # schema, codes, parent links, duplicates, whitespace
pnpm data:sync         # refresh the Kotlin, Swift and PHP copies (and Dart, if installed)
pnpm changeset:data    # write the changeset from the diff
```

`pnpm validate` checks that every parent code exists and agrees with the parent name, that county, constituency and ward codes run with no gaps to 47 / 290 / 1,450, that ISO codes are unique, and that `meta.json` and `history.json` are well-formed.

Keep records sorted the way the file already is (by parent, then name), so diffs stay small.

## License

The data is licensed under [CC BY 4.0](LICENSE.md); the library code is MIT.
