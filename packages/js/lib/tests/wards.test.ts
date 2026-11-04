import { expect, it, describe } from "vitest";
import {
  getWards,
  getWardByCode,
  getWardByName,
  getWardsInCounty,
  getCountyOfWard,
  getConstituencyOfWard,
  getSubCountyOfWard,
} from "../wards";
import { ConstituencyWrapper } from "../constituencies";

describe("Wards Module", () => {
  describe("getWards", () => {
    it("returns all 1450 wards", () => {
      const result = getWards();
      expect(result).toHaveLength(1450);
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("constituency");
    });
  });

  describe("getWardByCode", () => {
    it("returns ward by its actual code", () => {
      const first = getWards()[0];
      expect(getWardByCode(first.code)?.code).toBe(first.code);
    });

    it("returns undefined for unknown code", () => {
      expect(getWardByCode("99999")).toBeUndefined();
    });
  });

  describe("getWardByName", () => {
    it("returns ward by name (case-insensitive)", () => {
      const all = getWards();
      const first = all[0];
      expect(getWardByName(first.name.toLowerCase())?.name).toBe(first.name);
    });

    it("returns undefined for unknown name", () => {
      expect(getWardByName("Nowhere")).toBeUndefined();
    });
  });

  describe("getWardsInCounty", () => {
    it("returns wards by county code (Mombasa = 001)", () => {
      expect(getWardsInCounty("001").length).toBeGreaterThan(0);
    });

    it("returns 85 wards for Nairobi by name", () => {
      expect(getWardsInCounty("Nairobi")).toHaveLength(85);
    });

    it("returns empty array for unknown county", () => {
      expect(getWardsInCounty("Nowhere")).toEqual([]);
    });
  });

  describe("getCountyOfWard", () => {
    it("resolves county by ward code", () => {
      const ward = getWards()[0];
      const county = getCountyOfWard(ward.code);
      expect(county).toBeDefined();
    });

    it("returns undefined for unknown ward", () => {
      expect(getCountyOfWard("NonExistentWard")).toBeUndefined();
    });
  });

  describe("getConstituencyOfWard", () => {
    it("returns ConstituencyWrapper for a ward code", () => {
      const ward = getWards()[0];
      const c = getConstituencyOfWard(ward.code);
      expect(c).toBeInstanceOf(ConstituencyWrapper);
      expect(c?.name).toBe(ward.constituency);
    });

    it("returns ConstituencyWrapper for a ward name", () => {
      const ward = getWards()[0];
      const c = getConstituencyOfWard(ward.name);
      expect(c).toBeDefined();
    });

    it("returns undefined for unknown ward", () => {
      expect(getConstituencyOfWard("NonExistent")).toBeUndefined();
    });
  });

  describe("getSubCountyOfWard", () => {
    it("returns sub-county for a ward code", () => {
      const ward = getWards()[0];
      const sc = getSubCountyOfWard(ward.code);
      expect(sc).toBeDefined();
    });

    it("returns undefined for unknown ward", () => {
      expect(getSubCountyOfWard("NonExistent")).toBeUndefined();
    });
  });
});
