---
"kenya-locations": minor
"kenya-locations-dart": minor
"kenya-locations-php": minor
"kenya-locations-dotnet": minor
---

Rebuild the sub-counties from the Humanitarian Data Exchange and link every ward to one.

- **Data:** `sub-counties.json` is now the 302 DHIS2 sub-counties from the HDX "Kenya Sub Counties" layer (American Red Cross, CC BY, 2019 to 2020), replacing 307 records that were mostly constituency names. Two layer entries with no wards (Tiaty, Kalama) are left out. They are third-party, not an official KNBS or IEBC list, and are close to constituencies.
- **Ward link:** every ward in `wards.json` now has a `sub_county_code`, from the HDX "Administrative Wards in Kenya 1450" layer. 1,346 wards match by exact name; 104 are matched by similar name or inferred from their constituency, and are listed in `sources/hdx-kenya-wards/matches.json`.
- **Codes changed:** sub-county codes are now five digits, the county code plus two digits (`04701`), assigned by this project. `data/history.json` maps each old code to its replacement (240) or marks it removed (67).
- **JS and PHP:** `getWardsInSubCounty` and `getSubCountyOfWard` now use the real link instead of matching sub-county and constituency names. `Ward` gains `sub_county_code` (JS) and `subCountyCode` (PHP). `getSubCountyByCode` zero-pads to five digits.
