import {
  getAreasInLocality,
  getConstituenciesInCounty,
  getConstituencyByCode,
  getCountyByCode,
  getLocalitiesInCounty,
  getSubCountiesInCounty,
  getSubCountyByCode,
  getWardByCode,
  getWardsInConstituency,
  getWardsInCounty,
  getWardsInSubCounty,
  locality as findLocality,
  search,
} from "kenya-locations";
import type { County, SearchResult } from "kenya-locations";

// ─── URLs ────────────────────────────────────────────────────────────────────

export const countyHref = (code: string) => `/county/${code}`;
export const constituencyHref = (code: string) => `/constituency/${code}`;
export const wardHref = (code: string) => `/ward/${code}`;
export const subCountyHref = (code: string) => `/sub-county/${code}`;
export const localityHref = (countyCode: string, name: string) =>
  `/locality/${countyCode}/${encodeURIComponent(name)}`;

// ─── Page model ──────────────────────────────────────────────────────────────

export type PlaceKind = "county" | "constituency" | "ward" | "sub-county" | "locality";

export interface Crumb {
  label: string;
  href?: string;
}

export interface Fact {
  label: string;
  value: string;
  /** Codes are shown in a monospace face. */
  code?: boolean;
}

export interface PlaceLink {
  label: string;
  href?: string;
  meta?: string;
}

export interface PlaceGroup {
  title: string;
  /** File name used when the group is copied or downloaded as CSV. */
  csvName: string;
  items: PlaceLink[];
  /** Raw records, for CSV. */
  rows: object[];
  note?: string;
}

/** What the "use it in code" snippets should look up. */
export type SnippetTarget =
  | { kind: "county"; code: string }
  | { kind: "constituency"; code: string }
  | { kind: "ward"; code: string; constituencyCode: string }
  | { kind: "sub-county"; code: string; countyCode: string }
  | { kind: "locality"; name: string; countyCode: string };

export interface Place {
  kind: PlaceKind;
  /** e.g. "Constituency" */
  kindLabel: string;
  title: string;
  /** One line under the title, e.g. "Constituency in Nairobi" */
  summary: string;
  crumbs: Crumb[];
  facts: Fact[];
  aliases: string[];
  groups: PlaceGroup[];
  record: object;
  snippet: SnippetTarget;
}

const HOME: Crumb = { label: "Kenya", href: "/" };

