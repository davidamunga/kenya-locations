#!/usr/bin/env node

/**
 * Swift Package Manager versions from the Create Release git tag (vX.Y.Z).
 * The stub package.json is in the core `fixed` group so it stays on the JS number.
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "packages/swift/package.json"), "utf8"));

console.log(`Swift package version: ${version} (published via git tag v${version})`);
