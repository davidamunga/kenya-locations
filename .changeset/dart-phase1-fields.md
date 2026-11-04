---
"kenya-locations-dart": minor
---

Models now expose the parent codes and ISO codes from the data: `County.isoCode` and `County.aliases`, `countyCode` on `SubCounty`, `Constituency`, `Locality` and `Area`, and `constituencyCode` and `countyCode` on `Ward`. Every relationship lookup now joins by code instead of by name, and county name arguments also match aliases, so `getCountyByName('Nairobi City')` finds Nairobi. The model constructors gain the new fields as required parameters.
