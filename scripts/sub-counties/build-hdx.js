#!/usr/bin/env node

/**
 * Build data/sub-counties.json, and each ward's `sub_county_code` in data/wards.json,
 * from the "Administrative Wards in Kenya 1450" and "Kenya Sub Counties" datasets on
 * the Humanitarian Data Exchange (American Red Cross, CC BY).
 *
 *   node scripts/sub-counties/build-hdx.js          # write the data files
 *   node scripts/sub-counties/build-hdx.js --check  # fail if they are out of date
 *
 * Sources (the attribute tables only, from sources/hdx-kenya-wards/):
 *   kenya_wards.dbf   1,450 wards, each with a DHIS2 sub-county id (`scuid`)
 *   ke_subcounty.dbf  the sub-county layer, keyed by DHIS2 id (`dhis2_id`)
 *
 * The sub-counties are DHIS2's (the health information system), which are close to
 * constituencies. They are third-party data from 2016 to 2020, not an official list.
 * Sub-county codes are assigned by this project: the IEBC county code plus two digits,
 * in the order of the source layer's `scpcode`.
 *
 * HDX wards are matched to this repo's IEBC wards by county and name. Anything that is
 * not an exact name match is recorded, with its method, in
 * sources/hdx-kenya-wards/matches.json so it can be reviewed.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { repoRoot } from "../release/paths.js";

export const SOURCE_DIR = "sources/hdx-kenya-wards";
export const MATCHES = `${SOURCE_DIR}/matches.json`;

const fold = (s) =>
  s.normalize("NFD").replace(/\p{Mn}+/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Read the records of a dBASE (.dbf) file as objects of trimmed strings. */
export function readDbf(buffer, encoding = "utf-8") {
  const count = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];
  for (let offset = 32; buffer[offset] !== 0x0d; offset += 32) {
    const name = buffer.toString("ascii", offset, offset + 11).split("\0")[0];
    fields.push({ name, length: buffer[offset + 16] });
  }
  const decoder = new TextDecoder(encoding);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const start = headerLength + i * recordLength;
    if (buffer[start] === 0x2a) continue; // deleted
    let offset = start + 1;
    const row = {};
    for (const { name, length } of fields) {
      row[name] = decoder.decode(buffer.subarray(offset, offset + length)).trim();
      offset += length;
    }
    rows.push(row);
  }
  return rows;
}

