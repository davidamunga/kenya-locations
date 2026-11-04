import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
