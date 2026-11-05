#!/usr/bin/env node

/**
 * Fail when product source or shared data changed without a new changeset.
 * Docs, tests, generated Dart, and copied Kotlin/Swift JSON do not require one.
 *
 * A change to data/*.json must also bump every product that ships the data
 * (see scripts/release/manifest.js); `pnpm changeset:data` writes one.
 *
 *   node scripts/check-changeset.js [--base origin/main]
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { pathToFileURL } from "url";
import { dataPackages } from "./release/manifest.js";

const SKIP_PREFIXES = [
  "packages/dart/lib/src/generated/",
  "packages/kotlin/src/main/resources/",
  "packages/php/data/",
  "packages/dotnet/src/KenyaLocations/Data/",
];

const PRODUCT_PREFIXES = [
  "data/",
  "packages/js/lib/",
  "packages/react/src/",
  "packages/kotlin/src/main/kotlin/",
  "packages/swift/Sources/",
  "packages/dart/lib/",
  "packages/php/src/",
  "packages/dotnet/src/",
];

export function isChangesetFile(file) {
  return file.startsWith(".changeset/") && file.endsWith(".md") && !file.endsWith("README.md");
}

export function isProductPath(file) {
  if (file.endsWith(".md")) return false;
  if (file.includes("/tests/") || file.includes("/test/")) return false;
  if (/\.(test|spec)\./.test(file)) return false;
  if (SKIP_PREFIXES.some((prefix) => file.startsWith(prefix))) return false;
  if (file.includes("/Resources/") && file.endsWith(".json")) return false;
  return PRODUCT_PREFIXES.some((prefix) => file.startsWith(prefix));
}

/** Package names listed in a changeset's frontmatter. */
export function changesetPackages(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  return [...match[1].matchAll(/^\s*["']?([^"':]+)["']?\s*:/gm)].map((m) => m[1].trim());
}

export function changesetCheck(changedFiles, readChangeset = () => "") {
  const productFiles = changedFiles.filter(isProductPath);
  const changesets = changedFiles.filter(isChangesetFile);

  if (productFiles.length === 0) {
    return { ok: true, productFiles, changesets, reason: "no product files changed" };
  }
  if (changesets.length === 0) {
    return { ok: false, productFiles, changesets, reason: "product files changed without a changeset" };
  }
  if (changedFiles.some((file) => file.startsWith("data/") && file.endsWith(".json"))) {
    const listed = new Set(changesets.flatMap((file) => changesetPackages(readChangeset(file))));
    const missingDataPackages = dataPackages().filter((name) => !listed.has(name));
    if (missingDataPackages.length > 0) {
      return {
        ok: false,
        productFiles,
        changesets,
        missingDataPackages,
        reason: "data changed but not every package that ships it is bumped",
      };
    }
  }
  return { ok: true, productFiles, changesets, reason: "changeset present" };
}

function changedFilesSince(base) {
  const output = execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" });
  return output.trim().split("\n").filter(Boolean);
}

function parseBase(argv) {
  const flag = argv.indexOf("--base");
  if (flag !== -1 && argv[flag + 1]) return argv[flag + 1];
  return "origin/main";
}

function main(argv = process.argv.slice(2)) {
  const base = parseBase(argv);
  const result = changesetCheck(changedFilesSince(base), (file) =>
    existsSync(file) ? readFileSync(file, "utf8") : ""
  );

  if (result.ok) {
    console.log(`Changeset check passed (${result.reason}).`);
    if (result.changesets.length) {
      console.log(`Changesets: ${result.changesets.join(", ")}`);
    }
    return 0;
  }

  if (result.missingDataPackages) {
    console.error("data/*.json changed, but these packages also ship the data and are not bumped:");
    for (const name of result.missingDataPackages) console.error(`  - ${name}`);
    console.error("\nRun `pnpm changeset:data` to write a changeset for the data change.");
    return 1;
  }

  console.error("Product source or data changed without a changeset.");
  console.error("Changed product files:");
  for (const file of result.productFiles) console.error(`  - ${file}`);
  console.error("\nRun `pnpm changeset` and commit the file under .changeset/.");
  console.error("Docs, tests, and CI-only PRs do not need a changeset.");
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
