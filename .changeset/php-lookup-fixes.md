---
"kenya-locations-php": minor
---

Make PHP lookups consistent and safe with reused names. Codes are zero-padded (`getCountyByCode('47')` finds Nairobi), and names fall back to a match that ignores spaces, hyphens, apostrophes and accents (`Muranga` finds `Murang'a`). `getWardByName`, `getLocalityByName`, `getLocality` (without a county), `getCountyOfLocality`, `getAreaByName`, `getCountyOfArea` and `getLocalityOfArea` now return `null` when a name matches more than one record, instead of the first match. `getAreasInLocality` takes an optional county (name or code), only returns areas of that county's locality, and returns an empty list for a reused locality name with no county. Adds `getWardsByName`.
