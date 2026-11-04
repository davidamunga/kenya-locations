#!/usr/bin/env node

/**
 * Check that everything a release depends on is consistent, so problems show
 * up on the feature PR instead of the version PR:
 *
 * - every recorded version matches its package.json
 * - dependent files are fresh (composer.lock content-hash)
 * - packages in a Changesets "fixed" group share one version
 * - every committed copy of data/*.json matches data/
 *
 *   pnpm release:verify
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { PRODUCTS } from "./manifest.js";
import { repoRoot } from "./paths.js";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function verifyRelease(root = repoRoot) {
  const problems = [];
  const versions = new Map();

  for (const product of PRODUCTS) {
    for (const pkg of product.packages) {
      const { name, version } = readJson(join(root, pkg.dir, "package.json"));
      if (name !== pkg.name) {
        problems.push(`${pkg.dir}/package.json is named "${name}", manifest says "${pkg.name}"`);
      }
      versions.set(pkg.name, version);

      for (const file of pkg.versionFiles ?? []) {
        const text = readFileSync(join(root, file.path), "utf8");
        const recorded = file.read(text);
        if (recorded !== version) {
          problems.push(`${file.describe} is ${recorded ?? "missing"}, package.json is ${version} — run \`pnpm release:sync\``);
        }
        for (const dep of file.dependents ?? []) {
          const expected = dep.expected(text);
          const actual = dep.read(readFileSync(join(root, dep.path), "utf8"));
          if (actual !== expected) {
            problems.push(`${dep.describe} is stale — run \`pnpm release:sync\``);
          }
        }
      }
    }

    for (const target of product.data) {
      if (target.kind !== "copy") continue;
      const dataDir = join(root, "data");
      const copyDir = join(root, target.dir);
      for (const name of readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
        const copy = join(copyDir, name);
        if (!existsSync(copy)) {
          problems.push(`${target.dir}/${name} is missing — run \`pnpm data:sync\``);
        } else if (!readFileSync(copy).equals(readFileSync(join(dataDir, name)))) {
          problems.push(`${target.dir}/${name} differs from data/${name} — run \`pnpm data:sync\``);
        }
      }
    }
  }

  const config = readJson(join(root, ".changeset/config.json"));
  for (const group of config.fixed ?? []) {
    const found = group.map((name) => [name, versions.get(name)]);
    const distinct = new Set(found.map(([, v]) => v));
    if (distinct.size > 1) {
      problems.push(`fixed group has mixed versions: ${found.map(([n, v]) => `${n}@${v}`).join(", ")}`);
    }
  }

  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = verifyRelease();
  if (problems.length) {
    console.error("Release check failed:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log("Release check passed: versions, lock files and data copies are consistent.");
}
