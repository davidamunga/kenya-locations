# kenya-locations-swift

## 0.11.0

### Minor Changes

- Models expose the new data fields: `County.iso_code` and `County.aliases`, `county_code` on
  constituencies, sub-counties, localities and areas, and `constituency_code` and `county_code` on
  wards. Relational queries now join by these codes instead of by name, and county aliases count as
  names, so `getCountyByName("Nairobi City")` finds Nairobi.
  ([#61](https://github.com/DavidAmunga/kenya-locations/pull/61))

## 0.10.0

### Minor Changes

- Make Swift lookups match the JS package. `getCountyByCode` and `getConstituencyByCode` accept
  unpadded codes (`"47"` finds Nairobi). `getCountyByName` and `getConstituencyByName` ignore case,
  and fall back to ignoring spaces, punctuation and accents (`"Muranga"` finds Murang'a). Every
  county or constituency argument (`getLocalitiesInCounty`, `getAreasInCounty`,
  `getWardsInConstituency`, …) now takes a name in any case or a code. `getAreasInLocality` takes an
  optional `county:` and only returns that locality's areas; a locality name shared by several
  counties (such as "Bura") returns no areas unless you pass a county.
  ([#51](https://github.com/DavidAmunga/kenya-locations/pull/51))

### Patch Changes

- Fix the Swift package for Swift Package Manager users: the JSON data is now committed in
  `Resources`, so installs from a git tag build and load data. Also fix `getCountyByCode`,
  `getCountyByName`, `getConstituencyByCode` and `getConstituencyByName` returning `nil` for the
  rest of the process when called before the matching list getter.
  ([#47](https://github.com/DavidAmunga/kenya-locations/pull/47))
