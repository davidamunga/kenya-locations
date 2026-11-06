import assert from "node:assert/strict";
import test from "node:test";
import {
  applySubmissions,
  cleanDisplayName,
  creditNames,
  csvToRecords,
  fold,
  nameProblem,
  parseCsv,
  pullRequestBody,
  submissionId,
} from "./lib.js";

const counties = [
  { code: "047", name: "Nairobi" },
  { code: "039", name: "Bungoma" },
];
const localities = [
  { name: "Westlands", county: "Nairobi", county_code: "047" },
  { name: "Kibera", county: "Nairobi", county_code: "047" },
  { name: "Bokoli", county: "Bungoma", county_code: "039" },
];
const areas = [
  { name: "Gigiri", locality: "Westlands", county: "Nairobi", county_code: "047" },
  { name: "Kianda", locality: "Kibera", county: "Nairobi", county_code: "047" },
  { name: "Sikhendu", locality: "Bokoli", county: "Bungoma", county_code: "039" },
];
const data = { counties, localities, areas };

const row = (over) => ({ id: "r1", type: "area", county_code: "047", locality: "Westlands", area: "Highpoint", display_name: "", status: "", ...over });

test("parses quoted CSV: commas, doubled quotes and newlines inside quotes", () => {
  const rows = parseCsv('a,b,c\r\n1,"x, y","say ""hi"""\r\n2,"line\nbreak",z\r\n');
  assert.deepEqual(rows, [["a", "b", "c"], ["1", "x, y", 'say "hi"'], ["2", "line\nbreak", "z"]]);
});

test("a stray quote inside an unquoted field does not swallow later rows", () => {
  const rows = parseCsv('id,area\na1,5" Gate\na2,Kibera\n');
  assert.deepEqual(rows, [["id", "area"], ["a1", '5" Gate'], ["a2", "Kibera"]]);
});

test("maps headers to snake_case record keys, in any order, and ignores blank rows", () => {
  const records = csvToRecords("﻿County Code,Area,Display-Name\n47,Highpoint,Jane\n,,\n");
  assert.deepEqual(records, [{ county_code: "47", area: "Highpoint", display_name: "Jane" }]);
});

test("fold ignores case, accents, spaces and punctuation", () => {
  assert.equal(fold("  Murang'a "), "muranga");
  assert.equal(fold("Kiambu Ṭown"), "kiambutown");
});

test("rejects place names with links, markup, odd characters, or nothing to match on", () => {
  assert.equal(nameProblem("area", "Highpoint"), undefined);
  assert.equal(nameProblem("area", "Kwa Jose"), undefined);
  assert.equal(nameProblem("area", "St. Mary's (Annex)"), undefined);
  for (const bad of ["=SUM(A1)", "@jane", "<b>x</b>", "visit http://x.example", "www.x.com", "a", "x".repeat(61), "12345", "---", "東京"]) {
    assert.notEqual(nameProblem("area", bad), undefined, bad);
  }
});

test("adds an area next to its locality's others, with the county name taken from the codes", () => {
  const result = applySubmissions(data, [row({ county_code: "47", display_name: "Jane Doe" })]);
  assert.equal(result.accepted.length, 1);
  assert.deepEqual(result.accepted[0].area, { name: "Highpoint", locality: "Westlands", county: "Nairobi", county_code: "047" });
  assert.equal(result.accepted[0].newLocality, false);
  assert.deepEqual(result.areas.map((a) => a.name), ["Gigiri", "Highpoint", "Kianda", "Sikhendu"]);
  assert.equal(result.localities.length, localities.length);
  assert.equal(areas.length, 3, "the input is not mutated");
});

test("matches an existing locality ignoring case, and uses its canonical spelling", () => {
  const result = applySubmissions(data, [row({ locality: "westlands " })]);
  assert.equal(result.accepted[0].area.locality, "Westlands");
  assert.equal(result.accepted[0].newLocality, false);
});

