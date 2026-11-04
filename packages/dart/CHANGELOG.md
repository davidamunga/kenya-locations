## 0.1.1

## 0.3.0

### Minor Changes

- Models now expose the parent codes and ISO codes from the data: `County.isoCode` and
  `County.aliases`, `countyCode` on `SubCounty`, `Constituency`, `Locality` and `Area`, and
  `constituencyCode` and `countyCode` on `Ward`. Every relationship lookup now joins by code instead
  of by name, and county name arguments also match aliases, so `getCountyByName('Nairobi City')`
  finds Nairobi. The model constructors gain the new fields as required parameters.
  ([#62](https://github.com/DavidAmunga/kenya-locations/pull/62))

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

## 0.2.0

### Minor Changes

- Make lookups consistent: numeric codes are zero-padded (`getCountyByCode('47')` finds Nairobi),
  names fall back to ignoring accents, spaces and punctuation (`Muranga` finds `Murang'a`), and
  every county or constituency argument accepts a name in any case or a code. `getAreasInLocality`
  takes an optional `county` and only returns areas of that county's locality; an ambiguous locality
  name such as `Bura` without a county now returns an empty list instead of mixing areas from
  several counties. ([#52](https://github.com/DavidAmunga/kenya-locations/pull/52))

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

- Initial release.
- Typed access to Kenya's counties, sub-counties, constituencies, wards, localities, and areas.
- Relational lookups: constituencies/localities in a county, wards in a constituency, areas in a
  locality, and the constituency of a given ward (by unique name or ward code; ambiguous names
  return `null`).
- Case-insensitive, typo-tolerant search across all six location types, plus `searchByType`.
- Data is compiled into the package as Dart constants — no asset loading or async setup required.
