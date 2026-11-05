import assert from "node:assert/strict";
import { test } from "node:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { PRODUCTS, dataPackages } from "./manifest.js";
import { repoRoot } from "./paths.js";
import { syncVersions } from "./sync.js";
import { verifyRelease } from "./verify.js";
import { ENTITIES, diffEntity, renderChangeset } from "./changeset-data.js";

/** Copy just the files the release scripts read into a temp directory. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "kl-release-"));
  const paths = new Set(["data", ".changeset/config.json"]);
  for (const product of PRODUCTS) {
    for (const pkg of product.packages) {
      paths.add(`${pkg.dir}/package.json`);
      for (const file of pkg.versionFiles ?? []) {
        paths.add(file.path);
        for (const dep of file.dependents ?? []) paths.add(dep.path);
      }
    }
    for (const target of product.data) {
      if (target.kind === "copy") paths.add(target.dir);
    }
  }
  for (const path of paths) {
    cpSync(join(repoRoot, path), join(dir, path), { recursive: true });
  }
  return dir;
}

function edit(dir, path, fn) {
  const full = join(dir, path);
  writeFileSync(full, fn(readFileSync(full, "utf8")));
}

function bump(dir, pkgDir, version) {
  edit(dir, `${pkgDir}/package.json`, (text) => {
    const pkg = JSON.parse(text);
    pkg.version = version;
    return `${JSON.stringify(pkg, null, 2)}\n`;
  });
}

test("the repo passes release:verify", () => {
  assert.deepEqual(verifyRelease(), []);
});

test("verify catches a version bump that was not synced, and sync fixes it", () => {
  const dir = fixture();
  try {
    bump(dir, "packages/dart", "9.9.9");
    bump(dir, "packages/php", "9.9.9");
    const problems = verifyRelease(dir);
    assert.ok(problems.some((p) => p.includes("pubspec.yaml")));
    assert.ok(problems.some((p) => p.includes("composer.json")));

    syncVersions(dir);
    assert.deepEqual(verifyRelease(dir), []);
    assert.match(readFileSync(join(dir, "packages/dart/pubspec.yaml"), "utf8"), /^version: 9\.9\.9$/m);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verify catches composer.json bumped without composer.lock", () => {
  const dir = fixture();
  try {
    bump(dir, "packages/php", "9.9.9");
    edit(dir, "packages/php/composer.json", (text) => text.replace(/"version": "[^"]+"/, '"version": "9.9.9"'));
    assert.deepEqual(verifyRelease(dir), [
      "content-hash in packages/php/composer.lock is stale — run `pnpm release:sync`",
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verify catches a stale data copy", () => {
  const dir = fixture();
  try {
    edit(dir, "data/wards.json", (text) => text.replace('"Kilimani"', '"Kilimani Ward"'));
    const problems = verifyRelease(dir);
    assert.ok(problems.some((p) => p.includes("packages/swift/Sources/KenyaLocations/Resources/wards.json")));
    assert.ok(problems.some((p) => p.includes("packages/php/data/wards.json")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verify catches a fixed group with mixed versions", () => {
  const dir = fixture();
  try {
    bump(dir, "packages/swift", "9.9.9");
    assert.ok(verifyRelease(dir).some((p) => p.includes("fixed group")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("data changesets bump one package per product that ships data", () => {
  assert.deepEqual(dataPackages(), ["kenya-locations", "kenya-locations-dart", "kenya-locations-php", "kenya-locations-dotnet"]);
});

const wards = ENTITIES.find((e) => e.file === "wards.json");
const localities = ENTITIES.find((e) => e.file === "locality.json");

test("diffs records by code: added, removed, renamed, moved", () => {
  const before = [
    { code: "0001", name: "Old Name", constituency: "A" },
    { code: "0002", name: "Gone", constituency: "A" },
    { code: "0003", name: "Mover", constituency: "A" },
  ];
  const after = [
    { code: "0001", name: "New Name", constituency: "A" },
    { code: "0003", name: "Mover", constituency: "B" },
    { code: "0004", name: "Fresh", constituency: "B" },
  ];
  assert.deepEqual(diffEntity(wards, before, after).lines, [
    'Renamed ward `0001` from "Old Name" to "New Name"',
    'Changed ward `0003` Mover (B): constituency "A" → "B"',
    "Added ward `0004` Fresh (B)",
    "Removed ward `0002` Gone (A)",
  ]);
});

test("records without codes are keyed by county and name", () => {
  const before = [{ name: "Makadara", county: "Mombasa" }];
  const after = [
    { name: "Makadara", county: "Mombasa" },
    { name: "Makadara", county: "Nairobi" },
  ];
  assert.deepEqual(diffEntity(localities, before, after).lines, ["Added locality Makadara (Nairobi)"]);
});

test("renders a changeset with every data package and the counts", () => {
  const diff = diffEntity(wards, [], [{ code: "0737", name: "Cherang'any/Chebororwa", constituency: "Marakwet West" }]);
  const text = renderChangeset([diff], dataPackages(), "patch");
  assert.equal(
    text,
    `---
"kenya-locations": patch
"kenya-locations-dart": patch
"kenya-locations-php": patch
"kenya-locations-dotnet": patch
---

Data update:

- **Wards** (0 → 1)
  - Added ward \`0737\` Cherang'any/Chebororwa (Marakwet West)
`
  );
});

test("long lists are truncated", () => {
  const after = Array.from({ length: 30 }, (_, i) => ({
    code: String(i + 1).padStart(4, "0"),
    name: `W${i}`,
    constituency: "X",
  }));
  const text = renderChangeset([diffEntity(wards, [], after)], ["kenya-locations"]);
  assert.match(text, /…and 5 more/);
});

test("releases when the tag is missing and the version changed in this push", async () => {
  const { shouldRelease } = await import("./plan.js");
  assert.equal(shouldRelease({ version: "0.2.0", versionBefore: "0.1.1", tagExists: false, hasEarlierTags: false }), true);
});

test("does not release when the tag already exists", async () => {
  const { shouldRelease } = await import("./plan.js");
  assert.equal(shouldRelease({ version: "0.10.0", versionBefore: "0.9.0", tagExists: true, hasEarlierTags: true }), false);
});

test("retries a missed release when earlier tags exist, even with no version change", async () => {
  const { shouldRelease } = await import("./plan.js");
  assert.equal(shouldRelease({ version: "0.10.0", versionBefore: "0.10.0", tagExists: false, hasEarlierTags: true }), true);
});

test("does not tag an untagged product whose version did not change", async () => {
  const { shouldRelease } = await import("./plan.js");
  assert.equal(shouldRelease({ version: "0.10.0", versionBefore: "0.10.0", tagExists: false, hasEarlierTags: false }), false);
  assert.equal(shouldRelease({ version: "0.10.0", versionBefore: undefined, tagExists: false, hasEarlierTags: false }), false);
});

test("extracts one version's section from a changelog", async () => {
  const { changelogSection } = await import("./plan.js");
  const changelog = "# Changelog\n\n## 0.2.0\n\n### Minor Changes\n\n- New thing\n\n## 0.1.0\n\n- Old thing\n";
  assert.equal(changelogSection(changelog, "0.2.0"), "### Minor Changes\n\n- New thing");
  assert.equal(changelogSection(changelog, "0.1.0"), "- Old thing");
  assert.equal(changelogSection(changelog, "9.9.9"), "");
});

test("a field added to every record is one line, not one per record", () => {
  const before = [
    { code: "0001", name: "A", constituency: "X" },
    { code: "0002", name: "B", constituency: "X" },
  ];
  const after = [
    { code: "0001", name: "A", constituency: "X", county_code: "047" },
    { code: "0002", name: "B renamed", constituency: "X", county_code: "047" },
  ];
  assert.deepEqual(diffEntity(wards, before, after).lines, [
    "Added `county_code` to all 2 wards",
    'Renamed ward `0002` from "B" to "B renamed"',
  ]);
});