/** "KISAUNI" -> "Kisauni"; names already in mixed case are kept. */
function titleCase(raw) {
  return raw.toLowerCase().replace(/(^|\s)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

/** "Mvita  Sub County" -> "Mvita", "NORTH HORR" -> "North Horr". */
export function cleanSubCountyName(raw) {
  const name = raw
    .replace(/\s*sub[\s-]*county\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return name === name.toUpperCase() && /[A-Z]/.test(name) ? titleCase(name) : name;
}

const stripWard = (name) => name.replace(/\s*ward\s*$/i, "").trim();

/** 1 for identical strings, 0 for nothing in common (normalised Levenshtein). */
export function similarity(a, b) {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

const FUZZY_WITH_SIBLINGS = 0.6; // the sub-county is already pinned down by sibling wards
const FUZZY_SPLIT = 0.75; // the constituency spans several sub-counties
const FUZZY_ALONE = 0.8; // nothing else to go on

export function build({ counties, repoWards, hdxWards, hdxSubCounties }) {
  const byCountyName = new Map();
  for (const c of counties) {
    byCountyName.set(fold(c.name), c.code);
    for (const alias of c.aliases ?? []) byCountyName.set(fold(alias), c.code);
  }
  const countyCode = (name) => {
    const code = byCountyName.get(fold(name));
    if (!code) throw new Error(`HDX county "${name}" is not in counties.json`);
    return code;
  };
  const countyName = new Map(counties.map((c) => [c.code, c.name]));

  // Sub-counties that at least one ward points to, keyed by DHIS2 id.
  const referenced = new Set(hdxWards.map((w) => w.scuid).filter(Boolean));
  const unreferenced = hdxSubCounties.filter((s) => !referenced.has(s.dhis2_id));
  const layer = hdxSubCounties.filter((s) => referenced.has(s.dhis2_id));
  const scpNumber = (s) => Number(String(s.scpcode).split("_").pop());
  const sequence = new Map();
  const subCounties = [];
  const codeOfId = new Map();
  for (const s of [...layer].sort((a, b) => countyCode(a.county).localeCompare(countyCode(b.county)) || scpNumber(a) - scpNumber(b))) {
    const cc = countyCode(s.county);
    const n = (sequence.get(cc) ?? 0) + 1;
    sequence.set(cc, n);
    const code = `${cc}${String(n).padStart(2, "0")}`;
    codeOfId.set(s.dhis2_id, code);
    subCounties.push({ code, name: cleanSubCountyName(s.subcounty), county: countyName.get(cc), county_code: cc });
  }

  // ── Match HDX wards to IEBC wards ────────────────────────────────────────
  const wardKey = (cc, name) => `${cc}|${fold(stripWard(name))}`;
  const hdx = hdxWards.map((w, i) => ({ ...w, i, cc: countyCode(w.county), key: wardKey(countyCode(w.county), w.ward) }));
  const repoGroups = new Map();
  const hdxGroups = new Map();
  for (const w of repoWards) (repoGroups.get(wardKey(w.county_code, w.name)) ?? repoGroups.set(wardKey(w.county_code, w.name), []).get(wardKey(w.county_code, w.name))).push(w);
  for (const h of hdx) (hdxGroups.get(h.key) ?? hdxGroups.set(h.key, []).get(h.key)).push(h);

  const result = new Map(); // ward code -> { scuid, method, hdx?, ratio? }
  const usedHdx = new Set();
  for (const [key, repoList] of [...repoGroups].sort(([a], [b]) => a.localeCompare(b))) {
    const hdxList = hdxGroups.get(key);
    if (repoList.length === 1 && hdxList?.length === 1) {
      result.set(repoList[0].code, { scuid: hdxList[0].scuid, method: "exact", hdx: hdxList[0] });
      usedHdx.add(hdxList[0].i);
    }
  }

  const free = () => repoWards.filter((w) => !result.has(w.code));
  const freeHdx = () => hdx.filter((h) => !usedHdx.has(h.i));
  // An HDX ward with no sub-county id can't link anything, so it is never paired.
  const freeLinkable = () => freeHdx().filter((h) => h.scuid);
  const siblingIds = (ward) => {
    const ids = new Set();
    for (const s of repoWards) {
      if (s.constituency_code === ward.constituency_code && s.code !== ward.code) {
        const r = result.get(s.code);
        if (r?.scuid) ids.add(r.scuid);
      }
    }
    return ids;
  };

  /** Pair free wards with free HDX wards greedily, best similarity first. */
  const pair = (candidatesFor, threshold, method) => {
    const pairs = [];
    for (const w of free()) {
      for (const h of candidatesFor(w)) {
        const ratio = similarity(fold(stripWard(w.name)), fold(stripWard(h.ward)));
        if (ratio >= threshold) pairs.push({ w, h, ratio });
      }
    }
    pairs.sort((a, b) => b.ratio - a.ratio || a.w.code.localeCompare(b.w.code) || a.h.i - b.h.i);
    for (const { w, h, ratio } of pairs) {
      if (result.has(w.code) || usedHdx.has(h.i)) continue;
      result.set(w.code, { scuid: h.scuid, method, hdx: h, ratio: Math.round(ratio * 100) / 100 });
      usedHdx.add(h.i);
    }
  };

  // Wards whose constituency-mates all agree on one sub-county are matched within it.
  pair((w) => { const ids = siblingIds(w); return ids.size === 1 ? freeLinkable().filter((h) => h.cc === w.county_code && ids.has(h.scuid)) : []; }, FUZZY_WITH_SIBLINGS, "guided");
  pair((w) => { const ids = siblingIds(w); return ids.size > 1 ? freeLinkable().filter((h) => h.cc === w.county_code && ids.has(h.scuid)) : []; }, FUZZY_SPLIT, "fuzzy");
  pair((w) => freeLinkable().filter((h) => h.cc === w.county_code), FUZZY_ALONE, "fuzzy");
  // Still nothing: if every sibling agrees, the ward joins them.
  for (const w of free()) {
    const ids = siblingIds(w);
    if (ids.size === 1) result.set(w.code, { scuid: [...ids][0], method: "inferred" });
  }

  const wards = repoWards.map((w) => {
    const r = result.get(w.code);
    const code = r?.scuid ? codeOfId.get(r.scuid) : undefined;
    return code ? { ...w, sub_county_code: code } : { ...w };
  });

  const review = {
    note: "Wards whose sub-county is not an exact-name match to the HDX ward layer. method: guided and fuzzy are name matches within a county (guided: inside the sub-county of the ward's constituency-mates); inferred means every ward in the same constituency belongs to this sub-county. unlinked lists wards with no sub-county.",
    matched: [...result]
      .filter(([, r]) => r.method !== "exact")
      .map(([code, r]) => {
        const w = repoWards.find((x) => x.code === code);
        return {
          ward_code: code,
          ward: w.name,
          constituency: w.constituency,
          method: r.method,
          ...(r.hdx ? { hdx_ward: r.hdx.ward, ratio: r.ratio } : {}),
          sub_county: subCounties.find((s) => s.code === codeOfId.get(r.scuid))?.name,
          sub_county_code: codeOfId.get(r.scuid),
        };
      })
      .sort((a, b) => a.ward_code.localeCompare(b.ward_code)),
    unlinked: wards.filter((w) => !w.sub_county_code).map((w) => ({ ward_code: w.code, ward: w.name, constituency: w.constituency, county: countyName.get(w.county_code) })),
    hdx_wards_not_matched: freeHdx().map((h) => ({ hdx_ward: h.ward, county: h.county, sub_county: h.subcounty })),
    sub_counties_without_wards: unreferenced.map((s) => ({ name: cleanSubCountyName(s.subcounty), county: s.county })),
  };
  return { subCounties, wards, review };
}

function main(argv = process.argv.slice(2)) {
  const read = (p) => readFileSync(join(repoRoot, p));
  const json = (p) => JSON.parse(read(p).toString("utf8"));
  const { subCounties, wards, review } = build({
    counties: json("data/counties.json"),
    repoWards: json("data/wards.json").map(({ sub_county_code, ...w }) => w),
    hdxWards: readDbf(read(`${SOURCE_DIR}/kenya_wards.dbf`)),
    hdxSubCounties: readDbf(read(`${SOURCE_DIR}/ke_subcounty.dbf`)),
  });
  const files = {
    "data/sub-counties.json": `${JSON.stringify(subCounties, null, 2)}\n`,
    "data/wards.json": `${JSON.stringify(wards, null, 2)}\n`,
    [MATCHES]: `${JSON.stringify(review, null, 2)}\n`,
  };
  if (argv.includes("--check")) {
    const stale = Object.entries(files).filter(([path, text]) => read(path).toString("utf8") !== text).map(([path]) => path);
    if (stale.length) {
      console.error(`Out of date: ${stale.join(", ")}\nRun: node scripts/sub-counties/build-hdx.js`);
      return 1;
    }
    console.log("sub-counties, ward links and matches are up to date with the HDX source");
    return 0;
  }
  for (const [path, text] of Object.entries(files)) writeFileSync(join(repoRoot, path), text);
  const linked = wards.filter((w) => w.sub_county_code).length;
  console.log(`Wrote ${subCounties.length} sub-counties; ${linked} of ${wards.length} wards linked (${review.matched.length} not exact, ${review.unlinked.length} unlinked).`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