function countyCrumb(county: County): Crumb {
  return { label: county.name, href: countyHref(county.code) };
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count.toLocaleString()} ${count === 1 ? one : many}`;
}

export function countyPlace(code: string): Place | undefined {
  const county = getCountyByCode(code);
  if (!county) return undefined;
  const constituencies = getConstituenciesInCounty(county.code).map((c) => c.data);
  const subCounties = getSubCountiesInCounty(county.code);
  const localities = getLocalitiesInCounty(county.code);
  const wards = getWardsInCounty(county.code);

  return {
    kind: "county",
    kindLabel: "County",
    title: county.name,
    summary: `County · ${county.region} region · ${plural(constituencies.length, "constituency", "constituencies")}, ${plural(wards.length, "ward")}`,
    crumbs: [HOME, { label: county.name }],
    facts: [
      { label: "IEBC code", value: county.code, code: true },
      { label: "ISO 3166-2", value: county.iso_code, code: true },
      ...(county.capital !== county.name ? [{ label: "Capital", value: county.capital }] : []),
      { label: "Region", value: county.region },
      { label: "Area", value: `${county.area_km2.toLocaleString()} km²` },
      { label: "Population (2019)", value: county.population_2019.toLocaleString() },
      { label: "Postal code", value: county.postal_code, code: true },
    ],
    aliases: county.aliases,
    groups: [
      {
        title: "Constituencies",
        csvName: `${county.code}-constituencies`,
        items: constituencies.map((c) => ({
          label: c.name,
          href: constituencyHref(c.code),
          meta: plural(getWardsInConstituency(c.code).length, "ward"),
        })),
        rows: constituencies,
      },
      {
        title: "Sub-counties",
        csvName: `${county.code}-sub-counties`,
        items: subCounties.map((s) => ({ label: s.name, href: subCountyHref(s.code), meta: s.code })),
        rows: subCounties,
        note: "Sub-counties are being rebuilt from the KNBS list; many entries are constituency names today.",
      },
      {
        title: "Localities",
        csvName: `${county.code}-localities`,
        items: localities.map((l) => ({
          label: l.name,
          href: localityHref(county.code, l.name),
        })),
        rows: localities,
      },
    ],
    record: county,
    snippet: { kind: "county", code: county.code },
  };
}

export function constituencyPlace(code: string): Place | undefined {
  const constituency = getConstituencyByCode(code)?.data;
  if (!constituency) return undefined;
  const county = getCountyByCode(constituency.county_code);
  const wards = getWardsInConstituency(constituency.code);

  return {
    kind: "constituency",
    kindLabel: "Constituency",
    title: constituency.name,
    summary: `Constituency in ${constituency.county} · ${plural(wards.length, "ward")}`,
    crumbs: [HOME, ...(county ? [countyCrumb(county)] : []), { label: constituency.name }],
    facts: [
      { label: "IEBC code", value: constituency.code, code: true },
      { label: "County", value: `${constituency.county} (${constituency.county_code})` },
    ],
    aliases: [],
    groups: [
      {
        title: "Wards",
        csvName: `${constituency.code}-wards`,
        items: wards.map((w) => ({ label: w.name, href: wardHref(w.code), meta: w.code })),
        rows: wards,
      },
    ],
    record: constituency,
    snippet: { kind: "constituency", code: constituency.code },
  };
}

export function wardPlace(code: string): Place | undefined {
  const ward = getWardByCode(code);
  if (!ward) return undefined;
  const county = getCountyByCode(ward.county_code);
  const siblings = getWardsInConstituency(ward.constituency_code).filter(
    (w) => w.code !== ward.code,
  );

  return {
    kind: "ward",
    kindLabel: "Ward",
    title: ward.name,
    summary: `County assembly ward in ${ward.constituency}, ${county?.name ?? ward.county_code}`,
    crumbs: [
      HOME,
      ...(county ? [countyCrumb(county)] : []),
      { label: ward.constituency, href: constituencyHref(ward.constituency_code) },
      { label: ward.name },
    ],
    facts: [
      { label: "IEBC code", value: ward.code, code: true },
      { label: "Constituency", value: `${ward.constituency} (${ward.constituency_code})` },
      { label: "County", value: `${county?.name ?? ""} (${ward.county_code})` },
    ],
    aliases: [],
    groups: [
      {
        title: `Other wards in ${ward.constituency}`,
        csvName: `${ward.constituency_code}-wards`,
        items: siblings.map((w) => ({ label: w.name, href: wardHref(w.code), meta: w.code })),
        rows: siblings,
      },
    ],
    record: ward,
    snippet: { kind: "ward", code: ward.code, constituencyCode: ward.constituency_code },
  };
}

export function subCountyPlace(code: string): Place | undefined {
  const subCounty = getSubCountyByCode(code);
  if (!subCounty) return undefined;
  const county = getCountyByCode(subCounty.county_code);
  const wards = getWardsInSubCounty(subCounty.code);

  return {
    kind: "sub-county",
    kindLabel: "Sub-county",
    title: subCounty.name,
    summary: `Sub-county in ${subCounty.county}`,
    crumbs: [HOME, ...(county ? [countyCrumb(county)] : []), { label: subCounty.name }],
    facts: [
      { label: "Code", value: subCounty.code, code: true },
      { label: "County", value: `${subCounty.county} (${subCounty.county_code})` },
    ],
    aliases: [],
    groups: [
      {
        title: "Wards",
        csvName: `sub-county-${subCounty.code}-wards`,
        items: wards.map((w) => ({ label: w.name, href: wardHref(w.code), meta: w.code })),
        rows: wards,
        note:
          wards.length === 0
            ? "No wards are linked to this sub-county yet. Ward to sub-county links arrive with the KNBS rebuild."
            : "Matched through the constituency of the same name until ward to sub-county links arrive.",
      },
    ],
    record: subCounty,
    snippet: { kind: "sub-county", code: subCounty.code, countyCode: subCounty.county_code },
  };
}

export function localityPlace(countyCode: string, name: string): Place | undefined {
  const found = findLocality(name, countyCode)?.data;
  if (!found) return undefined;
  const county = getCountyByCode(found.county_code);
  const areas = getAreasInLocality(found.name, found.county_code);

  return {
    kind: "locality",
    kindLabel: "Locality",
    title: found.name,
    summary: `Locality in ${found.county} · ${plural(areas.length, "area")}`,
    crumbs: [HOME, ...(county ? [countyCrumb(county)] : []), { label: found.name }],
    facts: [{ label: "County", value: `${found.county} (${found.county_code})` }],
    aliases: [],
    groups: [
      {
        title: "Areas",
        csvName: `${found.county_code}-${found.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-areas`,
        items: areas.map((a) => ({ label: a.name })),
        rows: areas,
      },
    ],
    record: found,
    snippet: { kind: "locality", name: found.name, countyCode: found.county_code },
  };
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface PlaceHit {
  key: string;
  type: SearchResult["type"];
  label: string;
  context: string;
  href: string;
}

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  county: "County",
  constituency: "Constituency",
  ward: "Ward",
  "sub-county": "Sub-county",
  locality: "Locality",
  area: "Area",
};

export function typeLabel(type: SearchResult["type"]): string {
  return TYPE_LABEL[type];
}

function countyName(code: string): string {
  return getCountyByCode(code)?.name ?? code;
}

export function hitFor(result: SearchResult): PlaceHit {
  switch (result.type) {
    case "county":
      return {
        key: `county-${result.item.code}`,
        type: "county",
        label: result.item.name,
        context: `${result.item.region} region · ${result.item.code}`,
        href: countyHref(result.item.code),
      };
    case "constituency":
      return {
        key: `constituency-${result.item.code}`,
        type: "constituency",
        label: result.item.name,
        context: `${result.item.county} · ${result.item.code}`,
        href: constituencyHref(result.item.code),
      };
    case "ward":
      return {
        key: `ward-${result.item.code}`,
        type: "ward",
        label: result.item.name,
        context: `${result.item.constituency}, ${countyName(result.item.county_code)} · ${result.item.code}`,
        href: wardHref(result.item.code),
      };
    case "sub-county":
      return {
        key: `sub-county-${result.item.code}`,
        type: "sub-county",
        label: result.item.name,
        context: result.item.county,
        href: subCountyHref(result.item.code),
      };
    case "locality":
      return {
        key: `locality-${result.item.county_code}-${result.item.name}`,
        type: "locality",
        label: result.item.name,
        context: result.item.county,
        href: localityHref(result.item.county_code, result.item.name),
      };
    case "area":
      return {
        key: `area-${result.item.county_code}-${result.item.locality}-${result.item.name}`,
        type: "area",
        label: result.item.name,
        context: `${result.item.locality}, ${result.item.county}`,
        href: localityHref(result.item.county_code, result.item.locality),
      };
  }
}

/** Places whose code is exactly `query` ("47", "290", "0737"). */
function codeHits(query: string): PlaceHit[] {
  if (!/^\d{1,4}$/.test(query)) return [];
  const hits: PlaceHit[] = [];
  if (query.length <= 3) {
    const county = getCountyByCode(query);
    if (county) hits.push(hitFor({ type: "county", item: county }));
    const constituency = getConstituencyByCode(query)?.data;
    if (constituency) hits.push(hitFor({ type: "constituency", item: constituency }));
  }
  const ward = getWardByCode(query);
  if (ward) hits.push(hitFor({ type: "ward", item: ward }));
  return hits;
}

/** Search every place type; exact code matches come first. */
export function searchPlaces(query: string, limit = 20): PlaceHit[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  const byCode = codeHits(trimmed);
  const seen = new Set(byCode.map((hit) => hit.key));
  const fuzzy =
    trimmed.length > 1
      ? search(trimmed, { limit })
          .map(hitFor)
          .filter((hit) => !seen.has(hit.key) && seen.add(hit.key))
      : [];
  return [...byCode, ...fuzzy].slice(0, limit);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Records as CSV, with a header row from the first record's keys. */
export function toCsv(rows: object[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    columns.map((column) => csvCell((row as Record<string, unknown>)[column])).join(","),
  );
  return `${[columns.join(","), ...lines].join("\n")}\n`;
}
