#!/usr/bin/env node

/**
 * Fail when product source or shared data changed without a new changeset.
 * Docs, tests, generated Dart, and copied Kotlin/Swift JSON do not require one.
 *
 *   node scripts/check-changeset.js [--base origin/main]
 */

import { execSync } from "child_process";
import { pathToFileURL } from "url";

const SKIP_PREFIXES = [
  "packages/dart/lib/src/generated/",
  "packages/kotlin/src/main/resources/",
  "packages/php/data/",
];

const PRODUCT_PREFIXES = [
  "data/",
  "packages/js/lib/",
  "packages/react/src/",
  "packages/kotlin/src/main/kotlin/",
  "packages/swift/Sources/",
  "packages/dart/lib/",
  "packages/php/src/",
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

export function changesetCheck(changedFiles) {
  const productFiles = changedFiles.filter(isProductPath);
  const changesets = changedFiles.filter(isChangesetFile);

  if (productFiles.length === 0) {
    return { ok: true, productFiles, changesets, reason: "no product files changed" };
  }
  if (changesets.length > 0) {
    return { ok: true, productFiles, changesets, reason: "changeset present" };
  }
  return { ok: false, productFiles, changesets, reason: "product files changed without a changeset" };
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
  const result = changesetCheck(changedFilesSince(base));

  if (result.ok) {
    console.log(`Changeset check passed (${result.reason}).`);
    if (result.changesets.length) {
      console.log(`Changesets: ${result.changesets.join(", ")}`);
    }
    return 0;
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
