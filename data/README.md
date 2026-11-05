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

`code` (`0001`–`1450`), `name`, `constituency`, `constituency_code`, `county_code`, `sub_county_code`. 31 ward names repeat across constituencies (e.g. 9 × "Township"), so always identify wards by code. `sub_county_code` links the ward to its sub-county. It comes from the HDX ward layer, not IEBC (see `meta.json`): 1,346 wards match by exact name and 104 are matched by similar name or inferred from their constituency, all listed in `sources/hdx-kenya-wards/matches.json`.

### `sub-counties.json` — 302 records, key `code`

`code` (5 digits), `name`, `county`, `county_code`. The sub-counties of the Humanitarian Data Exchange's "Kenya Sub Counties" layer (American Red Cross, CC BY), which are DHIS2's sub-counties and match the wards in `wards.json`. Built by `node scripts/sub-counties/build-hdx.js` from `sources/hdx-kenya-wards/`.

- **Codes** are the county's code plus two digits (`00903`), assigned by this project and following the source layer's order.
- **They are not an official list.** They're third-party data from 2016 to 2020, and close to constituencies (297 of 302 sit inside one constituency). Earlier versions of this file were mostly constituency names; `history.json` maps the old codes to the new ones.
- **Two entries are left out:** Tiaty (Baringo) and Kalama (Machakos) are in the source layer but no ward points to them.
- **Don't hand-edit it.** Rebuild with the script; `--check` fails if the files are out of date.

### `locality.json` — 917 records, key `county_code` + `name`

`name`, `county`, `county_code`. The same locality name can exist in several counties ("Bura", "Makadara"). Stable IDs and ward links are planned for 0.12.

### `area.json` — 1,829 records, key `county_code` + `locality` + `name`

`name`, `locality`, `county`, `county_code`.

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
