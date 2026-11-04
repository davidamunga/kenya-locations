/**
 * Shared lookup indexes and resolvers.
 *
 * Every public lookup (root API and subpath modules) goes through these
 * helpers so that name/code handling behaves the same everywhere:
 *
 * - Codes are zero-padded, so "47" finds county "047".
 * - Names are case-insensitive. If nothing matches exactly, a looser match
 *   that ignores spaces, hyphens, apostrophes and accents is tried
 *   ("Muranga" finds "Murang'a").
 * - A name that matches more than one record resolves to `undefined`
 *   instead of an arbitrary record. Use the plural `...ByName` functions or
 *   pass a county to disambiguate.
 * - Localities are identified by county + name, because the same locality
 *   name exists in more than one county.
 */

import type {
  Area,
  Constituency,
  County,
  Locality,
  SubCounty,
  Ward,
} from "../types";
import { counties } from "../data/counties";
import { constituencies } from "../data/constituencies";
import { subCounties } from "../data/sub-counties";
import { wards } from "../data/wards";
import { localities } from "../data/locality";
import { areas } from "../data/area";
import { buildGroupMap, buildLookupMap } from "./maps";

/** Lowercase and trim. */
function lower(value: string): string {
  return value.trim().toLowerCase();
}

/** Ignore case, accents, spaces and punctuation: "Murang'a" → "muranga". */
export function foldName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Zero-pad a numeric code to `width` digits; non-numeric input is returned trimmed. */
export function normalizeCode(value: string, width: number): string {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed.padStart(width, "0") : trimmed;
}

/** Name index: exact (case-insensitive) matches first, folded matches as a fallback. */
class NameIndex<T extends { name: string }> {
  private readonly exact: Map<string, T[]>;
  private readonly folded: Map<string, T[]>;

  constructor(items: readonly T[]) {
    this.exact = buildGroupMap(items, (item) => lower(item.name));
    this.folded = buildGroupMap(items, (item) => foldName(item.name));
  }

  /** Every record with this name. */
  all(name: string): T[] {
    return this.exact.get(lower(name)) ?? this.folded.get(foldName(name)) ?? [];
  }

  /** The record with this name, or undefined if there are none or several. */
  unique(name: string): T | undefined {
    const matches = this.all(name);
    return matches.length === 1 ? matches[0] : undefined;
  }
}

const COUNTY_CODE_WIDTH = 3;
const CONSTITUENCY_CODE_WIDTH = 3;
const SUB_COUNTY_CODE_WIDTH = 3;
const WARD_CODE_WIDTH = 4;

// --- Counties ---
const countyByCode = buildLookupMap(counties, (c) => c.code);
const countyNames = new NameIndex(counties);

export function getCountyByCodeValue(code: string): County | undefined {
  return countyByCode.get(normalizeCode(code, COUNTY_CODE_WIDTH));
}

export function getCountyByNameValue(name: string): County | undefined {
  return countyNames.unique(name);
}

/** Resolve a county from its name or code. */
export function resolveCounty(nameOrCode: string): County | undefined {
  return getCountyByCodeValue(nameOrCode) ?? countyNames.unique(nameOrCode);
}

// --- Constituencies ---
const constituencyByCode = buildLookupMap(constituencies, (c) => c.code);
const constituencyNames = new NameIndex(constituencies);
const constituenciesByCountyName = buildGroupMap(constituencies, (c) =>
  lower(c.county)
);

export function getConstituencyByCodeValue(
  code: string
): Constituency | undefined {
  return constituencyByCode.get(normalizeCode(code, CONSTITUENCY_CODE_WIDTH));
}

export function getConstituencyByNameValue(
  name: string
): Constituency | undefined {
  return constituencyNames.unique(name);
}

/** Resolve a constituency from its name or code. */
export function resolveConstituency(
  nameOrCode: string
): Constituency | undefined {
  return (
    getConstituencyByCodeValue(nameOrCode) ??
    constituencyNames.unique(nameOrCode)
  );
}

export function constituenciesInCounty(county: County): Constituency[] {
  return constituenciesByCountyName.get(lower(county.name)) ?? [];
}

// --- Sub-counties ---
const subCountyByCode = buildLookupMap(subCounties, (sc) => sc.code);
const subCountyNames = new NameIndex(subCounties);
const subCountiesByCountyName = buildGroupMap(subCounties, (sc) =>
  lower(sc.county)
);

