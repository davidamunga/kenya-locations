/**
 * Composer's lock-file content hash, computed in Node so the version bump can
 * keep composer.lock valid without PHP installed.
 *
 * Mirrors Composer\Package\Locker::getContentHash(): an md5 of the
 * lock-relevant composer.json keys, sorted, encoded like PHP json_encode().
 */

import { createHash } from "crypto";

const RELEVANT_KEYS = [
  "name",
  "version",
  "require",
  "require-dev",
  "conflict",
  "replace",
  "provide",
  "minimum-stability",
  "prefer-stable",
  "repositories",
  "extra",
];

// PHP json_encode() with no flags escapes "/" and every non-ASCII character.
function phpJsonEncode(value) {
  return JSON.stringify(value)
    .replace(/\//g, "\\/")
    .replace(
      /[\u007f-￿]/g,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`
    );
}

export function composerContentHash(composer) {
  const relevant = {};
  for (const key of RELEVANT_KEYS) {
    if (key in composer) relevant[key] = composer[key];
  }
  if (composer.config?.platform) {
    relevant.config = { platform: composer.config.platform };
  }
  const sorted = Object.fromEntries(
    Object.keys(relevant)
      .sort()
      .map((key) => [key, relevant[key]])
  );
  return createHash("md5").update(phpJsonEncode(sorted)).digest("hex");
}

/** Return lock-file text with its content-hash replaced. */
export function withContentHash(lockText, hash) {
  const pattern = /("content-hash":\s*")[0-9a-f]{32}(")/;
  if (!pattern.test(lockText)) {
    throw new Error("content-hash not found in composer.lock");
  }
  return lockText.replace(pattern, `$1${hash}$2`);
}
