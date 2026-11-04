---
"kenya-locations-kotlin": minor
---

Fix Kotlin lookups that returned nothing or mixed up localities:

- Codes are zero-padded: `getCountyByCode("47")` finds Nairobi. Applies to county and constituency codes.
- County and constituency names are case-insensitive, and fall back to ignoring spaces, hyphens, apostrophes and accents when nothing matches exactly: `getCountyByName("Muranga")` finds Murang'a.
- Every county and constituency argument accepts a name in any case or a code. `getLocalitiesInCounty("nairobi")`, `getAreasInCounty("047")` and `getWardsInConstituency("westlands")` previously returned an empty list.
- `getAreasInLocality` takes an optional `county` (name or code) and only returns areas from that county. `getAreasInLocality("Bura", "Garissa")` previously also returned areas from Taita-Taveta and Tana River. Without a county, a locality name shared by several counties now returns an empty list.
