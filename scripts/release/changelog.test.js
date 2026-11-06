import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const changelog = require("../../.changeset/changelog.cjs");
const options = { repo: "o/r" };

// No GITHUB_TOKEN: the API lookup is skipped and no commit means no PR number.
delete process.env.GITHUB_TOKEN;

test("credits by handle, linked to the profile", () => {
  assert.equal(changelog.creditText(["alice"]), " by [@alice](https://github.com/alice)");
  assert.equal(
    changelog.creditText(["alice", "bob", "alice"]),
    " by [@alice](https://github.com/alice), [@bob](https://github.com/bob)",
  );
});

test("never credits bots or Claude", () => {
  assert.equal(changelog.creditText(["dependabot[bot]", "Claude", "github-actions"]), "");
  assert.equal(changelog.creditText(["alice", "claude"]), " by [@alice](https://github.com/alice)");
});

test("an explicit Credit line replaces the PR author and is removed from the text", () => {
  const { summary, logins } = changelog.parseCredit("Adds Python.\n\nCredit: @achingachris, @DavidAmunga");
  assert.equal(summary, "Adds Python.");
  assert.deepEqual(logins, ["achingachris", "DavidAmunga"]);
  assert.deepEqual(changelog.parseCredit("No credit here").logins, undefined);
});

test("an entry with a Credit line gets the credit at the end", async () => {
  const line = await changelog.getReleaseLine({ summary: "Adds Python.\nCredit: @alice", commit: undefined }, "minor", options);
  assert.equal(line, "\n- Adds Python. by [@alice](https://github.com/alice)");
});

test("falls back to the plain entry when no credit is known", async () => {
  const line = await changelog.getReleaseLine({ summary: "Fixes a thing.", commit: undefined }, "patch", options);
  assert.equal(line, "\n- Fixes a thing.");
});

test("keeps multi-line summaries indented, with credit on the last line", async () => {
  const line = await changelog.getReleaseLine({ summary: "Lead:\nmore\nCredit: @alice", commit: undefined }, "patch", options);
  assert.equal(line, "\n- Lead:\n  more by [@alice](https://github.com/alice)");
});
