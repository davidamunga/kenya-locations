import { expect, it, describe } from "vitest";
import {
  getLocalities,
  getLocalityByName,
  getLocalitiesByName,
  getLocalitiesInCounty,
  getCountyOfLocality,
  locality,
  LocalityWrapper,
} from "../localities";
import { LocationNotFoundError } from "../errors/LocationErrors";

describe("Localities Module", () => {
  describe("getLocalities", () => {
    it("returns all 917 localities", () => {
      const result = getLocalities();
      expect(result).toHaveLength(917);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("county");
    });
  });

  describe("getLocalityByName", () => {
    it("returns a LocalityWrapper by name", () => {
      const westlands = getLocalityByName("Westlands");
      expect(westlands).toBeInstanceOf(LocalityWrapper);
      expect(westlands?.name).toBe("Westlands");
      expect(westlands?.county).toBe("Nairobi");
    });

    it("is case-insensitive", () => {
      expect(getLocalityByName("westlands")?.name).toBe("Westlands");
    });

    it("returns undefined for unknown locality", () => {
      expect(getLocalityByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getLocalitiesByName", () => {
    it("returns all localities matching a name", () => {
      const results = getLocalitiesByName("Westlands");
      expect(results.length).toBeGreaterThan(0);
      results.forEach((l) => expect(l.name.toLowerCase()).toBe("westlands"));
    });

    it("is case-insensitive", () => {
      expect(getLocalitiesByName("westlands").length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown locality name", () => {
      expect(getLocalitiesByName("Nowhere")).toEqual([]);
    });
  });

  describe("getLocalitiesInCounty", () => {
    it("returns localities belonging to the county", () => {
      const result = getLocalitiesInCounty("Nairobi");
      expect(result.length).toBeGreaterThan(0);
      result.forEach((l) => expect(l.county).toBe("Nairobi"));
    });

    it("returns empty array for unknown county", () => {
      expect(getLocalitiesInCounty("Nowhere")).toEqual([]);
    });
  });

  describe("getCountyOfLocality", () => {
    it("returns the county of a locality", () => {
      const county = getCountyOfLocality("Westlands");
      expect(county?.name).toBe("Nairobi");
    });

    it("returns undefined for unknown locality", () => {
      expect(getCountyOfLocality("Nowhere")).toBeUndefined();
    });
  });

  describe("locality", () => {
    it("finds by name globally", () => {
      const w = locality("Westlands");
      expect(w?.name).toBe("Westlands");
    });

    it("finds by name within county", () => {
      const w = locality("Westlands", "Nairobi");
      expect(w?.name).toBe("Westlands");
      expect(w?.county).toBe("Nairobi");
    });

    it("returns undefined when county does not match", () => {
      expect(locality("Westlands", "Mombasa")).toBeUndefined();
    });

    it("returns undefined for unknown locality", () => {
      expect(locality("Nowhere")).toBeUndefined();
    });
  });

  describe("LocalityWrapper", () => {
    it("returns areas in the locality", () => {
      const westlands = getLocalityByName("Westlands")!;
      const areas = westlands.areas();
      expect(areas.length).toBeGreaterThan(0);
    });

    it("returns an area by name", () => {
      const westlands = getLocalityByName("Westlands")!;
      const gigiri = westlands.area("Gigiri");
      expect(gigiri.name).toBe("Gigiri");
    });

    it("throws LocationNotFoundError for unknown area", () => {
      const westlands = getLocalityByName("Westlands")!;
      expect(() => westlands.area("Nowhere")).toThrow(LocationNotFoundError);
    });

    it("returns the parent county", () => {
      const westlands = getLocalityByName("Westlands")!;
      expect(westlands.getCounty()?.name).toBe("Nairobi");
    });

    it("exposes data getter as a plain object copy", () => {
      const westlands = getLocalityByName("Westlands")!;
      expect(westlands.data).toEqual({ name: "Westlands", county: "Nairobi" });
    });
  });
});
