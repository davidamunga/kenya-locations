import { describe, expect, it } from "vitest";
import {
  constituencyPlace,
  countyPlace,
  localityPlace,
  searchPlaces,
  subCountyPlace,
  toCsv,
  wardPlace,
} from "./places";

describe("place pages", () => {
  it("county: codes, aliases, and linked constituencies", () => {
    const place = countyPlace("047")!;
    expect(place.title).toBe("Nairobi");
    expect(place.facts).toContainEqual({ label: "ISO 3166-2", value: "KE-30", code: true });
    expect(place.aliases).toEqual(["Nairobi City"]);
    const constituencies = place.groups.find((g) => g.title === "Constituencies")!;
    expect(constituencies.items).toHaveLength(17);
    expect(constituencies.items).toContainEqual(
      expect.objectContaining({ label: "Westlands", href: "/constituency/274" }),
    );
  });

  it("accepts unpadded codes", () => {
    expect(countyPlace("47")?.title).toBe("Nairobi");
  });

  it("constituency: breadcrumb through its county, wards linked by code", () => {
    const place = constituencyPlace("290")!;
    expect(place.title).toBe("Mathare");
    expect(place.crumbs.map((c) => c.label)).toEqual(["Kenya", "Nairobi", "Mathare"]);
    expect(place.crumbs[1].href).toBe("/county/047");
    expect(place.groups[0].items).toHaveLength(6);
    expect(place.groups[0].items.every((item) => item.href?.startsWith("/ward/"))).toBe(true);
  });

  it("ward: full breadcrumb and sibling wards", () => {
    const place = wardPlace("0737")!;
    expect(place.title).toBe("Cherang'any/Chebororwa");
    expect(place.crumbs.map((c) => c.label)).toEqual([
      "Kenya",
      "Elgeyo-Marakwet",
      "Marakwet West",
      "Cherang'any/Chebororwa",
    ]);
    expect(place.groups[0].items.some((item) => item.meta === "0737")).toBe(false);
    expect(place.snippet).toEqual({ kind: "ward", code: "0737", constituencyCode: "148" });
  });

  it("locality: scoped to its county", () => {
    const place = localityPlace("007", "Bura")!;
    expect(place.summary).toContain("Garissa");
    expect(place.groups[0].rows).toHaveLength(3);
    expect(localityPlace("004", "Bura")!.groups[0].rows).toHaveLength(2);
  });

  it("sub-county page exists", () => {
    expect(subCountyPlace("00101")?.title).toBe("Changamwe");
  });

  it("unknown codes return undefined", () => {
    expect(countyPlace("999")).toBeUndefined();
    expect(wardPlace("9999")).toBeUndefined();
    expect(localityPlace("047", "Nowhere")).toBeUndefined();
  });
});

describe("searchPlaces", () => {
  it("puts exact code matches first", () => {
    expect(searchPlaces("0737")[0]).toMatchObject({ type: "ward", href: "/ward/0737" });
    const hits = searchPlaces("47");
    expect(hits[0]).toMatchObject({ type: "county", label: "Nairobi", href: "/county/047" });
  });

  it("finds places by name and links each to its page", () => {
    const hits = searchPlaces("Westlands");
    expect(hits).toContainEqual(
      expect.objectContaining({ type: "constituency", href: "/constituency/274" }),
    );
  });

  it("links areas to their locality's page", () => {
    const area = searchPlaces("Karen").find((hit) => hit.type === "area");
    expect(area?.href).toMatch(/^\/locality\/\d{3}\//);
  });

  it("does not repeat a place found by code and by name", () => {
    const keys = searchPlaces("290").map((hit) => hit.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns nothing for an empty query", () => {
    expect(searchPlaces("  ")).toEqual([]);
  });
});

describe("toCsv", () => {
  it("writes a header row and quotes cells that need it", () => {
    expect(
      toCsv([
        { code: "0737", name: "Cherang'any/Chebororwa", aliases: [] },
        { code: "0001", name: 'Say "hi", ok', aliases: ["A", "B"] },
      ]),
    ).toBe('code,name,aliases\n0737,Cherang\'any/Chebororwa,\n0001,"Say ""hi"", ok",A; B\n');
  });

  it("is empty for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});
