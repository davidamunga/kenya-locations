import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "fs";
import { join } from "path";
import { SOURCE_DIR, build, cleanSubCountyName, readDbf, similarity } from "./build-hdx.js";
import { repoRoot } from "../release/paths.js";

const read = (path) => readFileSync(join(repoRoot, path));
const json = (path) => JSON.parse(read(path).toString("utf8"));

function rebuild() {
  return build({
    counties: json("data/counties.json"),
    repoWards: json("data/wards.json").map(({ sub_county_code, ...w }) => w),
    hdxWards: readDbf(read(`${SOURCE_DIR}/kenya_wards.dbf`)),
    hdxSubCounties: readDbf(read(`${SOURCE_DIR}/ke_subcounty.dbf`)),
  });
}

test("the data files are exactly what the HDX source builds", () => {
  const { subCounties, wards, review } = rebuild();
  assert.equal(read("data/sub-counties.json").toString("utf8"), `${JSON.stringify(subCounties, null, 2)}\n`);
  assert.equal(read("data/wards.json").toString("utf8"), `${JSON.stringify(wards, null, 2)}\n`);
  assert.equal(read(`${SOURCE_DIR}/matches.json`).toString("utf8"), `${JSON.stringify(review, null, 2)}\n`);
});

test("every ward is linked to a sub-county in its own county", () => {
  const { subCounties, wards } = rebuild();
  const byCode = new Map(subCounties.map((s) => [s.code, s]));
  assert.equal(wards.length, 1450);
  for (const w of wards) {
    assert.ok(byCode.has(w.sub_county_code), `ward ${w.code} (${w.name}) has no sub-county`);
    assert.equal(byCode.get(w.sub_county_code).county_code, w.county_code, `ward ${w.code}`);
  }
});

test("sub-counties have unique five-digit codes starting with their county code", () => {
  const { subCounties } = rebuild();
  assert.equal(subCounties.length, 302);
  assert.equal(new Set(subCounties.map((s) => s.code)).size, subCounties.length);
  for (const s of subCounties) {
    assert.match(s.code, /^\d{5}$/);
    assert.ok(s.code.startsWith(s.county_code));
  }
});

test("sub-counties nobody points to are left out and reported", () => {
  const { subCounties, review } = rebuild();
  assert.deepEqual(review.sub_counties_without_wards.map((s) => s.name).sort(), ["Kalama", "Tiaty"]);
  assert.equal(subCounties.some((s) => s.name === "Tiaty"), false);
});

test("most wards match by exact name; the rest are listed for review", () => {
  const { review } = rebuild();
  assert.equal(review.matched.length, 104);
  assert.equal(review.unlinked.length, 0);
  for (const m of review.matched) assert.ok(["guided", "fuzzy", "inferred"].includes(m.method));
});

test("cleans HDX sub-county names", () => {
  assert.equal(cleanSubCountyName("Mvita  Sub County"), "Mvita");
  assert.equal(cleanSubCountyName("Marakwet East sub-county"), "Marakwet East");
  assert.equal(cleanSubCountyName("NORTH HORR"), "North Horr");
  assert.equal(cleanSubCountyName("Kitui West  Sub County"), "Kitui West");
});

test("similarity is 1 for equal names and falls with edits", () => {
  assert.equal(similarity("karen", "karen"), 1);
  assert.ok(similarity("kiliwehiri", "kiliwaheri") >= 0.7);
  assert.ok(similarity("abc", "xyz") < 0.2);
});
