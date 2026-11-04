import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { composerContentHash, withContentHash } from "./composer-content-hash.js";

const php = join(dirname(fileURLToPath(import.meta.url)), "../../packages/php");

test("matches the content-hash Composer wrote to the committed lock", () => {
  const composer = JSON.parse(readFileSync(join(php, "composer.json"), "utf8"));
  const lock = JSON.parse(readFileSync(join(php, "composer.lock"), "utf8"));
  assert.equal(composerContentHash(composer), lock["content-hash"]);
});

test("changes when the version changes", () => {
  const composer = JSON.parse(readFileSync(join(php, "composer.json"), "utf8"));
  const bumped = { ...composer, version: "99.0.0" };
  assert.notEqual(composerContentHash(bumped), composerContentHash(composer));
});

test("withContentHash replaces only the hash", () => {
  const lock = '{\n    "content-hash": "00000000000000000000000000000000",\n    "packages": []\n}\n';
  const updated = withContentHash(lock, "0123456789abcdef0123456789abcdef");
  assert.equal(updated, lock.replace("00000000000000000000000000000000", "0123456789abcdef0123456789abcdef"));
});
