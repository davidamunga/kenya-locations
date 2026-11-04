import { describe, expect, it } from "vitest";
import * as root from "../index";
import * as countiesModule from "../counties";
import * as constituenciesModule from "../constituencies";
import * as wardsModule from "../wards";
import * as subCountiesModule from "../sub-counties";
import * as localitiesModule from "../localities";
import * as areasModule from "../areas";

// The same behaviour must hold for the root import and the subpath imports.
const apis = [
  ["root", root],
  [
    "subpaths",
    {
      ...countiesModule,
      ...constituenciesModule,
      ...wardsModule,
      ...subCountiesModule,
      ...localitiesModule,
      ...areasModule,
    },
  ],
] as const;

describe.each(apis)("lookups (%s)", (_label, api) => {
  describe("localities are scoped to their county", () => {
    it("locality(name, county).areas() only returns that county's areas", () => {
      const areas = api.locality("Bura", "Garissa")?.areas() ?? [];
      expect(areas).toHaveLength(3);
      expect(areas.every((a) => a.county === "Garissa")).toBe(true);
    });

    it("county().locality().areas() only returns that county's areas", () => {
      const areas = api.county("Kisumu")?.locality("Kaloleni").areas() ?? [];
      expect(areas).toHaveLength(2);
      expect(areas.every((a) => a.county === "Kisumu")).toBe(true);
    });

    it("getAreasInLocality takes an optional county", () => {
      const areas = api.getAreasInLocality("Bura", "Tana River");
      expect(areas).toHaveLength(2);
      expect(areas.every((a) => a.county === "Tana River")).toBe(true);
    });

    it("getAreasInLocality returns nothing for an ambiguous name without a county", () => {
      expect(api.getAreasInLocality("Bura")).toEqual([]);
    });

    it("getAreasInLocality still works for a unique locality name", () => {
      expect(api.getAreasInLocality("Westlands").length).toBeGreaterThan(0);
    });

    it("getLocalityOfArea returns the locality in the area's own county", () => {
      expect(api.getLocalityOfArea("Kaloleni")).toEqual({
        name: "Kaloleni",
        county: "Kilifi",
        county_code: "003",
      });
    });
  });

  describe("ambiguous names return undefined instead of an arbitrary record", () => {
    it("getWardByName", () => {
      expect(api.getWardByName("Township")).toBeUndefined();
      expect(api.getWardByName("Kilimani")?.code).toBeDefined();
    });

    it("getWardsByName returns every match", () => {
      expect(api.getWardsByName("Township")).toHaveLength(9);
    });

    it("getCountyOfWard and getConstituencyOfWard", () => {
      expect(api.getCountyOfWard("Township")).toBeUndefined();
      expect(api.getConstituencyOfWard("Township")).toBeUndefined();
      expect(api.getCountyOfWard("0001")).toBeDefined();
    });

    it("getLocalityByName and getCountyOfLocality", () => {
      expect(api.getLocalityByName("Makadara")).toBeUndefined();
      expect(api.getCountyOfLocality("Makadara")).toBeUndefined();
      expect(api.getLocalitiesByName("Makadara")).toHaveLength(2);
      expect(api.locality("Makadara", "Mombasa")?.county).toBe("Mombasa");
    });
  });

  describe("codes are zero-padded", () => {
    it("county codes", () => {
      expect(api.getCountyByCode("47")?.name).toBe("Nairobi");
      expect(api.getCountyByCode(" 047 ")?.name).toBe("Nairobi");
      expect(api.county("47")?.name).toBe("Nairobi");
    });

    it("constituency, ward and sub-county codes", () => {
      expect(api.getConstituencyByCode("1")?.code).toBe("001");
      expect(api.getWardByCode("1")?.code).toBe("0001");
      expect(api.getSubCountyByCode("1")?.code).toBe("001");
    });
  });

  describe("county and constituency inputs accept any case or a code", () => {
    it("getLocalitiesInCounty", () => {
      const expected = api.getLocalitiesInCounty("Nairobi");
      expect(expected).toHaveLength(77);
      expect(api.getLocalitiesInCounty("nairobi")).toEqual(expected);
      expect(api.getLocalitiesInCounty("047")).toEqual(expected);
    });

    it("getAreasInCounty", () => {
      const expected = api.getAreasInCounty("Nairobi");
      expect(expected).toHaveLength(151);
      expect(api.getAreasInCounty("NAIROBI")).toEqual(expected);
      expect(api.getAreasInCounty("47")).toEqual(expected);
    });

    it("getWardsInConstituency", () => {
      expect(api.getWardsInConstituency("westlands")).toHaveLength(5);
      expect(api.getWardsInConstituency("Westlands")).toHaveLength(5);
    });

    it("getWardsInCounty and getSubCountiesInCounty", () => {
      expect(api.getWardsInCounty("47")).toEqual(
        api.getWardsInCounty("Nairobi")
      );
      expect(api.getSubCountiesInCounty("47")).toEqual(
        api.getSubCountiesInCounty("nairobi")
      );
    });
  });

  describe("records carry their parents' codes", () => {
    it("wards, constituencies, localities and areas link to their county by code", () => {
      const ward = api.getWardByCode("0737")!;
      expect(ward.constituency_code).toBe(
        api.getConstituencyByName("Marakwet West")!.code
      );
      expect(ward.county_code).toBe("028");
      expect(api.getCountyOfWard("0737")?.code).toBe(ward.county_code);
      expect(api.locality("Bura", "Garissa")?.data.county_code).toBe("007");
      expect(
        api.getAreasInCounty("Nairobi").every((a) => a.county_code === "047")
      ).toBe(true);
    });

    it("counties carry ISO 3166-2 codes, which are numbered alphabetically", () => {
      expect(api.getCountyByCode("047")?.iso_code).toBe("KE-30");
      expect(api.getCountyByCode("030")?.iso_code).toBe("KE-01");
      expect(new Set(api.getCounties().map((c) => c.iso_code)).size).toBe(47);
    });

    it("county aliases work as names", () => {
      expect(api.getCountyByName("Nairobi City")?.code).toBe("047");
      expect(api.county("nairobi city")?.code).toBe("047");
      expect(api.getLocalitiesInCounty("Nairobi City")).toHaveLength(77);
    });
  });

  describe("names ignore punctuation when nothing matches exactly", () => {
    it("counties", () => {
      expect(api.getCountyByName("Muranga")?.name).toBe("Murang'a");
      expect(api.getCountyByName("Elgeyo Marakwet")?.code).toBe("028");
      expect(api.getCountyByName("homabay")?.name).toBe("Homa Bay");
    });

    it("an exact match wins over a looser one", () => {
      expect(api.getWardByName("Iriaini")?.constituency).toBe("Mathira");
      expect(api.getWardByName("Iria-ini")?.constituency).toBe("Othaya");
    });
  });
});
