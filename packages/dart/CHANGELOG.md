## 0.1.1

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
