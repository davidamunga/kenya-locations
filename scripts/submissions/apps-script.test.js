import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("./apps-script/Code.gs", import.meta.url), "utf8");

/** Code.gs in a sandbox with just enough of Google's services to run it. */
function load({ rows = [], props = {} } = {}) {
  const written = [];
  const properties = { ...props };
  const sheet = {
    getLastRow: () => rows.length + written.length,
    appendRow: (row) => written.push(row),
    getRange: () => ({
      setNumberFormat() {
        return this;
      },
      setValues: ([row]) => written.push(row),
    }),
  };
  const sandbox = {
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ text, setMimeType() { return this; } }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => properties[key] ?? null,
        setProperty: (key, value) => {
          properties[key] = value;
        },
      }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (name) => (name === "Submissions" ? sheet : null) }) },
    Utilities: { getUuid: randomUUID, formatDate: (date) => date.toISOString().slice(0, 10) },
  };
  vm.runInNewContext(source, sandbox);
  const post = (body) => JSON.parse(sandbox.doPost({ postData: { contents: typeof body === "string" ? body : JSON.stringify(body) } }).text);
  return { post, written, properties, doGet: () => JSON.parse(sandbox.doGet().text) };
}

const good = { county_code: "47", locality: "Westlands", area: "Highpoint", display_name: "Jane Doe", consent: true, website: "" };

test("appends a row with the columns the importer reads", () => {
  const { post, written } = load();
  assert.deepEqual(post(good), { ok: true });
  const row = written.at(-1);
  assert.equal(row.length, 8);
  assert.match(row[0], /^[0-9a-f-]{36}$/);
  assert.deepEqual([...row.slice(2)], ["area", "047", "Westlands", "Highpoint", "Jane Doe", ""]);
});

test("writes the header first on an empty sheet", () => {
  const { post, written } = load();
  post(good);
  assert.deepEqual([...written[0]], ["id", "submitted_at", "type", "county_code", "locality", "area", "display_name", "status"]);
});

test("a filled-in honeypot looks like success and stores nothing", () => {
  const { post, written } = load();
  assert.deepEqual(post({ ...good, website: "http://spam.example" }), { ok: true });
  assert.equal(written.length, 0);
});

test("refuses without consent, for a bad county, or for a bad name", () => {
  const { post, written } = load();
  assert.equal(post({ ...good, consent: false }).error, "consent_required");
  assert.equal(post({ ...good, county_code: "48" }).error, "invalid_county");
  assert.equal(post({ ...good, county_code: "000" }).error, "invalid_county");
  assert.equal(post({ ...good, area: "=HYPERLINK(1)" }).error, "invalid_name");
  assert.equal(post({ ...good, locality: "visit www.x.com" }).error, "invalid_name");
  assert.equal(post({ ...good, area: "x" }).error, "invalid_name");
  assert.equal(post("not json").error, "bad_request");
  assert.equal(written.length, 0);
});

test("cleans the display name and stores a leading formula character as text", () => {
  const { post, written } = load();
  post({ ...good, display_name: "[x](http://evil.example) @Jane, Doe" });
  assert.equal(written.at(-1)[6], "x Jane Doe");
  post({ ...good, area: "Second", display_name: "=1+1" });
  assert.equal(written.at(-1)[6], "'=1+1");
});

test("stops at the daily limit", () => {
  const today = new Date().toISOString().slice(0, 10);
  const { post, written } = load({ props: { [`count:${today}`]: "200" } });
  assert.equal(post(good).error, "too_many_today");
  assert.equal(written.length, 0);
});

test("answers a plain GET so the deployment can be checked in a browser", () => {
  assert.equal(load().doGet().ok, true);
});
