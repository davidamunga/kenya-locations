import { describe, expect, it } from "vitest";
import dartSource from "../../../../packages/dart/lib/src/kenya_locations.dart?raw";
import jsSource from "../../../../packages/js/lib/index.ts?raw";
import kotlinSource from "../../../../packages/kotlin/src/main/kotlin/ke/locations/KenyaLocations.kt?raw";
import dotnetSource from "../../../../packages/dotnet/src/KenyaLocations/Locations.cs?raw";
import phpSource from "../../../../packages/php/src/KenyaLocations.php?raw";
import pythonSource from "../../../../packages/python/src/kenya_locations/lookups.py?raw";
import swiftSource from "../../../../packages/swift/Sources/KenyaLocations/KenyaLocations.swift?raw";
import type { SnippetTarget } from "./places";
import { snippetsFor } from "./snippets";

/** Each language's public source, to check snippets only call real functions. */
const SOURCES = {
  js: jsSource,
  kotlin: kotlinSource,
  swift: swiftSource,
  dart: dartSource,
  php: phpSource,
  dotnet: dotnetSource,
  python: pythonSource,
};

const DECLARES: Record<keyof typeof SOURCES, (name: string) => RegExp> = {
  js: (name) => new RegExp(`\\b${name}\\b`),
  kotlin: (name) => new RegExp(`\\bfun ${name}\\(`),
  swift: (name) => new RegExp(`public func ${name}\\(`),
  dart: (name) => new RegExp(`\\b${name}\\(`),
  php: (name) => new RegExp(`public static function ${name}\\(`),
  // C# methods are PascalCase: GetCountyByCode, not getCountyByCode.
  dotnet: (name) => new RegExp(`public static [^(]+ ${name}\\(`),
  python: (name) => new RegExp(`^def ${name}\\(`, "m"),
};

/** Library calls in a snippet: getX( or get_x( after KenyaLocations., .shared., ::, kl. or an import. */
function calledFunctions(code: string): string[] {
  return [...code.matchAll(/\b([Gg]et[A-Za-z_]+)\(/g)].map((m) => m[1]);
}

const TARGETS: SnippetTarget[] = [
  { kind: "county", code: "047" },
  { kind: "constituency", code: "290" },
  { kind: "ward", code: "0737", constituencyCode: "148" },
  { kind: "sub-county", code: "001", countyCode: "001" },
  { kind: "locality", name: "East Sang'Alo", countyCode: "039" },
];

describe("snippetsFor", () => {
  it.each(TARGETS)("covers all six languages for a $kind", (target) => {
    expect(snippetsFor(target).map((s) => s.id)).toEqual([
      "js",
      "kotlin",
      "swift",
      "dart",
      "php",
      "dotnet",
      "python",
    ]);
  });

  it.each(TARGETS)("only calls functions each library declares ($kind)", (target) => {
    for (const snippet of snippetsFor(target)) {
      for (const name of calledFunctions(snippet.code)) {
        expect(SOURCES[snippet.id], `${snippet.id} has no ${name}`).toMatch(DECLARES[snippet.id](name));
      }
    }
  });

  it("quotes names with apostrophes correctly in each language", () => {
    const byId = Object.fromEntries(
      snippetsFor({ kind: "locality", name: "East Sang'Alo", countyCode: "039" }).map((s) => [
        s.id,
        s.code,
      ]),
    );
    expect(byId.js).toContain(`getAreasInLocality("East Sang'Alo", "039")`);
    expect(byId.kotlin).toContain(`getAreasInLocality("East Sang'Alo", county = "039")`);
    expect(byId.swift).toContain(`getAreasInLocality("East Sang'Alo", county: "039")`);
    expect(byId.dart).toContain(`getAreasInLocality("East Sang'Alo", county: '039')`);
    expect(byId.php).toContain(`getAreasInLocality('East Sang\\'Alo', '039')`);
    expect(byId.dotnet).toContain(`GetAreasInLocality("East Sang'Alo", county: "039")`);
    expect(byId.python).toContain(`get_areas_in_locality("East Sang'Alo", "039")`);
  });

  it("finds a ward within its constituency where there's no ward-by-code lookup", () => {
    const kotlin = snippetsFor({ kind: "ward", code: "0737", constituencyCode: "148" }).find(
      (s) => s.id === "kotlin",
    )!;
    expect(kotlin.code).toContain(`getWardsInConstituency("148")`);
    expect(kotlin.code).toContain(`.first { it.code == "0737" }`);
  });
});
