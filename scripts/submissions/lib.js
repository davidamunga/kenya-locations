/**
 * Turn rows from the public submissions sheet into data/*.json changes.
 *
 * Pure functions only: no network and no files, so every rule is tested in
 * import.test.js. import.js does the I/O.
 *
 * The sheet is filled by the Apps Script endpoint (scripts/submissions/apps-script)
 * with these columns, in any order:
 *
 *   id, submitted_at, type, county_code, locality, area, display_name, status
 *
 * Only `type = area` rows are imported for now. A maintainer can set `status`
 * to `rejected` (or `spam`, `ignore`) in the sheet to keep a row out of the PR.
 */

export const MAX_NAME_LENGTH = 60;
export const MIN_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 40;
const MAX_BATCH_DEFAULT = 50;
const REJECTED_STATUSES = new Set(["rejected", "reject", "spam", "ignore", "ignored", "duplicate"]);

/** Names of places: letters, digits and the punctuation real names use. */
const PLACE_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '’.,\-/&()]*$/u;
const HAS_LETTER = /\p{L}/u;

/** RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true; // a quote opens a quoted field only at the start of a field; elsewhere it is text
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Header row + data rows → objects keyed by lowercase, snake_case header. */
export function csvToRecords(text) {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  return rows.map((cells) => Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? "").trim()])));
}

