import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getAreasInLocality,
  getConstituenciesInCounty,
  getConstituencyByCode,
  getConstituencyByName,
  getCountyByCode,
  getCountyByName,
  getLocalitiesInCounty,
  getSubCountiesInCounty,
  getWardsInConstituency,
  getWardsInCounty,
  search,
  searchByType,
} from "../index";
import type { SearchType } from "../types";

// Shared with every other language package: tests/parity/cases.json.
// JS is the reference implementation, so these must always pass here first.
const cases = JSON.parse(
  readFileSync(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../tests/parity/cases.json"
    ),
    "utf8"
  )
);

const lookups: Record<string, (arg: string) => string | null | undefined> = {
  countyByCode: (arg) => getCountyByCode(arg)?.name,
  countyByName: (arg) => getCountyByName(arg)?.code,
  constituencyByCode: (arg) => getConstituencyByCode(arg)?.name,
  constituencyByName: (arg) => getConstituencyByName(arg)?.code,
};

const counts: Record<string, (arg: string) => number> = {
  constituenciesInCounty: (arg) => getConstituenciesInCounty(arg).length,
  wardsInCounty: (arg) => getWardsInCounty(arg).length,
  subCountiesInCounty: (arg) => getSubCountiesInCounty(arg).length,
  wardsInConstituency: (arg) => getWardsInConstituency(arg).length,
};

describe("cross-language parity", () => {
  it.each(cases.lookups)(
    "$call($arg) is $expect",
    ({ call, arg, expect: expected }) => {
      expect(lookups[call](arg) ?? null).toBe(expected);
    }
  );

  it.each(cases.counts)(
    "$call($arg) has $expect records",
    ({ call, arg, expect: expected }) => {
      expect(counts[call](arg)).toBe(expected);
    }
  );

  it.each(cases.areasInLocality)("areasInLocality($locality, $county)", (c) => {
    const names = getAreasInLocality(c.locality, c.county).map((a) => a.name);
    if (c.expectCount !== undefined) expect(names).toHaveLength(c.expectCount);
    for (const name of c.includes ?? []) expect(names).toContain(name);
  });

  it.each(cases.localitiesInCounty)("localitiesInCounty($county)", (c) => {
    const names = getLocalitiesInCounty(c.county).map((l) => l.name);
    for (const name of c.includes) expect(names).toContain(name);
  });

  it.each(cases.search)("search($query)", (c) => {
    const results = search(c.query, { limit: c.limit });
    if (c.empty) expect(results).toHaveLength(0);
    const hits = results.map((r) => `${r.type}:${r.item.name}`);
    for (const { type, name } of c.includes ?? [])
      expect(hits).toContain(`${type}:${name}`);
  });

  it.each(cases.searchByType)("searchByType($query, $type)", (c) => {
    const results = searchByType(c.query, c.type as SearchType, c.limit);
    if (c.nonEmpty) expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.type === c.type)).toBe(true);
    const names = results.map((r) => r.item.name);
    for (const name of c.includes ?? []) expect(names).toContain(name);
  });
});
