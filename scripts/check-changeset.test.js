import assert from "node:assert/strict";
import { test } from "node:test";
import { changesetCheck, changesetPackages, isChangesetFile, isProductPath } from "./check-changeset.js";

test("treats shared JSON and package source as product files", () => {
  assert.equal(isProductPath("data/counties.json"), true);
  assert.equal(isProductPath("packages/js/lib/search.ts"), true);
  assert.equal(isProductPath("packages/react/src/hooks/useSearch.ts"), true);
  assert.equal(isProductPath("packages/kotlin/src/main/kotlin/ke/locations/KenyaLocations.kt"), true);
  assert.equal(isProductPath("packages/swift/Sources/KenyaLocations/Search.swift"), true);
  assert.equal(isProductPath("packages/dart/lib/kenya_locations.dart"), true);
  assert.equal(isProductPath("packages/php/src/KenyaLocations.php"), true);
});

test("skips docs, tests, generated Dart, and copied native JSON", () => {
  assert.equal(isProductPath("README.md"), false);
  assert.equal(isProductPath("packages/js/lib/tests/search.test.ts"), false);
  assert.equal(isProductPath("packages/dart/lib/src/generated/data.dart"), false);
  assert.equal(isProductPath("packages/kotlin/src/main/resources/counties.json"), false);
  assert.equal(isProductPath("packages/swift/Sources/KenyaLocations/Resources/wards.json"), false);
  assert.equal(isProductPath("packages/php/data/counties.json"), false);
  assert.equal(isProductPath("packages/php/tests/KenyaLocationsTest.php"), false);
  assert.equal(isProductPath(".github/workflows/ci.yml"), false);
});

test("recognizes changeset files and ignores the folder README", () => {
  assert.equal(isChangesetFile(".changeset/red-lions.md"), true);
  assert.equal(isChangesetFile(".changeset/README.md"), false);
});

test("passes when only docs or CI changed", () => {
  const result = changesetCheck(["README.md", ".github/workflows/ci.yml"]);
  assert.equal(result.ok, true);
});

test("passes when product files ship with a changeset", () => {
  const result = changesetCheck(["packages/js/lib/search.ts", ".changeset/fix-search.md"]);
  assert.equal(result.ok, true);
});

const dataChangeset = `---
"kenya-locations": patch
"kenya-locations-dart": patch
"kenya-locations-php": patch
---

Data update:
`;

test("passes when a data change bumps every package that ships the data", () => {
  const result = changesetCheck(["data/area.json", ".changeset/add-areas.md"], () => dataChangeset);
  assert.equal(result.ok, true);
});

test("fails when a data change skips a package that ships the data", () => {
  const coreOnly = `---\n"kenya-locations": patch\n---\n\nAdd areas.\n`;
  const result = changesetCheck(["data/area.json", ".changeset/add-areas.md"], () => coreOnly);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingDataPackages, ["kenya-locations-dart", "kenya-locations-php"]);
});

test("data packages can be spread across several changesets", () => {
  const files = { ".changeset/a.md": `---\n"kenya-locations": patch\n---\n\nA\n`, ".changeset/b.md": `---\nkenya-locations-dart: patch\n'kenya-locations-php': minor\n---\n\nB\n` };
  const result = changesetCheck(["data/wards.json", ".changeset/a.md", ".changeset/b.md"], (f) => files[f]);
  assert.equal(result.ok, true);
});

test("reads package names from changeset frontmatter", () => {
  assert.deepEqual(changesetPackages(dataChangeset), [
    "kenya-locations",
    "kenya-locations-dart",
    "kenya-locations-php",
  ]);
  assert.deepEqual(changesetPackages("no frontmatter"), []);
});

test("fails when product files change without a changeset", () => {
  const result = changesetCheck(["packages/js/lib/search.ts"]);
  assert.equal(result.ok, false);
});

test("the unshipped KNBS hierarchy in data/admin/ needs no changeset yet", () => {
  assert.equal(changesetCheck(["data/admin/locations.json", "scripts/admin/build-knbs.js"]).ok, true);
  assert.equal(isProductPath("data/admin/sub-locations.json"), false);
});
