import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "child_process";
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { repoRoot } from "../release/paths.js";
import { buildTree, count, parseCsv, titleCase } from "./build-knbs.js";

test("parses quoted CSV fields with commas", () => {
  assert.deepEqual(parseCsv('Region,Total\nKENYA,"47,564,296"\n'), [
    ["Region", "Total"],
    ["KENYA", "47,564,296"],
  ]);
});

test("reads counts with comma or dot thousands separators", () => {
  assert.equal(count("47,564,296"), 47564296);
  assert.equal(count("6.804"), 6804);
  assert.equal(count("-"), 0);
});

test("title-cases Kenyan place names", () => {
  assert.equal(titleCase("ZIWA LA NG'OMBE"), "Ziwa la Ng'ombe");
  assert.equal(titleCase("EL-NUR"), "El-Nur");
  assert.equal(titleCase("MATHARE 4A"), "Mathare 4A");
  assert.equal(titleCase("KAJAJA II"), "Kajaja II");
  assert.equal(titleCase("CBD"), "CBD");
  assert.equal(titleCase("KWA HOLA"), "Kwa Hola");
});

test("recovers levels from population sums, and places zero-population runs", () => {
  const row = (rawName, total) => ({ rawName, total, line: 0 });
  const { counties, problems } = buildTree([
    row("KENYA", 30),
    row("C", 30),
    row("SC", 30),
    row("D", 30),
    row("L1", 10),
    row("SL1", 4),
    row("SL2", 6),
    row("L2", 20),
    row("SL3", 20),
    row("PARK", 0),
    row("PARK", 0),
    row("PARK", 0),
  ]);
  assert.deepEqual(problems, []);
  const sc = counties[0].children[0];
  assert.equal(sc.children.length, 2, "the 3-row park is a division beside D");
  assert.deepEqual(sc.children[0].children.map((l) => l.rawName), ["L1", "L2"]);
  assert.equal(sc.children[1].children[0].children[0].level, "sub_location");
});

test("reports a unit whose children don't add up", () => {
  const row = (rawName, total) => ({ rawName, total, line: 0 });
  const { problems } = buildTree([
    row("KENYA", 10),
    row("C", 10),
    row("SC", 10),
    row("D", 10),
    row("L", 9),
    row("SL", 9),
  ]);
  assert.ok(problems.some((p) => p.includes("children add up to 9, not 10")));
});

test("the committed data/admin files are exactly what the sources build", () => {
  // realpath: on macOS the temp dir is behind a symlink (/var → /private/var).
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "kl-knbs-")));
  try {
    for (const path of ["sources/knbs-2019", "scripts", "data/counties.json"]) {
      cpSync(join(repoRoot, path), join(dir, path), { recursive: true });
    }
    cpSync(join(repoRoot, "package.json"), join(dir, "package.json"));
    execFileSync(process.execPath, [join(dir, "scripts/admin/build-knbs.js")], { stdio: "pipe" });
    for (const file of ["sub-counties.json", "divisions.json", "locations.json", "sub-locations.json"]) {
      assert.equal(
        readFileSync(join(dir, "data/admin", file), "utf8"),
        readFileSync(join(repoRoot, "data/admin", file), "utf8"),
        `data/admin/${file} is out of date — run node scripts/admin/build-knbs.js`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
