---
"kenya-locations-php": minor
---

Models expose the new dataset fields: `County::$isoCode` and `County::$aliases`, `countyCode` on constituencies, sub-counties, localities and areas, and `constituencyCode` and `countyCode` on wards. Every lookup now joins records by these codes instead of by name, and county aliases count as names, so `getCountyByName('Nairobi City')` and any county argument find Nairobi. The new constructor parameters are appended after the existing ones.
