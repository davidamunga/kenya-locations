---
"kenya-locations-kotlin": minor
---

The Kotlin models now include the parent codes, ISO codes and aliases in the data: `County.iso_code` and `County.aliases`, `county_code` on every constituency, sub-county, ward, locality and area, and `Ward.constituency_code`. Lookups join on these codes instead of names, and county name arguments also match aliases, so `getCountyByName("Nairobi City")` finds Nairobi.
