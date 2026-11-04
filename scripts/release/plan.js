#!/usr/bin/env node

/**
 * Decide which products need a release, from versions and git tags rather
 * than the merge commit's title.
 *
 * A product is released when its tag (from the manifest, e.g. v0.10.0,
 * react-v0.10.0, dart-v0.2.0, php-v0.2.0) doesn't exist yet and either:
 * - the product already has earlier tags (so a missed or failed release is
 *   retried on the next push), or
 * - its version changed in this push (the first tagged release).
 *
 *   node scripts/release/plan.js [--before <sha>]   # GitHub Actions outputs
 *   node scripts/release/plan.js --json [--before <sha>]
 *   node scripts/release/plan.js notes <product>    # release notes for the current version
 */

import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { PRODUCTS } from "./manifest.js";
import { repoRoot } from "./paths.js";

export function shouldRelease({ version, versionBefore, tagExists, hasEarlierTags }) {
  if (!version || tagExists) return false;
  if (hasEarlierTags) return true;
  return versionBefore !== undefined && versionBefore !== version;
}

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return undefined;
  }
}

function currentVersion(pkgDir) {
  return JSON.parse(readFileSync(join(repoRoot, pkgDir, "package.json"), "utf8")).version;
}

function versionAt(ref, pkgDir) {
  const text = tryGit(["show", `${ref}:${pkgDir}/package.json`]);
  return text ? JSON.parse(text).version : undefined;
}

/** Tag prefix for a product, e.g. "react-v" from react-v{version}. */
function tagPrefix(product) {
  return product.tag("\u0000").split("\u0000")[0];
}

export function planReleases({ before } = {}) {
  // github.event.before is all zeros for a new branch, and absent on workflow_dispatch.
  const hasBefore =
    before && !/^0+$/.test(before) && tryGit(["cat-file", "-e", `${before}^{commit}`]) !== undefined;
  return PRODUCTS.map((product) => {
    const pkg = product.packages[0];
    const version = currentVersion(pkg.dir);
    const tag = product.tag(version);
    const prefix = tagPrefix(product);
    const earlier = (tryGit(["tag", "--list", `${prefix}*`]) ?? "")
      .split("\n")
      .filter((t) => t && /^\d/.test(t.slice(prefix.length)));
    const tagExists = tryGit(["rev-parse", "-q", "--verify", `refs/tags/${tag}`]) !== undefined;
    const versionBefore = hasBefore ? versionAt(before, pkg.dir) : undefined;
    return {
      id: product.id,
      package: pkg.name,
      version,
      tag,
      release: shouldRelease({ version, versionBefore, tagExists, hasEarlierTags: earlier.length > 0 }),
    };
  });
}

/** The changelog section for `version` from a CHANGELOG.md. */
export function changelogSection(changelog, version) {
  const lines = changelog.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) return "";
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join("\n")
    .trim();
}

function notes(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) throw new Error(`unknown product "${productId}"`);
  const lines = [];
  for (const pkg of product.packages) {
    const { name, version } = JSON.parse(readFileSync(join(repoRoot, pkg.dir, "package.json"), "utf8"));
    let section;
    try {
      section = changelogSection(readFileSync(join(repoRoot, pkg.dir, "CHANGELOG.md"), "utf8"), version);
    } catch {
      // no changelog yet
    }
    if (!section) continue;
    if (product.packages.length > 1) lines.push(`## ${name}\n`);
    lines.push(section, "");
  }
  return lines.join("\n").trim() || `Release ${product.tag(currentVersion(product.packages[0].dir))}`;
}

function main(argv = process.argv.slice(2)) {
  if (argv[0] === "notes") {
    process.stdout.write(`${notes(argv[1])}\n`);
    return 0;
  }
  const i = argv.indexOf("--before");
  const plan = planReleases({ before: i !== -1 ? argv[i + 1] : undefined });
  if (argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    return 0;
  }
  // GitHub Actions step outputs.
  const out = [`plan=${JSON.stringify(plan)}`, `any=${plan.some((p) => p.release)}`];
  for (const p of plan) {
    out.push(`${p.id}=${p.release}`, `${p.id}_version=${p.version}`, `${p.id}_tag=${p.tag}`);
  }
  process.stdout.write(`${out.join("\n")}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
