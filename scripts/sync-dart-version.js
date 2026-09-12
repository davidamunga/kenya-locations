#!/usr/bin/env node

/**
 * After `changeset version` bumps packages/dart/package.json,
 * write that version into pubspec.yaml.
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "packages/dart/package.json"), "utf8"));
const pubspecPath = join(root, "packages/dart/pubspec.yaml");

const next = readFileSync(pubspecPath, "utf8").replace(/^version: .*/m, `version: ${version}`);

if (!/^version: /m.test(next)) {
  throw new Error(`version: not found in ${pubspecPath}`);
}

writeFileSync(pubspecPath, next);
console.log(`Synced dart pubspec version → ${version}`);
