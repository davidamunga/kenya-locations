---
"kenya-locations": minor
---

Fix lookups that returned wrong or arbitrary results:

- Localities are now scoped to their county. `locality("Bura", "Garissa").areas()` previously also returned areas from Taita-Taveta and Tana River. `getAreasInLocality` takes an optional county, and `getLocalityOfArea` returns the locality in the area's own county.
- Names shared by several records now return `undefined` instead of an arbitrary match. This affects `getWardByName`, `getCountyOfWard`, `getConstituencyOfWard`, `getSubCountyOfWard`, `getLocalityByName`, `getCountyOfLocality`, `getAreaByName`, `getCountyOfArea` and `getLocalityOfArea`, and `getAreasInLocality` without a county. Use the new `getWardsByName`, `getLocalitiesByName`, `getAreasByName`, a code, or pass a county.
- Codes are zero-padded: `getCountyByCode("47")` finds Nairobi. Applies to county, constituency, sub-county and ward codes.
- Every county and constituency argument accepts a name in any case or a code. `getLocalitiesInCounty("nairobi")`, `getAreasInCounty("047")` and `getWardsInConstituency("westlands")` previously returned nothing.
- Names that differ only in spaces, hyphens or apostrophes now match when there is no exact match: `getCountyByName("Muranga")` finds Murang'a.

The root import and the subpath imports (`kenya-locations/counties`, etc.) now share one implementation, so they always behave the same.
