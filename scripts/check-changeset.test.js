import assert from "node:assert/strict";
import { test } from "node:test";
import { changesetCheck, isChangesetFile, isProductPath } from "./check-changeset.js";

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
  const result = changesetCheck(["data/area.json", ".changeset/add-areas.md"]);
  assert.equal(result.ok, true);
});

test("fails when product files change without a changeset", () => {
  const result = changesetCheck(["packages/js/lib/search.ts"]);
  assert.equal(result.ok, false);
});