export function getSubCountyByCodeValue(code: string): SubCounty | undefined {
  return subCountyByCode.get(normalizeCode(code, SUB_COUNTY_CODE_WIDTH));
}

export function getSubCountyByNameValue(name: string): SubCounty | undefined {
  return subCountyNames.unique(name);
}

/** Resolve a sub-county from its name or code. */
export function resolveSubCounty(nameOrCode: string): SubCounty | undefined {
  return (
    getSubCountyByCodeValue(nameOrCode) ?? subCountyNames.unique(nameOrCode)
  );
}

export function subCountiesInCounty(county: County): SubCounty[] {
  return subCountiesByCountyName.get(lower(county.name)) ?? [];
}

// --- Wards ---
const wardByCode = buildLookupMap(wards, (w) => w.code);
const wardNames = new NameIndex(wards);
const wardsByConstituencyName = buildGroupMap(wards, (w) =>
  lower(w.constituency)
);
const wardsByCountyCode = buildGroupMap(wards, (w) => {
  const constituency = constituencyNames.unique(w.constituency);
  return constituency ? resolveCounty(constituency.county)?.code : undefined;
});

export function getWardByCodeValue(code: string): Ward | undefined {
  return wardByCode.get(normalizeCode(code, WARD_CODE_WIDTH));
}

export function getWardByNameValue(name: string): Ward | undefined {
  return wardNames.unique(name);
}

export function getWardsByNameValue(name: string): Ward[] {
  return wardNames.all(name);
}

/** Resolve a ward from its code, or from its name when that name is unique. */
export function resolveWard(nameOrCode: string): Ward | undefined {
  return getWardByCodeValue(nameOrCode) ?? wardNames.unique(nameOrCode);
}

export function wardsInConstituency(constituency: Constituency): Ward[] {
  return wardsByConstituencyName.get(lower(constituency.name)) ?? [];
}

export function wardsInCounty(county: County): Ward[] {
  return wardsByCountyCode.get(county.code) ?? [];
}

export function constituencyOfWard(ward: Ward): Constituency | undefined {
  return constituencyNames.unique(ward.constituency);
}

export function countyOfWard(ward: Ward): County | undefined {
  const constituency = constituencyOfWard(ward);
  return constituency ? resolveCounty(constituency.county) : undefined;
}

// --- Localities ---
const localityNames = new NameIndex(localities);
const localitiesByCountyName = buildGroupMap(localities, (l) =>
  lower(l.county)
);

export function getLocalitiesByNameValue(name: string): Locality[] {
  return localityNames.all(name);
}

/**
 * Resolve a locality by name. With a county (name or code) the match is
 * exact; without one, the name must be unique across Kenya.
 */
export function resolveLocality(
  name: string,
  countyNameOrCode?: string
): Locality | undefined {
  if (countyNameOrCode === undefined) return localityNames.unique(name);
  const county = resolveCounty(countyNameOrCode);
  if (!county) return undefined;
  const matches = localityNames
    .all(name)
    .filter((l) => lower(l.county) === lower(county.name));
  return matches.length === 1 ? matches[0] : undefined;
}

export function localitiesInCounty(county: County): Locality[] {
  return localitiesByCountyName.get(lower(county.name)) ?? [];
}

// --- Areas ---
const areaNames = new NameIndex(areas);
const areasByCountyName = buildGroupMap(areas, (a) => lower(a.county));
const areasByLocalityKey = buildGroupMap(areas, (a) =>
  localityKey(a.county, a.locality)
);

function localityKey(countyName: string, localityName: string): string {
  return `${lower(countyName)}|${lower(localityName)}`;
}

export function getAreaByNameValue(name: string): Area | undefined {
  return areaNames.unique(name);
}

export function getAreasByNameValue(name: string): Area[] {
  return areaNames.all(name);
}

/** Areas of one specific locality (matched on county + locality name). */
export function areasInLocality(locality: Locality): Area[] {
  return (
    areasByLocalityKey.get(localityKey(locality.county, locality.name)) ?? []
  );
}

export function areasInCounty(county: County): Area[] {
  return areasByCountyName.get(lower(county.name)) ?? [];
}

export function localityOfArea(area: Area): Locality | undefined {
  return resolveLocality(area.locality, area.county);
}

export function countyOfNamed(record: { county: string }): County | undefined {
  return resolveCounty(record.county);
}
