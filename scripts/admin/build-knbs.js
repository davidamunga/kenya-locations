#!/usr/bin/env node

/**
 * Build the KNBS administrative hierarchy
 *
 *   County → Sub-county → Division → Location → Sub-location
 *
 * from the 2019 Kenya Population and Housing Census, Volume II, as published
 * by KNBS on openAFRICA (CC BY 4.0). Sources are in sources/knbs-2019/.
 *
 *   node scripts/admin/build-knbs.js
 *
 * The source is one flat table of names and populations with no level
 * column. The levels are recovered from the numbers: every unit's population
 * equals the sum of its children's. Units with no population (national
 * parks, forests) appear as a run of the same name, one row per level down
 * to sub-location, so the run length gives their level.
 *
 * Codes are assigned here, in KNBS order within each parent, two digits per
 * level after the IEBC county code:
 *   sub-county 00101 · division 0010101 · location 001010101 · sub-location 00101010101
 * They are this project's codes, not official KNBS codes.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { repoRoot } from "../release/paths.js";

const SOURCES = join(repoRoot, "sources/knbs-2019");
const OUT = join(repoRoot, "data/admin");
const LEVELS = ["county", "sub_county", "division", "location", "sub_location"];
const LEAF = LEVELS.length - 1;

/**
 * Names garbled in the scanned source. "rg" stands in for an apostrophe.
 */
export const NAME_FIXES = {
  "MrgOBARAKA CHEMBE": "M'OBARAKA CHEMBE",
  GATONGrgOORA: "GATONG'OORA",
  MANGrgOU: "MANG'OU",
  KOMOR_BULLA: "KOMOR BULLA",
  "UPPER PARKLAI IDS": "UPPER PARKLANDS",
};

/** Minimal CSV parser (quoted fields, commas inside quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** A head count. The scan sometimes uses "." for thousands ("6.804"). */
export function count(value) {
  let s = (value ?? "").trim();
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, "");
  s = s.replace(/,/g, "");
  return /^\d+$/.test(s) ? Number(s) : 0;
}

