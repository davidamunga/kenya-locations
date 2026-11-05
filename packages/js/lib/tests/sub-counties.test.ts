import { expect, it, describe } from "vitest";
import {
  getSubCounties,
  getSubCountyByCode,
  getSubCountyByName,
  getSubCountiesInCounty,
  getCountyOfSubCounty,
  getWardsInSubCounty,
} from "../sub-counties";

describe("Sub-Counties Module", () => {
  describe("getSubCounties", () => {
    it("returns all 302 sub-counties", () => {
      expect(getSubCounties()).toHaveLength(302);
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
    it("returns sub-county by name (case-insensitive)", () => {
      const first = getSubCounties()[0];
      expect(getSubCountyByName(first.name.toLowerCase())?.name).toBe(
        first.name
      );
    });

    it("returns undefined for unknown name", () => {
      expect(getSubCountyByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getSubCountiesInCounty", () => {
    it("returns 17 sub-counties for Nairobi by name", () => {
      const result = getSubCountiesInCounty("Nairobi");
      expect(result).toHaveLength(17);
      result.forEach((sc) => expect(sc.county).toBe("Nairobi"));
    });

    it("resolves by county code", () => {
      expect(getSubCountiesInCounty("047").length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown county", () => {
      expect(getSubCountiesInCounty("Nowhere")).toEqual([]);
    });
  });

  describe("getCountyOfSubCounty", () => {
    it("returns the county of a sub-county", () => {
      const first = getSubCounties()[0];
      const county = getCountyOfSubCounty(first.name);
      expect(county?.name).toBe(first.county);
    });

    it("returns undefined for unknown sub-county", () => {
      expect(getCountyOfSubCounty("Nowhere")).toBeUndefined();
    });
  });
  describe("getWardsInSubCounty", () => {
    it("returns the wards of a sub-county by code and by name", () => {
      const westlands = getSubCountyByName("Westlands")!;
      const byCode = getWardsInSubCounty(westlands.code);
      expect(byCode.length).toBeGreaterThan(0);
      expect(getWardsInSubCounty("Westlands")).toEqual(byCode);
      byCode.forEach((w) => expect(w.sub_county_code).toBe(westlands.code));
    });

    it("is case-insensitive for name lookup", () => {
      expect(getWardsInSubCounty("westlands")).toEqual(
        getWardsInSubCounty("Westlands")
      );
    });

    it("returns an empty array for an unknown sub-county", () => {
      expect(getWardsInSubCounty("Nowhere")).toEqual([]);
    });

    it("every sub-county has at least one ward, all in its own county", () => {
      for (const sc of getSubCounties()) {
        const wards = getWardsInSubCounty(sc.code);
        expect(wards.length, sc.name).toBeGreaterThan(0);
        wards.forEach((w) =>
          expect(w.county_code, `${sc.name}/${w.name}`).toBe(sc.county_code)
        );
      }
    });
  });
});