test("creates a new locality and flags it", () => {
  const result = applySubmissions(data, [row({ locality: "Karura", area: "Ngong Road" })]);
  assert.equal(result.accepted[0].newLocality, true);
  assert.deepEqual(result.localities.find((l) => l.name === "Karura"), { name: "Karura", county: "Nairobi", county_code: "047" });
  assert.equal(result.localities.findIndex((l) => l.name === "Karura"), 2, "placed after the county's last locality");
  assert.match(pullRequestBody(result), /new locality/);
});

test("rejects unknown counties, unsupported types, duplicates and maintainer-rejected rows", () => {
  const result = applySubmissions(data, [
    row({ id: "a", county_code: "999" }),
    row({ id: "b", type: "ward" }),
    row({ id: "c", area: "gigiri" }),
    row({ id: "d", status: "Spam" }),
    row({ id: "e", area: "=1+1" }),
  ]);
  assert.equal(result.accepted.length, 0);
  assert.deepEqual(result.rejected.map((r) => r.id), ["a", "b", "c", "d", "e"]);
  assert.match(result.rejected[0].reason, /unknown county code "999"/);
  assert.match(result.rejected[2].reason, /already exists/);
});

test("the same area twice in one batch is added once", () => {
  const result = applySubmissions(data, [row({ id: "x", area: "Highpoint" }), row({ id: "y", area: "highpoint" })]);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.rejected.length, 1);
});

test("rows in the ledger are skipped, so a re-run changes nothing", () => {
  const first = applySubmissions(data, [row()], {}, { today: "2026-11-06" });
  assert.deepEqual(first.ledgerEntries, { r1: { status: "imported", at: "2026-11-06" } });
  const second = applySubmissions(data, [row()], first.ledgerEntries);
  assert.equal(second.accepted.length, 0);
  assert.equal(second.rejected.length, 0);
});

test("caps a run and leaves the rest for the next one without recording them", () => {
  const rows = ["Aa", "Bb", "Cc"].map((area, i) => row({ id: `r${i}`, area }));
  const result = applySubmissions(data, rows, {}, { max: 2 });
  assert.equal(result.accepted.length, 2);
  assert.equal(result.deferred, 1);
  assert.equal(result.ledgerEntries.r2, undefined);
});

test("rows without an id get a stable one", () => {
  const a = { submitted_at: "t", county_code: "47", locality: "W", area: "X" };
  assert.equal(submissionId(a), submissionId({ ...a }));
  assert.notEqual(submissionId(a), submissionId({ ...a, area: "Y" }));
});

test("display names can't link, ping or split into several credits", () => {
  assert.equal(cleanDisplayName("@octocat"), "octocat");
  assert.equal(cleanDisplayName("Doe, Jane"), "Doe Jane");
  assert.equal(cleanDisplayName("[x](http://evil.example) Jane"), "x Jane");
  assert.equal(cleanDisplayName("<b>Jane</b>\nDoe"), "b Jane /b Doe");
  assert.equal(cleanDisplayName("x".repeat(100)).length, 40);
});

test("credits each name once", () => {
  const accepted = [{ displayName: "Jane Doe" }, { displayName: "" }, { displayName: "jane doe" }, { displayName: "Wanjiru" }];
  assert.deepEqual(creditNames(accepted), ["Jane Doe", "Wanjiru"]);
});

test("the PR body shows untrusted text only inside code spans", () => {
  const result = applySubmissions(data, [row({ id: "bad", area: "[click](http://evil.example) @everyone", display_name: "@octocat" }), row({ id: "ok", area: "Highpoint", display_name: "Jane `x`" })]);
  const body = pullRequestBody(result);
  assert.ok(!/(^|[^`])@everyone/.test(body.replace(/`[^`]*`/g, "")), "no bare mention outside code spans");
  assert.match(body, /`\[click\]\(http:\/\/evil.example\) @everyone` in `Westlands`/);
});
