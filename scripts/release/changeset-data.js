#!/usr/bin/env node

/**
 * Write a changeset for a data/*.json change, generated from the diff.
 *
 * Lists every added, removed and changed record by code (or by county +
 * name for localities and areas), and bumps every product that ships the
 * data (from the release manifest), so Dart and PHP can't be forgotten.
 *
 *   pnpm changeset:data                  # compare with origin/main, write .changeset/data-*.md
 *   pnpm changeset:data --base main      # compare with another ref
 *   pnpm changeset:data --bump minor     # default: patch
 *   pnpm changeset:data --dry-run        # print instead of writing
 */

import { execFileSync } from "child_process";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { dataPackages } from "./manifest.js";
import { repoRoot } from "./paths.js";

/** How to identify and describe each kind of record. */
export const ENTITIES = [
  {
    file: "counties.json",
    singular: "county",
    plural: "Counties",
    key: (r) => r.code,
    label: (r) => `\`${r.code}\` ${r.name}`,
  },
  {
    file: "constituencies.json",
    singular: "constituency",
    plural: "Constituencies",
    key: (r) => r.code,
    label: (r) => `\`${r.code}\` ${r.name} (${r.county})`,
  },
  {
    file: "sub-counties.json",
    singular: "sub-county",
    plural: "Sub-counties",
    key: (r) => r.code,
    label: (r) => `\`${r.code}\` ${r.name} (${r.county})`,
  },
  {
    file: "wards.json",
    singular: "ward",
    plural: "Wards",
    key: (r) => r.code,
    label: (r) => `\`${r.code}\` ${r.name} (${r.constituency})`,
  },
  {
    file: "locality.json",
    singular: "locality",
    plural: "Localities",
    key: (r) => `${r.county}|${r.name}`,
    label: (r) => `${r.name} (${r.county})`,
  },
  {
    file: "area.json",
    singular: "area",
    plural: "Areas",
    key: (r) => `${r.county}|${r.locality}|${r.name}`,
    label: (r) => `${r.name} (${r.locality}, ${r.county})`,
  },
];

const MAX_LINES_PER_KIND = 25;

function formatValue(value) {
  return typeof value === "string" ? `"${value}"` : String(value);
}

/** Compare two lists of records of one kind. */
export function diffEntity(entity, before, after) {
  const beforeByKey = new Map(before.map((r) => [entity.key(r), r]));
  const afterByKey = new Map(after.map((r) => [entity.key(r), r]));
  const lines = [];

  for (const [key, record] of afterByKey) {
    const old = beforeByKey.get(key);
    if (!old) {
      lines.push(`Added ${entity.singular} ${entity.label(record)}`);
      continue;
    }
    const fields = [...new Set([...Object.keys(old), ...Object.keys(record)])];
    const changed = fields.filter((f) => JSON.stringify(old[f]) !== JSON.stringify(record[f]));
    if (changed.length === 0) continue;
    if (changed.length === 1 && changed[0] === "name") {
      lines.push(
        `Renamed ${entity.singular} \`${key}\` from ${formatValue(old.name)} to ${formatValue(record.name)}`
      );
    } else {
      const details = changed
        .map((f) => `${f} ${formatValue(old[f])} → ${formatValue(record[f])}`)
        .join(", ");
      lines.push(`Changed ${entity.singular} ${entity.label(record)}: ${details}`);
    }
  }
  for (const [key, record] of beforeByKey) {
    if (!afterByKey.has(key)) lines.push(`Removed ${entity.singular} ${entity.label(record)}`);
  }

  return { entity, lines, countBefore: before.length, countAfter: after.length };
}

/** Diff every data file. `read(file, side)` returns the parsed records. */
export function diffData(read) {
  return ENTITIES.map((entity) =>
    diffEntity(entity, read(entity.file, "before"), read(entity.file, "after"))
  ).filter((d) => d.lines.length > 0 || d.countBefore !== d.countAfter);
}

/** The changeset file text. */
export function renderChangeset(diffs, packages, bump = "patch") {
  const frontmatter = packages.map((name) => `"${name}": ${bump}`).join("\n");
  const sections = diffs.map((d) => {
    const shown = d.lines.slice(0, MAX_LINES_PER_KIND).map((line) => `  - ${line}`);
    if (d.lines.length > MAX_LINES_PER_KIND) {
      shown.push(`  - …and ${d.lines.length - MAX_LINES_PER_KIND} more`);
    }
    const count =
      d.countBefore === d.countAfter
        ? `${d.countAfter.toLocaleString("en-US")}`
        : `${d.countBefore.toLocaleString("en-US")} → ${d.countAfter.toLocaleString("en-US")}`;
    return [`- **${d.entity.plural}** (${count})`, ...shown].join("\n");
  });
  return `---\n${frontmatter}\n---\n\nData update:\n\n${sections.join("\n")}\n`;
}

function parseArgs(argv) {
  const value = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  return {
    base: value("--base", "origin/main"),
    bump: value("--bump", "patch"),
    dryRun: argv.includes("--dry-run"),
  };
}

function readAtRef(ref, path) {
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "[]";
  }
}

function main(argv = process.argv.slice(2)) {
  const { base, bump, dryRun } = parseArgs(argv);
  if (!["patch", "minor", "major"].includes(bump)) {
    console.error(`--bump must be patch, minor or major (got "${bump}")`);
    return 1;
  }

  const diffs = diffData((file, side) =>
    JSON.parse(
      side === "before"
        ? readAtRef(base, `data/${file}`)
        : readFileSync(join(repoRoot, "data", file), "utf8")
    )
  );
  if (diffs.length === 0) {
    console.error(`No changes in data/*.json compared with ${base}.`);
    return 1;
  }

  const text = renderChangeset(diffs, dataPackages(), bump);
  if (dryRun) {
    process.stdout.write(text);
    return 0;
  }

  const id = createHash("sha1").update(text).digest("hex").slice(0, 8);
  const path = join(repoRoot, ".changeset", `data-${id}.md`);
  if (existsSync(path)) {
    console.log(`Already written: .changeset/data-${id}.md`);
    return 0;
  }
  writeFileSync(path, text);
  console.log(`Wrote .changeset/data-${id}.md (${dataPackages().join(", ")}: ${bump}).`);
  console.log("Edit the summary if you want to add context, then commit it with your data change.");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
