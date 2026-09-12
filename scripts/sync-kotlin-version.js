#!/usr/bin/env node

/**
 * After `changeset version` bumps packages/kotlin/package.json (fixed with JS),
 * write that version into gradle.properties.
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "packages/kotlin/package.json"), "utf8"));
const gradlePropsPath = join(root, "packages/kotlin/gradle.properties");

const next = readFileSync(gradlePropsPath, "utf8").replace(
  /^VERSION_NAME=.*/m,
  `VERSION_NAME=${version}`
);

if (!/^VERSION_NAME=/m.test(next)) {
  throw new Error(`VERSION_NAME not found in ${gradlePropsPath}`);
}

writeFileSync(gradlePropsPath, next);
console.log(`Synced kotlin VERSION_NAME → ${version}`);
