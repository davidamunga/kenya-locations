---
"kenya-locations-swift": minor
---

Models expose the new data fields: `County.iso_code` and `County.aliases`, `county_code` on constituencies, sub-counties, localities and areas, and `constituency_code` and `county_code` on wards. Relational queries now join by these codes instead of by name, and county aliases count as names, so `getCountyByName("Nairobi City")` finds Nairobi.
