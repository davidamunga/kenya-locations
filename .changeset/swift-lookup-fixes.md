---
"kenya-locations-swift": minor
---

Make Swift lookups match the JS package. `getCountyByCode` and `getConstituencyByCode` accept unpadded codes (`"47"` finds Nairobi). `getCountyByName` and `getConstituencyByName` ignore case, and fall back to ignoring spaces, punctuation and accents (`"Muranga"` finds Murang'a). Every county or constituency argument (`getLocalitiesInCounty`, `getAreasInCounty`, `getWardsInConstituency`, …) now takes a name in any case or a code. `getAreasInLocality` takes an optional `county:` and only returns that locality's areas; a locality name shared by several counties (such as "Bura") returns no areas unless you pass a county.
