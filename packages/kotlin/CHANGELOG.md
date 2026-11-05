# kenya-locations-kotlin

## 0.11.2

## 0.11.1

## 0.11.0

### Minor Changes

- The Kotlin models now include the parent codes, ISO codes and aliases in the data:
  `County.iso_code` and `County.aliases`, `county_code` on every constituency, sub-county, ward,
  locality and area, and `Ward.constituency_code`. Lookups join on these codes instead of names, and
  county name arguments also match aliases, so `getCountyByName("Nairobi City")` finds Nairobi.
  ([#60](https://github.com/DavidAmunga/kenya-locations/pull/60))

## 0.10.0

### Minor Changes

- Fix Kotlin lookups that returned nothing or mixed up localities:

  - Codes are zero-padded: `getCountyByCode("47")` finds Nairobi. Applies to county and constituency
    codes.
  - County and constituency names are case-insensitive, and fall back to ignoring spaces, hyphens,
    apostrophes and accents when nothing matches exactly: `getCountyByName("Muranga")` finds
    Murang'a.
  - Every county and constituency argument accepts a name in any case or a code.
    `getLocalitiesInCounty("nairobi")`, `getAreasInCounty("047")` and
    `getWardsInConstituency("westlands")` previously returned an empty list.
  - `getAreasInLocality` takes an optional `county` (name or code) and only returns areas from that
    county. `getAreasInLocality("Bura", "Garissa")` previously also returned areas from Taita-Taveta
    and Tana River. Without a county, a locality name shared by several counties now returns an
    empty list. ([#50](https://github.com/DavidAmunga/kenya-locations/pull/50))
