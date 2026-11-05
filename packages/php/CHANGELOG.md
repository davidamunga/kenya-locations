# kenya-locations-php

## 0.4.0

### Minor Changes

- Rebuild the sub-counties from the Humanitarian Data Exchange and link every ward to one.

  - **Data:** `sub-counties.json` is now the 302 DHIS2 sub-counties from the HDX "Kenya Sub
    Counties" layer (American Red Cross, CC BY, 2019 to 2020), replacing 307 records that were
    mostly constituency names. Two layer entries with no wards (Tiaty, Kalama) are left out. They
    are third-party, not an official KNBS or IEBC list, and are close to constituencies.
  - **Ward link:** every ward in `wards.json` now has a `sub_county_code`, from the HDX
    "Administrative Wards in Kenya 1450" layer. 1,346 wards match by exact name; 104 are matched by
    similar name or inferred from their constituency, and are listed in
    `sources/hdx-kenya-wards/matches.json`.
  - **Codes changed:** sub-county codes are now five digits, the county code plus two digits
    (`04701`), assigned by this project. `data/history.json` maps each old code to its replacement
    (240) or marks it removed (67).
  - **JS and PHP:** `getWardsInSubCounty` and `getSubCountyOfWard` now use the real link instead of
    matching sub-county and constituency names. `Ward` gains `sub_county_code` (JS) and
    `subCountyCode` (PHP). `getSubCountyByCode` zero-pads to five digits.
    ([#76](https://github.com/DavidAmunga/kenya-locations/pull/76))

## 0.3.1

### Patch Changes

- Data update:

  - **Areas** (1,827 → 1,828)
    - Added area Kwa Jose (Juja, Kiambu)
      ([#68](https://github.com/DavidAmunga/kenya-locations/pull/68))

- Data update:

  - **Areas** (1,827 → 1,828)
    - Added area Highpoint (Juja, Kiambu)
      ([#69](https://github.com/DavidAmunga/kenya-locations/pull/69))

## 0.3.0

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

- Models expose the new dataset fields: `County::$isoCode` and `County::$aliases`, `countyCode` on
  constituencies, sub-counties, localities and areas, and `constituencyCode` and `countyCode` on
  wards. Every lookup now joins records by these codes instead of by name, and county aliases count
  as names, so `getCountyByName('Nairobi City')` and any county argument find Nairobi. The new
  constructor parameters are appended after the existing ones.
  ([#63](https://github.com/DavidAmunga/kenya-locations/pull/63))

## 0.2.0

### Minor Changes

- Make PHP lookups consistent and safe with reused names. Codes are zero-padded
  (`getCountyByCode('47')` finds Nairobi), and names fall back to a match that ignores spaces,
  hyphens, apostrophes and accents (`Muranga` finds `Murang'a`). `getWardByName`,
  `getLocalityByName`, `getLocality` (without a county), `getCountyOfLocality`, `getAreaByName`,
  `getCountyOfArea` and `getLocalityOfArea` now return `null` when a name matches more than one
  record, instead of the first match. `getAreasInLocality` takes an optional county (name or code),
  only returns areas of that county's locality, and returns an empty list for a reused locality name
  with no county. Adds `getWardsByName`.
  ([#53](https://github.com/DavidAmunga/kenya-locations/pull/53))

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

## 0.1.0

### Minor Changes

- [#34](https://github.com/davidamunga/kenya-locations/pull/34) Add a PHP Composer package that
  reads the shared Kenyan location JSON.
