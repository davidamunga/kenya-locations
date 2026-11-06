#!/usr/bin/env node

/**
 * Import contributed areas from the public submissions sheet into data/*.json.
 *
 *   node scripts/submissions/import.js                    # fetch the sheet, edit data, write a changeset
 *   node scripts/submissions/import.js --dry-run          # show what would change, write nothing
 *   node scripts/submissions/import.js --csv rows.csv     # read a local CSV instead of the sheet
 *   node scripts/submissions/import.js --pr-body out.md   # also write the pull request description
 *   node scripts/submissions/import.js --max 25           # at most 25 areas per run (default 50)
 *
 * The sheet is read through its public CSV export, so no API key is needed:
 *   SUBMISSIONS_SHEET_ID     the id in the sheet's URL (required unless --csv)
 *   SUBMISSIONS_SHEET_NAME   the tab to read (default "Submissions")
 *
 * Imported and rejected rows are recorded in sources/submissions/ledger.json,
 * so a row is handled once and a re-run changes nothing. With changes made,
 * the script prints `changed=true` and `count=N` for GitHub Actions; the
 * workflow then validates, syncs the package copies and opens the PR.
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { pathToFileURL } from "url";
import { dataPackages } from "../release/manifest.js";
import { diffData, renderChangeset } from "../release/changeset-data.js";
import { repoRoot } from "../release/paths.js";
import { applySubmissions, creditNames, csvToRecords, pullRequestBody } from "./lib.js";
import { createHash } from "crypto";

const LEDGER = "sources/submissions/ledger.json";


function readJson(path, fallback) {
  const full = join(repoRoot, path);
  return existsSync(full) ? JSON.parse(readFileSync(full, "utf8")) : fallback;
}

function writeJson(path, value) {
  const full = join(repoRoot, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`);
}

/** A step output for GitHub Actions, or a line on stdout when run by hand. */
function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  else console.log(`${name}=${value}`);
}

function parseArgs(argv) {
  const value = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : undefined;
  };
  return {
    dryRun: argv.includes("--dry-run"),
    csv: value("--csv"),
    prBody: value("--pr-body"),
    max: value("--max") ? Number(value("--max")) : undefined,
  };
}

async function loadCsv({ csv }) {
  if (csv) return readFileSync(csv, "utf8");
  const id = process.env.SUBMISSIONS_SHEET_ID;
  if (!id) throw new Error("Set SUBMISSIONS_SHEET_ID (or pass --csv <file>).");
  const sheet = process.env.SUBMISSIONS_SHEET_NAME || "Submissions";
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Could not read the sheet (HTTP ${response.status}). Is it shared as "Anyone with the link can view"?`);
  }
  const text = await response.text();
  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error('The sheet returned a web page, not CSV. Share it as "Anyone with the link can view" and check the tab name.');
  }
  return text;
}

export async function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const today = new Date().toISOString().slice(0, 10);

  const counties = readJson("data/counties.json", []);
  const localities = readJson("data/locality.json", []);
  const areas = readJson("data/area.json", []);
  const ledger = readJson(LEDGER, {});

  const records = csvToRecords(await loadCsv(options));
  const result = applySubmissions({ counties, localities, areas }, records, ledger, {
    max: options.max,
    today,
  });
  const { accepted, rejected, deferred } = result;

  console.log(`Read ${records.length} row(s): ${accepted.length} to add, ${rejected.length} skipped, ${deferred} deferred.`);
  for (const { record, reason } of rejected) console.log(`  skipped "${record.area ?? ""}" (${record.locality ?? ""}): ${reason}`);

  const body = pullRequestBody(result);
  if (options.dryRun) process.stdout.write(`\n${body}`);
  // Rows that were only skipped are not worth a PR: they are re-checked next run, and recorded once a PR has something to add.
  if (options.dryRun || accepted.length === 0) {
    setOutput("changed", "false");
    setOutput("count", "0");
    return 0;
  }

  {
    writeJson(LEDGER, { ...ledger, ...result.ledgerEntries });
    writeJson("data/locality.json", result.localities);
    writeJson("data/area.json", result.areas);

    const diffs = diffData((file, side) => {
      const before = { "locality.json": localities, "area.json": areas };
      const after = { "locality.json": result.localities, "area.json": result.areas };
      const other = readJson(`data/${file}`, []);
      return side === "before" ? (before[file] ?? other) : (after[file] ?? other);
    });
    const credits = creditNames(accepted);
    let changeset = renderChangeset(diffs, dataPackages(), "patch");
    // The summary ends at the list; a Credit line is read by .changeset/changelog.cjs and not printed.
    if (credits.length > 0) changeset += `\nCredit: ${credits.join(", ")}\n`;
    const id = createHash("sha1").update(changeset).digest("hex").slice(0, 8);
    writeFileSync(join(repoRoot, ".changeset", `data-${id}.md`), changeset);
    console.log(`Wrote .changeset/data-${id}.md`);
  }
  if (options.prBody) writeFileSync(options.prBody, body);

  setOutput("changed", "true");
  setOutput("count", String(accepted.length));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then(
    (code) => process.exit(code),
    (error) => {
      console.error(`::error::${error.message}`);
      process.exit(1);
    }
  );
}
