# kenya-locations-php

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

- [#34](https://github.com/davidamunga/kenya-locations/pull/34) Add a PHP Composer package that reads the
  shared Kenyan location JSON.