/** An area in km² ("580,895.4"). */
export function area(value) {
  const n = Number.parseFloat((value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const SMALL_WORDS = new Set(["la", "wa", "ya", "za", "cha", "na", "kwa", "of", "and"]);
const ROMAN = /^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/;

function capitalize(word) {
  // Keep the letter after an apostrophe lower case: NG'OMBENI → Ng'ombeni.
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** "ZIWA LA NG'OMBE" → "Ziwa la Ng'ombe", "EL-NUR" → "El-Nur", "KAAGA 1" → "Kaaga 1". */
export function titleCase(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      if (ROMAN.test(word) || /\d/.test(word)) return word;
      // Acronyms with no vowels (CBD) stay upper case.
      if (word.length <= 4 && !/[AEIOU]/.test(word) && /^[A-Z]+$/.test(word)) return word;
      return word
        .split(/([-/])/)
        .map((part) => (part === "-" || part === "/" ? part : capitalize(part)))
        .join("");
    })
    .join(" ");
}

function fold(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Read the population table and the land-area table (same rows, same order). */
function readSources() {
  const population = parseCsv(readFileSync(join(SOURCES, "population-by-sex-and-sub-location.csv"), "utf8").replace(/^﻿/, ""));
  const land = parseCsv(readFileSync(join(SOURCES, "land-area-by-sub-location.csv"), "utf8").replace(/^﻿/, ""));
  const rows = [];
  const landRows = land.slice(1).filter((r) => (r[0] ?? "").trim());
  population.slice(1).forEach((r, i) => {
    const name = (r[0] ?? "").trim();
    if (!name) return;
    const landRow = landRows[rows.length];
    if (!landRow || landRow[0].trim() !== name) {
      throw new Error(`land-area table is out of step at "${name}" (csv line ${i + 2})`);
    }
    rows.push({
      line: i + 2,
      rawName: name,
      total: count(r[1]),
      male: count(r[2]),
      female: count(r[3]),
      area: area(landRow[1]),
    });
  });
  return rows;
}

/** Rebuild the tree. Returns { counties, problems }. */
export function buildTree(rows) {
  if (rows[0]?.rawName !== "KENYA") throw new Error("expected the first row to be KENYA");
  const root = { depth: -1, total: rows[0].total, remaining: rows[0].total, children: [] };
  const stack = [root];
  const problems = [];
  const node = (row, depth) => ({ ...row, depth, level: LEVELS[depth], remaining: row.total, children: [] });

  let i = 1;
  while (i < rows.length) {
    const row = rows[i];
    if (row.total === 0) {
      let j = i;
      while (j < rows.length && rows[j].total === 0 && fold(rows[j].rawName) === fold(row.rawName)) j++;
      const run = j - i;
      const depth = LEAF - run + 1;
      if (depth < 1) problems.push(`zero-population run at line ${row.line} is too long`);
      while (stack.at(-1).depth > depth - 1) stack.pop();
      if (stack.at(-1).depth !== depth - 1) problems.push(`no parent for zero-population unit at line ${row.line}`);
      let parent = stack.at(-1);
      for (let k = 0; k < run; k++) {
        const child = node(rows[i + k], depth + k);
        parent.children.push(child);
        parent = child;
      }
      i = j;
      continue;
    }
    while (stack.at(-1).depth === LEAF || (stack.at(-1).depth >= 0 && stack.at(-1).remaining <= 0)) stack.pop();
    const parent = stack.at(-1);
    if (row.total > parent.remaining) {
      problems.push(`line ${row.line} ${row.rawName} (${row.total}) is more than what's left of its parent (${parent.remaining})`);
    }
    parent.remaining -= row.total;
    const child = node(row, parent.depth + 1);
    parent.children.push(child);
    stack.push(child);
    i++;
  }

  const walk = function* (n) {
    yield n;
    for (const c of n.children) yield* walk(c);
  };
  for (const n of walk(root)) {
    if (n === root || n.depth === LEAF || n.total === 0) continue;
    if (n.remaining !== 0) problems.push(`${n.level} ${n.rawName} (line ${n.line}): children add up to ${n.total - n.remaining}, not ${n.total}`);
  }
  return { counties: root.children, problems };
}

/** Flatten the tree into one record list per level, with codes. */
export function toRecords(counties, ourCounties) {
  const byName = new Map();
  for (const c of ourCounties) {
    for (const name of [c.name, ...(c.aliases ?? [])]) byName.set(fold(name), c);
  }
  const out = { sub_county: [], division: [], location: [], sub_location: [] };
  const problems = [];

  for (const knbsCounty of counties) {
    const county = byName.get(fold(knbsCounty.rawName)) ?? byName.get(fold(knbsCounty.rawName.replace(/ CITY$/, "")));
    if (!county) {
      problems.push(`no county code for ${knbsCounty.rawName}`);
      continue;
    }
    if (county.population_2019 !== knbsCounty.total) {
      problems.push(`${county.name}: counties.json population_2019 is ${county.population_2019}, KNBS total is ${knbsCounty.total}`);
    }
    const visit = (unit, parentCode, ancestry) => {
      unit.children.forEach((child, index) => {
        const code = `${parentCode}${String(index + 1).padStart(2, "0")}`;
        const raw = NAME_FIXES[child.rawName] ?? child.rawName;
        if (/[a-z_]/.test(raw)) problems.push(`unexpected characters in "${raw}" (line ${child.line})`);
        const record = {
          code,
          name: titleCase(raw),
          ...ancestry.names,
          county_code: county.code,
          ...ancestry.codes,
          population_2019: child.total,
          area_km2: child.area,
        };
        out[child.level].push(record);
        const nameKey = child.level;
        visit(child, code, {
          names: { [nameKey]: record.name },
          codes: { ...ancestry.codes, [`${nameKey}_code`]: code },
        });
      });
    };
    visit(knbsCounty, county.code, { names: { county: county.name }, codes: {} });
  }
  return { records: out, problems };
}

function main() {
  const rows = readSources();
  const { counties, problems: treeProblems } = buildTree(rows);
  const ourCounties = JSON.parse(readFileSync(join(repoRoot, "data/counties.json"), "utf8"));
  const { records, problems } = toRecords(counties, ourCounties);
  const all = [...treeProblems, ...problems];
  if (all.length) {
    console.error("KNBS build problems:");
    for (const p of all) console.error(`  - ${p}`);
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });
  const files = {
    sub_county: "sub-counties.json",
    division: "divisions.json",
    location: "locations.json",
    sub_location: "sub-locations.json",
  };
  for (const [level, file] of Object.entries(files)) {
    writeFileSync(join(OUT, file), `${JSON.stringify(records[level], null, 2)}\n`);
    console.log(`Wrote data/admin/${file} (${records[level].length.toLocaleString("en-US")})`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
