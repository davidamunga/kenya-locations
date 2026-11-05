import { expect, it, describe } from "vitest";
import {
  getAreas,
  getAreaByName,
  getAreasByName,
  getAreasInLocality,
  getAreasInCounty,
  getCountyOfArea,
  getLocalityOfArea,
} from "../areas";

describe("Areas Module", () => {
  describe("getAreas", () => {
    it("returns all 1829 areas", () => {
      const result = getAreas();
      expect(result).toHaveLength(1829);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("locality");
      expect(result[0]).toHaveProperty("county");
    });
  });

  describe("getAreaByName", () => {
    it("returns area by name", () => {
      const gigiri = getAreaByName("Gigiri");
      expect(gigiri?.name).toBe("Gigiri");
      expect(gigiri?.locality).toBe("Westlands");
      expect(gigiri?.county).toBe("Nairobi");
    });

    it("is case-insensitive", () => {
      expect(getAreaByName("gigiri")?.name).toBe("Gigiri");
    });

    it("returns undefined for unknown area", () => {
      expect(getAreaByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getAreasInLocality", () => {
    it("returns areas belonging to the locality", () => {
      const result = getAreasInLocality("Westlands");
      expect(result.length).toBeGreaterThan(0);
      result.forEach((a) => expect(a.locality).toBe("Westlands"));
    });

    it("returns empty array for unknown locality", () => {
      expect(getAreasInLocality("Nowhere")).toEqual([]);
    });
  });

  describe("getAreasInCounty", () => {
    it("returns areas belonging to the county", () => {
      const result = getAreasInCounty("Nairobi");
      expect(result.length).toBeGreaterThan(0);
      result.forEach((a) => expect(a.county).toBe("Nairobi"));
    });

    it("returns empty array for unknown county", () => {
      expect(getAreasInCounty("Nowhere")).toEqual([]);
    });
  });

  describe("getCountyOfArea", () => {
    it("returns the county of an area", () => {
      expect(getCountyOfArea("Gigiri")?.name).toBe("Nairobi");
    });

    it("returns undefined for unknown area", () => {
      expect(getCountyOfArea("Nowhere")).toBeUndefined();
    });
  });

  describe("getLocalityOfArea", () => {
    it("returns the locality of an area", () => {
      const locality = getLocalityOfArea("Gigiri");
      expect(locality?.name).toBe("Westlands");
      expect(locality?.county).toBe("Nairobi");
    });

    it("returns undefined for unknown area", () => {
      expect(getLocalityOfArea("Nowhere")).toBeUndefined();
    });
  });

  describe("getAreasByName", () => {
    it("returns all areas matching a known name", () => {
      const first = getAreas()[0];
      const results = getAreasByName(first.name);
      expect(results.length).toBeGreaterThan(0);
      results.forEach((a) =>
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
