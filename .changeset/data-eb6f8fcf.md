---
"kenya-locations": minor
"kenya-locations-dart": minor
"kenya-locations-php": minor
---

Every record now carries its parents' codes, so data can be joined by code instead of by name. Counties gain their ISO 3166-2 code (numbered alphabetically, so Nairobi is `KE-30` while its IEBC code is `047`) and `aliases` (Nairobi: "Nairobi City"). The data now ships with `meta.json` (sources, license, boundary set) and `history.json` (changes by code), and is licensed CC BY 4.0. Library code stays MIT.

In the JS package, every lookup now joins by code internally, the types include the new fields, and county aliases work as names: `getCountyByName("Nairobi City")` finds Nairobi.

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
