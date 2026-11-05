import { DATA_VERSION } from "../version";
import {
  getCounties,
  getCountyByName,
  county,
  getConstituencies,
  getConstituencyByCode,
  getConstituencyByName,
  getConstituenciesInCounty,
  getWards,
  getWardByCode,
  getWardByName,
  getWardsInCounty,
  getWardsInSubCounty,
  getCountyOfWard,
  getConstituencyOfWard,
  getSubCountyOfWard,
  search,
  getSubCounties,
  getSubCountyByCode,
  getSubCountyByName,
  getSubCountiesInCounty,
  getCountyOfSubCounty,
  getLocalities,
  getAreas,
  getLocalityByName,
  getLocalitiesByName,
  getAreaByName,
  getAreasByName,
  getLocalitiesInCounty,
  getAreasInLocality,
  getAreasInCounty,
  getCountyOfLocality,
  getCountyOfArea,
  getLocalityOfArea,
  locality,
} from "../KenyaLocations";
import { expect, it, describe } from "vitest";

describe("DATA_VERSION", () => {
  it("exports a non-empty version string", () => {
    expect(typeof DATA_VERSION).toBe("string");
    expect(DATA_VERSION.length).toBeGreaterThan(0);
  });
});

describe("KenyaLocations - Main API", () => {
  describe("getCounties", () => {
    it("should return all counties", () => {
      expect(getCounties()).toHaveLength(47);
    });
  });

  describe("county", () => {
    it("should return a county by name", () => {
      expect(county("Mombasa")?.name).toBe("Mombasa");
    });

    it("should return a county by code", () => {
      expect(county("001")?.code).toBe("001");
    });

    it("should return undefined for non-existent county", () => {
      expect(county("NonExistent")).toBeUndefined();
    });

    it("should provide access to constituencies, localities and areas", () => {
      const nairobi = county("Nairobi")!;

      expect(nairobi.constituencies().length).toBeGreaterThan(0);
      expect(nairobi.localities().length).toBeGreaterThan(0);
      expect(nairobi.areas().length).toBeGreaterThan(0);

      const westlands = nairobi.locality("Westlands");
      expect(westlands.name).toBe("Westlands");

      const westlandsAreas = nairobi.areasByLocality("Westlands");
      expect(westlandsAreas.length).toBeGreaterThan(0);
    });

    it("should throw error for non-existent locality", () => {
      const nairobi = county("Nairobi")!;
      expect(() => nairobi.locality("NonExistentLocality")).toThrow();
    });
  });

  describe("getConstituencies", () => {
    it("should return all constituencies", () => {
      expect(getConstituencies()).toHaveLength(290);
    });
  });

  describe("getConstituencyByCode", () => {
    it("should return a constituency by code", () => {
      expect(getConstituencyByCode("001")?.code).toBe("001");
    });

    it("should return undefined for non-existent constituency", () => {
      expect(getConstituencyByCode("NonExistent")).toBeUndefined();
    });
  });

  describe("getWards", () => {
    it("should return all wards with constituency field", () => {
      const wards = getWards();
      expect(wards).toHaveLength(1450);
      expect(typeof wards[0].constituency).toBe("string");
    });
  });

  describe("getWardsInCounty", () => {
    it("should return wards in a county by code", () => {
      expect(getWardsInCounty("001").length).toBeGreaterThan(0);
    });

    it("should return empty array for non-existent county", () => {
      expect(getWardsInCounty("NonExistent")).toEqual([]);
    });
  });

  describe("getCountyOfWard", () => {
    it("should return undefined for non-existent ward", () => {
      expect(getCountyOfWard("NonExistentWard")).toBeUndefined();
    });
  });

  describe("getSubCounties", () => {
    it("should return all sub-counties", () => {
      expect(getSubCounties()).toHaveLength(307);
    });
  });

  describe("getSubCountiesInCounty", () => {
    it("should return sub-counties in a county", () => {
      const result = getSubCountiesInCounty("047");
      expect(result.length).toBeGreaterThan(0);
      result.forEach((sc) => expect(sc.county).toBe("Nairobi"));
    });

    it("should return empty array for non-existent county", () => {
      expect(getSubCountiesInCounty("NonExistent")).toEqual([]);
    });
  });

  describe("getCountyOfSubCounty", () => {
    it("should return the county of a sub-county", () => {
      const first = getSubCounties()[0];
      expect(getCountyOfSubCounty(first.name)?.name).toBe(first.county);
    });

    it("should return undefined for non-existent sub-county", () => {
      expect(getCountyOfSubCounty("NonExistent")).toBeUndefined();
    });
  });

  describe("getWardsInSubCounty", () => {
    it("should return wards for a sub-county by code", () => {
      const result = getWardsInSubCounty("154"); // Ainabkoi
      expect(result.length).toBeGreaterThan(0);
      result.forEach((w) =>
        expect(w.constituency.toLowerCase()).toBe("ainabkoi")
      );
    });

    it("should return wards for a sub-county by name", () => {
      expect(getWardsInSubCounty("Ainabkoi").length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown sub-county", () => {
      expect(getWardsInSubCounty("NonExistent")).toEqual([]);
    });
  });

  describe("getLocalities", () => {
    it("should return all localities", () => {
      const result = getLocalities();
      expect(result).toHaveLength(917);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("county");
    });
  });

  describe("getAreas", () => {
    it("should return all areas", () => {
      const result = getAreas();
      expect(result).toHaveLength(1828);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("locality");
      expect(result[0]).toHaveProperty("county");
    });
  });

  describe("getLocalitiesByName", () => {
    it("should return all localities matching a name", () => {
      const results = getLocalitiesByName("Westlands");
      expect(results.length).toBeGreaterThan(0);
      results.forEach((l) => expect(l.name.toLowerCase()).toBe("westlands"));
    });

    it("should return empty array for unknown locality name", () => {
      expect(getLocalitiesByName("NonExistentLocality")).toEqual([]);
    });

    it("should be case-insensitive", () => {
      expect(getLocalitiesByName("westlands").length).toBeGreaterThan(0);
    });
  });

  describe("getLocalityByName", () => {
    it("should return a locality by name", () => {
      const westlands = getLocalityByName("Westlands");
      expect(westlands?.name).toBe("Westlands");
      expect(westlands?.county).toBe("Nairobi");
    });

    it("should return undefined for non-existent locality", () => {
      expect(getLocalityByName("NonExistentLocality")).toBeUndefined();
    });

    it("should provide access to areas and county", () => {
      const westlands = getLocalityByName("Westlands")!;
      expect(westlands.areas().length).toBeGreaterThan(0);
      expect(westlands.getCounty()?.name).toBe("Nairobi");
      expect(westlands.area("Gigiri").name).toBe("Gigiri");
    });

    it("should throw error for non-existent area", () => {
      const westlands = getLocalityByName("Westlands")!;
      expect(() => westlands.area("NonExistentArea")).toThrow();
    });
  });

  describe("getAreaByName", () => {
    it("should return an area by name", () => {
      const gigiri = getAreaByName("Gigiri");
      expect(gigiri?.name).toBe("Gigiri");
      expect(gigiri?.locality).toBe("Westlands");
      expect(gigiri?.county).toBe("Nairobi");
    });

    it("should return undefined for non-existent area", () => {
      expect(getAreaByName("NonExistentArea")).toBeUndefined();
    });
  });

  describe("getLocalitiesInCounty", () => {
    it("should return all localities in a county", () => {
      const result = getLocalitiesInCounty("Nairobi");
      expect(result.length).toBeGreaterThan(0);
      result.forEach((l) => expect(l.county).toBe("Nairobi"));
    });

    it("should return empty array for non-existent county", () => {
      expect(getLocalitiesInCounty("NonExistentCounty")).toEqual([]);
    });
  });

  describe("getAreasInLocality", () => {
    it("should return all areas in a locality", () => {
      const result = getAreasInLocality("Westlands");
      expect(result.length).toBeGreaterThan(0);
      result.forEach((a) => expect(a.locality).toBe("Westlands"));
    });

    it("should return empty array for non-existent locality", () => {
      expect(getAreasInLocality("NonExistentLocality")).toEqual([]);
    });
  });

  describe("getAreasInCounty", () => {
    it("should return all areas in a county", () => {
      const result = getAreasInCounty("Nairobi");
      expect(result.length).toBeGreaterThan(0);
      result.forEach((a) => expect(a.county).toBe("Nairobi"));
    });

    it("should return empty array for non-existent county", () => {
      expect(getAreasInCounty("NonExistentCounty")).toEqual([]);
    });
  });

  describe("getCountyOfLocality", () => {
    it("should return the county of a locality", () => {
      expect(getCountyOfLocality("Westlands")?.name).toBe("Nairobi");
    });

    it("should return undefined for non-existent locality", () => {
      expect(getCountyOfLocality("NonExistentLocality")).toBeUndefined();
    });
  });

  describe("getCountyOfArea", () => {
    it("should return the county of an area", () => {
      expect(getCountyOfArea("Gigiri")?.name).toBe("Nairobi");
    });

    it("should return undefined for non-existent area", () => {
      expect(getCountyOfArea("NonExistentArea")).toBeUndefined();
    });
  });

  describe("getLocalityOfArea", () => {
    it("should return the locality of an area", () => {
      const loc = getLocalityOfArea("Gigiri");
      expect(loc?.name).toBe("Westlands");
      expect(loc?.county).toBe("Nairobi");
    });

    it("should return undefined for non-existent area", () => {
      expect(getLocalityOfArea("NonExistentArea")).toBeUndefined();
    });
  });

  describe("locality", () => {
    it("should return a locality by name", () => {
      expect(locality("Westlands")?.name).toBe("Westlands");
    });

    it("should return a locality by name within a specific county", () => {
      const w = locality("Westlands", "Nairobi");
      expect(w?.name).toBe("Westlands");
      expect(w?.county).toBe("Nairobi");
    });

    it("should return undefined for non-existent locality", () => {
      expect(locality("NonExistentLocality")).toBeUndefined();
    });

    it("should return undefined for locality not in specified county", () => {
      expect(locality("Westlands", "Mombasa")).toBeUndefined();
    });
  });

  describe("search", () => {
    it("should return search results", () => {
      expect(search("Nairob").length).toBeGreaterThan(0);
    });

    it("should return an empty array for non-existent query", () => {
      expect(search("NonExistent")).toEqual([]);
    });

    it("should respect the limit parameter", () => {
      expect(search("Nairob", { limit: 1 }).length).toBeLessThanOrEqual(1);
    });

    it("should include localities and areas in search results", () => {
      expect(search("Westlands").some((r) => r.type === "locality")).toBe(true);
      expect(search("Gigiri").some((r) => r.type === "area")).toBe(true);
    });

    it("should support type filtering", () => {
      expect(
        search("Nairobi", { types: ["county"] }).every(
          (r) => r.type === "county"
        )
      ).toBe(true);
    });

    it("discriminated union narrows item type correctly", () => {
      const results = search("Nairobi", { limit: 20 });
      for (const result of results) {
        if (result.type === "county") {
          expect(result.item).toHaveProperty("code");
          expect(result.item).toHaveProperty("name");
        } else if (result.type === "ward") {
          expect(result.item).toHaveProperty("constituency");
        } else if (result.type === "sub-county") {
          expect(result.item).toHaveProperty("county");
        }
      }
    });
  });

  describe("getCountyByName", () => {
    it("returns county by name case-insensitively", () => {
      expect(getCountyByName("nairobi")?.name).toBe("Nairobi");
      expect(getCountyByName("MOMBASA")?.name).toBe("Mombasa");
    });

    it("returns undefined for unknown name", () => {
      expect(getCountyByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getConstituencyByName", () => {
    it("returns ConstituencyWrapper by name case-insensitively", () => {
      const w = getConstituencyByName("westlands");
      expect(w?.name).toBe("Westlands");
      expect(w?.county).toBe("Nairobi");
    });

    it("returns undefined for unknown name", () => {
      expect(getConstituencyByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getConstituenciesInCounty", () => {
    it("returns constituencies by county name", () => {
      const results = getConstituenciesInCounty("Nairobi");
      expect(results.length).toBeGreaterThan(0);
      results.forEach((c) => expect(c.county).toBe("Nairobi"));
    });

    it("returns constituencies by county code", () => {
      const results = getConstituenciesInCounty("047");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown county", () => {
      expect(getConstituenciesInCounty("Nowhere")).toEqual([]);
    });

    it("each result is a ConstituencyWrapper with wards()", () => {
      const results = getConstituenciesInCounty("Nairobi");
      expect(results[0].wards().length).toBeGreaterThan(0);
    });
  });

  describe("getWardByCode", () => {
    it("returns ward by code", () => {
      const first = getWards()[0];
      expect(getWardByCode(first.code)?.code).toBe(first.code);
    });

    it("returns undefined for unknown code", () => {
      expect(getWardByCode("99999")).toBeUndefined();
    });
  });

  describe("getWardByName", () => {
    it("returns ward by name case-insensitively", () => {
      const first = getWards()[0];
      expect(getWardByName(first.name.toLowerCase())?.name).toBe(first.name);
    });

    it("returns undefined for unknown name", () => {
      expect(getWardByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getConstituencyOfWard", () => {
    it("returns the constituency a ward belongs to by code", () => {
      const ward = getWards()[0];
      const constituency = getConstituencyOfWard(ward.code);
      expect(constituency?.name).toBe(ward.constituency);
    });

    it("returns the constituency by ward name", () => {
      const ward = getWards()[0];
      const constituency = getConstituencyOfWard(ward.name);
      expect(constituency?.name).toBe(ward.constituency);
    });

    it("returns undefined for unknown ward", () => {
      expect(getConstituencyOfWard("NonExistent")).toBeUndefined();
    });
  });

  describe("getSubCountyOfWard", () => {
    it("returns the sub-county a ward belongs to", () => {
      const ward = getWards()[0];
      const sc = getSubCountyOfWard(ward.code);
      expect(sc).toBeDefined();
    });

    it("returns undefined for unknown ward", () => {
      expect(getSubCountyOfWard("NonExistent")).toBeUndefined();
    });
  });

  describe("getSubCountyByCode", () => {
    it("returns sub-county by code", () => {
      const first = getSubCounties()[0];
      expect(getSubCountyByCode(first.code)?.code).toBe(first.code);
    });

    it("returns undefined for unknown code", () => {
      expect(getSubCountyByCode("99999")).toBeUndefined();
    });
  });

  describe("getSubCountyByName", () => {
    it("returns sub-county by name case-insensitively", () => {
      const first = getSubCounties()[0];
      expect(getSubCountyByName(first.name.toLowerCase())?.name).toBe(
        first.name
      );
    });

    it("returns undefined for unknown name", () => {
      expect(getSubCountyByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getAreasByName", () => {
    it("returns all areas matching a known name", () => {
      const first = getAreas()[0];
      const all = getAreasByName(first.name);
      expect(all.length).toBeGreaterThan(0);
      all.forEach((a) =>
        expect(a.name.toLowerCase()).toBe(first.name.toLowerCase())
      );
    });

    it("is case-insensitive", () => {
      const first = getAreas()[0];
      const lower = getAreasByName(first.name.toLowerCase());
      const upper = getAreasByName(first.name.toUpperCase());
      expect(lower.length).toBe(upper.length);
    });

    it("returns empty array for unknown name", () => {
      expect(getAreasByName("NonExistentArea12345")).toEqual([]);
    });
  });
});