/** Lowercase, accents and punctuation removed: the same idea as validate-data's near-duplicate check. */
export function fold(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** NFC, one line, single spaces. */
export function tidy(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashId(record) {
  // A stable id for rows the script did not number: the same row hashes the same.
  const text = [record.submitted_at, record.county_code, record.locality, record.area].join("|");
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `row-${h.toString(16)}`;
}

/** The id the ledger uses for a sheet row. */
export function submissionId(record) {
  return record.id ? record.id.trim() : hashId(record);
}

/**
 * A contributor's display name for a changeset and PR body: one line, no "@"
 * (which would link or ping a GitHub user), commas (they separate credits),
 * markdown or HTML. Empty when nothing is left.
 */
export function cleanDisplayName(value) {
  const text = tidy(value)
    .replace(/https?:\/\/\S*|www\.\S*/gi, " ")
    .replace(/[<>\[\]()*_`#|\\~@,:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > MAX_DISPLAY_NAME_LENGTH ? `${text.slice(0, MAX_DISPLAY_NAME_LENGTH - 1).trimEnd()}…` : text;
}

/** Untrusted text shown in the PR body: a code span, so it can't link, ping or format. */
function literal(value) {
  const text = tidy(value).replace(/`/g, "'");
  return `\`${text.length > 80 ? `${text.slice(0, 79)}…` : text}\``;
}

/** Why a place name is not acceptable, or undefined. */
export function nameProblem(label, value) {
  if (value.length < MIN_NAME_LENGTH) return `${label} is too short`;
  if (value.length > MAX_NAME_LENGTH) return `${label} is longer than ${MAX_NAME_LENGTH} characters`;
  if (!PLACE_NAME.test(value)) return `${label} has characters that are not allowed`;
  if (!HAS_LETTER.test(value)) return `${label} has no letters`;
  if (/https?:|www\./i.test(value)) return `${label} looks like a link`;
  if (fold(value) === "") return `${label} has no Latin letters or digits to match on`;
  return undefined;
}

const inserted = (list, record, sameGroup, sameCounty) => {
  // Keep a record next to its siblings: after the last in its group, else after the last in its county, else at the end.
  let at = -1;
  for (let i = list.length - 1; i >= 0; i--) {
    if (sameGroup(list[i])) {
      at = i;
      break;
    }
  }
  if (at === -1) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (sameCounty(list[i])) {
        at = i;
        break;
      }
    }
  }
  const next = list.slice();
  next.splice(at === -1 ? next.length : at + 1, 0, record);
  return next;
};

/**
 * Apply submissions to the data.
 *
 * `data` is { counties, localities, areas }. `ledger` maps submission ids to
 * { status, reason? }; rows already in it are skipped. Returns the new lists,
 * the ledger entries to add, and what was accepted and rejected. Nothing is
 * mutated.
 */
export function applySubmissions({ counties, localities, areas }, records, ledger = {}, { max = MAX_BATCH_DEFAULT, today } = {}) {
  const countyByCode = new Map(counties.map((c) => [c.code, c]));
  let nextLocalities = localities;
  let nextAreas = areas;

  const areaKeys = new Set(areas.map((a) => `${a.county_code}|${fold(a.locality)}|${fold(a.name)}`));
  const localityByKey = new Map(localities.map((l) => [`${l.county_code}|${fold(l.name)}`, l]));

  const accepted = [];
  const rejected = [];
  const ledgerEntries = {};
  const seenIds = new Set();
  let deferred = 0;

  const reject = (id, record, reason) => {
    rejected.push({ id, record, reason });
    ledgerEntries[id] = { status: "rejected", reason, ...(today ? { at: today } : {}) };
  };

  for (const record of records) {
    const id = submissionId(record);
    if (ledger[id] || seenIds.has(id)) continue;
    seenIds.add(id);

    if (REJECTED_STATUSES.has((record.status ?? "").toLowerCase())) {
      reject(id, record, "marked as not to import in the sheet");
      continue;
    }

    const type = (record.type || "area").toLowerCase();
    if (type !== "area") {
      reject(id, record, `unsupported submission type "${type}"`);
      continue;
    }

    const countyCode = /^\d+$/.test(record.county_code ?? "") ? record.county_code.padStart(3, "0") : record.county_code;
    const county = countyByCode.get(countyCode);
    if (!county) {
      reject(id, record, `unknown county code "${record.county_code ?? ""}"`);
      continue;
    }

    const localityInput = tidy(record.locality);
    const areaName = tidy(record.area);
    const problem = nameProblem("locality", localityInput) ?? nameProblem("area", areaName);
    if (problem) {
      reject(id, record, problem);
      continue;
    }

    if (accepted.length >= max) {
      deferred++;
      continue; // not in the ledger: picked up by the next run
    }

    const existingLocality = localityByKey.get(`${county.code}|${fold(localityInput)}`);
    const localityName = existingLocality ? existingLocality.name : localityInput;

    const areaKey = `${county.code}|${fold(localityName)}|${fold(areaName)}`;
    if (areaKeys.has(areaKey)) {
      reject(id, record, `"${areaName}" already exists in ${localityName}, ${county.name}`);
      continue;
    }

    let newLocality = false;
    if (!existingLocality) {
      const locality = { name: localityName, county: county.name, county_code: county.code };
      nextLocalities = inserted(
        nextLocalities,
        locality,
        (l) => l.county_code === county.code,
        (l) => l.county_code === county.code
      );
      localityByKey.set(`${county.code}|${fold(localityName)}`, locality);
      newLocality = true;
    }

    const area = { name: areaName, locality: localityName, county: county.name, county_code: county.code };
    nextAreas = inserted(
      nextAreas,
      area,
      (a) => a.county_code === county.code && a.locality === localityName,
      (a) => a.county_code === county.code
    );
    areaKeys.add(areaKey);

    const displayName = cleanDisplayName(record.display_name ?? "");
    accepted.push({ id, area, newLocality, displayName });
    ledgerEntries[id] = { status: "imported", ...(today ? { at: today } : {}) };
  }

  return { localities: nextLocalities, areas: nextAreas, accepted, rejected, deferred, ledgerEntries };
}

/** Unique display names of the people to credit, in order of first appearance. */
export function creditNames(accepted) {
  const seen = new Set();
  const names = [];
  for (const { displayName } of accepted) {
    const key = displayName.toLowerCase();
    if (!displayName || seen.has(key)) continue;
    seen.add(key);
    names.push(displayName);
  }
  return names;
}

/** Markdown for the pull request description. */
export function pullRequestBody({ accepted, rejected, deferred }) {
  const lines = [
    "Areas contributed through the web form, imported from the submissions sheet by `scripts/submissions/import.js`.",
    "",
    "Review each row before merging: the sheet is open to anyone, so the PR is the moderation step. `pnpm validate` has already passed.",
    "",
    `### Added (${accepted.length})`,
    "",
  ];
  for (const { area, newLocality, displayName } of accepted) {
    const flags = [newLocality ? "**new locality**" : null, displayName ? `by ${literal(displayName)}` : null].filter(Boolean);
    lines.push(`- ${literal(area.name)} in ${literal(area.locality)}, ${area.county}${flags.length ? ` (${flags.join(", ")})` : ""}`);
  }
  if (rejected.length > 0) {
    lines.push("", `### Skipped (${rejected.length})`, "");
    for (const { record, reason } of rejected) {
      lines.push(`- ${literal(record.area || "(no area)")} in ${literal(record.locality || "(no locality)")}: ${reason.replace(/`/g, "'")}`);
    }
  }
  if (deferred > 0) {
    lines.push("", `${deferred} more valid row${deferred === 1 ? "" : "s"} wait for the next run (limit per run reached).`);
  }
  lines.push("", "Every row above is recorded in `sources/submissions/ledger.json`, so each is handled once.");
  return `${lines.join("\n")}\n`;
}
