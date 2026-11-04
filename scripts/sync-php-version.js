#!/usr/bin/env node

/**
 * After `changeset version` bumps packages/php/package.json,
 * write that version into composer.json and refresh composer.lock's
 * content-hash (the version is part of it, so a bump would otherwise make
 * `composer validate --strict` fail).
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { composerContentHash, withContentHash } from "./composer-content-hash.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "packages/php/package.json"), "utf8"));
const composerPath = join(root, "packages/php/composer.json");
const lockPath = join(root, "packages/php/composer.lock");
const composer = JSON.parse(readFileSync(composerPath, "utf8"));

if (typeof composer.version !== "string") {
  throw new Error(`version not found in ${composerPath}`);
}

composer.version = version;
writeFileSync(composerPath, `${JSON.stringify(composer, null, 2)}\n`);
writeFileSync(lockPath, withContentHash(readFileSync(lockPath, "utf8"), composerContentHash(composer)));
console.log(`Synced php composer version → ${version}`);
