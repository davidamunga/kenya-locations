# HDX ward and sub-county layers

Source for `data/sub-counties.json` and the `sub_county_code` of each ward in `data/wards.json`. Built by `node scripts/sub-counties/build-hdx.js`.

| File here | From | Records |
|---|---|---|
| `kenya_wards.dbf` | [Administrative Wards in Kenya 1450](https://data.humdata.org/dataset/administrative-wards-in-kenya-1450), `Kenya_Wards/kenya_wards.dbf` inside `kenya_wards.zip` | 1,450 wards |
| `ke_subcounty.dbf` | [Kenya Sub Counties](https://data.humdata.org/dataset/kenya-sub-counties), `ke_subcounty.dbf` inside `ke_subcounty.zip` | 304 sub-counties |

Only the attribute tables are kept. The shapefile geometry (`.shp`, about 50 MB) is not.

- **Publisher:** American Red Cross (inactive), via the Humanitarian Data Exchange.
- **Licence:** Creative Commons Attribution (CC BY). Please credit the American Red Cross and HDX.
- **Dates:** wards dataset dated 2016-03-31, last modified 2019-04-12; sub-counties dated 2019-12-12, last modified 2020-09-01. Neither is reviewed on a schedule.
- **Origin (per HDX):** abstracted from National Land Commission, IEBC and Survey of Kenya data, cleaned for topology errors and checked with county teams in more than 20 counties, with DHIS2 unique ids added.
- **Downloaded:** 2026-11-05. SHA-256 of the zip files:
  - `kenya_wards.zip` `13e0dee1a1c731fbb2eb03f0c28468d202fdc174279a104064f05740cc281206`
  - `ke_subcounty.zip` `b4b7ef38671316c2c066bb91f87ecad3565b6724c3bfb2d2e2fe8c6091eadba3`

## What the data is

The sub-counties are DHIS2's (the health information system's). They are close to constituencies and are not an official KNBS or IEBC list. The ward layer's `scuid` column is a DHIS2 sub-county id, and the sub-county layer's `dhis2_id` is the same id.

## Known quirks, and how the build handles them

- **Names** come in several formats ("Mvita  Sub County", "NORTH HORR", "Marakwet East sub-county"); the build cleans them.
- **Two sub-counties have no wards** (Tiaty in Baringo, Kalama in Machakos) and are left out.
- **Seven Baringo wards** say "Tiaty" in their own text but carry the id of "East Pokot", and one Mandera ward says "Mandera South" but carries the id of "Kutulo". The build follows the id.
- **One HDX ward has no sub-county id** (Marothile, Mandera), so it can't link anything.
- **Wards are matched to this repo's IEBC wards** by county and name: 1,346 exactly, then similar names inside the right sub-county, then by agreement with the other wards of the same constituency. Everything that isn't an exact match is listed with its method in `matches.json` for review.

To refresh: replace the two `.dbf` files with newer ones, run the build script, and review the diff in `matches.json`.
