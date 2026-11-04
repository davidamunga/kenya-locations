---
"kenya-locations-dart": minor
---

Make lookups consistent: numeric codes are zero-padded (`getCountyByCode('47')` finds Nairobi), names fall back to ignoring accents, spaces and punctuation (`Muranga` finds `Murang'a`), and every county or constituency argument accepts a name in any case or a code. `getAreasInLocality` takes an optional `county` and only returns areas of that county's locality; an ambiguous locality name such as `Bura` without a county now returns an empty list instead of mixing areas from several counties.
