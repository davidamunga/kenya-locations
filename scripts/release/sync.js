#!/usr/bin/env node

/**
 * Write each package's version (from its package.json, which Changesets
 * bumps) into every other file that records it, and refresh dependent files
 * such as composer.lock. Runs after `changeset version`.
 *
 *   pnpm release:sync
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { PRODUCTS } from "./manifest.js";
import { repoRoot } from "./paths.js";

export function syncVersions(root = repoRoot) {
  const changes = [];
  for (const product of PRODUCTS) {
    for (const pkg of product.packages) {
      const { version } = JSON.parse(readFileSync(join(root, pkg.dir, "package.json"), "utf8"));
      for (const file of pkg.versionFiles ?? []) {
        const path = join(root, file.path);
        const before = readFileSync(path, "utf8");
        if (file.read(before) === undefined) {
          throw new Error(`${file.describe}: not found`);
        }
        const after = file.write(before, version);
        if (after !== before) {
          writeFileSync(path, after);
          changes.push(`Synced ${file.describe} → ${version}`);
        }
        for (const dep of file.dependents ?? []) {
          const depPath = join(root, dep.path);
          const depBefore = readFileSync(depPath, "utf8");
          const depAfter = dep.write(depBefore, dep.expected(after));
          if (depAfter !== depBefore) {
            writeFileSync(depPath, depAfter);
            changes.push(`Refreshed ${dep.describe}`);
          }
        }
      }
    }
  }
  return changes;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const changes = syncVersions();
  console.log(changes.length ? changes.join("\n") : "Versions already in sync.");
}
