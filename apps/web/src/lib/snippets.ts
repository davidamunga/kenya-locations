import type { SnippetTarget } from "@/lib/places";

export interface Snippet {
  id: "js" | "kotlin" | "swift" | "dart" | "php";
  label: string;
  filename: string;
  code: string;
}

// String literals in each language's own quoting style.
const dq = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const sq = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
/** Dart: single quotes unless the value has one, as `dart format` prefers. */
const dartQ = (value: string) => (value.includes("'") ? dq(value) : sq(value));

/**
 * The calls that look up `target` in every library, using only functions
 * each library actually has (Kotlin, Swift and Dart have no ward-by-code
 * lookup, so they find the ward within its constituency).
 */
export function snippetsFor(target: SnippetTarget): Snippet[] {
  switch (target.kind) {
    case "county": {
      const c = target.code;
      return [
        js(["getCountyByCode", "getConstituenciesInCounty"], [
          `const county = getCountyByCode(${dq(c)});`,
          `const constituencies = getConstituenciesInCounty(${dq(c)});`,
        ]),
        kotlin([
          `val county = KenyaLocations.getCountyByCode(${dq(c)})`,
          `val constituencies = KenyaLocations.getConstituenciesInCounty(${dq(c)})`,
        ]),
        swift([
          `let county = KenyaLocations.shared.getCountyByCode(${dq(c)})`,
          `let constituencies = KenyaLocations.shared.getConstituenciesInCounty(${dq(c)})`,
        ]),
        dart([
          `final county = KenyaLocations.getCountyByCode(${dartQ(c)});`,
          `final constituencies = KenyaLocations.getConstituenciesInCounty(${dartQ(c)});`,
        ]),
        php([
          `$county = KenyaLocations::getCountyByCode(${sq(c)});`,
          `$constituencies = KenyaLocations::getConstituenciesInCounty(${sq(c)});`,
        ]),
      ];
    }
    case "constituency": {
      const c = target.code;
      return [
        js(["getConstituencyByCode", "getWardsInConstituency"], [
          `const constituency = getConstituencyByCode(${dq(c)});`,
          `const wards = getWardsInConstituency(${dq(c)});`,
        ]),
        kotlin([
          `val constituency = KenyaLocations.getConstituencyByCode(${dq(c)})`,
          `val wards = KenyaLocations.getWardsInConstituency(${dq(c)})`,
        ]),
        swift([
          `let constituency = KenyaLocations.shared.getConstituencyByCode(${dq(c)})`,
          `let wards = KenyaLocations.shared.getWardsInConstituency(${dq(c)})`,
        ]),
        dart([
          `final wards = KenyaLocations.getWardsInConstituency(${dartQ(c)});`,
        ]),
        php([
          `$constituency = KenyaLocations::getConstituencyByCode(${sq(c)});`,
          `$wards = KenyaLocations::getWardsInConstituency(${sq(c)});`,
        ]),
      ];
    }
    case "ward": {
      const w = target.code;
      const k = target.constituencyCode;
      return [
        js(["getWardByCode", "getCountyOfWard"], [
          `const ward = getWardByCode(${dq(w)});`,
          `const county = getCountyOfWard(${dq(w)});`,
        ]),
        kotlin([
          `val ward = KenyaLocations.getWardsInConstituency(${dq(k)})`,
          `    .first { it.code == ${dq(w)} }`,
        ]),
        swift([
          `let ward = KenyaLocations.shared.getWardsInConstituency(${dq(k)})`,
          `    .first { $0.code == ${dq(w)} }`,
        ]),
        dart([
          `final ward = KenyaLocations.getWardsInConstituency(${dartQ(k)})`,
          `    .firstWhere((w) => w.code == ${dartQ(w)});`,
        ]),
        php([
          `$ward = KenyaLocations::getWardByCode(${sq(w)});`,
          `$county = KenyaLocations::getCountyOfWard(${sq(w)});`,
        ]),
      ];
    }
    case "sub-county": {
      const s = target.code;
      const c = target.countyCode;
      return [
        js(["getSubCountyByCode", "getWardsInSubCounty"], [
          `const subCounty = getSubCountyByCode(${dq(s)});`,
          `const wards = getWardsInSubCounty(${dq(s)});`,
        ]),
        kotlin([
          `val subCounty = KenyaLocations.getSubCountiesInCounty(${dq(c)})`,
          `    .first { it.code == ${dq(s)} }`,
        ]),
        swift([
          `let subCounty = KenyaLocations.shared.getSubCountiesInCounty(${dq(c)})`,
          `    .first { $0.code == ${dq(s)} }`,
        ]),
        dart([
          `final subCounty = KenyaLocations.getSubCountiesInCounty(${dartQ(c)})`,
          `    .firstWhere((s) => s.code == ${dartQ(s)});`,
        ]),
        php([
          `$subCounty = KenyaLocations::getSubCountyByCode(${sq(s)});`,
          `$wards = KenyaLocations::getWardsInSubCounty(${sq(s)});`,
        ]),
      ];
    }
    case "locality": {
      const n = target.name;
      const c = target.countyCode;
      return [
        js(["getAreasInLocality"], [
          `// Locality names repeat across counties, so pass the county too.`,
          `const areas = getAreasInLocality(${dq(n)}, ${dq(c)});`,
        ]),
        kotlin([`val areas = KenyaLocations.getAreasInLocality(${dq(n)}, county = ${dq(c)})`]),
        swift([`let areas = KenyaLocations.shared.getAreasInLocality(${dq(n)}, county: ${dq(c)})`]),
        dart([`final areas = KenyaLocations.getAreasInLocality(${dartQ(n)}, county: ${dartQ(c)});`]),
        php([`$areas = KenyaLocations::getAreasInLocality(${sq(n)}, ${sq(c)});`]),
      ];
    }
  }
}

function js(imports: string[], lines: string[]): Snippet {
  return {
    id: "js",
    label: "JavaScript",
    filename: "example.ts",
    code: `import { ${imports.join(", ")} } from "kenya-locations";\n\n${lines.join("\n")}\n`,
  };
}

function kotlin(lines: string[]): Snippet {
  return {
    id: "kotlin",
    label: "Kotlin",
    filename: "Example.kt",
    code: `import ke.locations.KenyaLocations\n\n${lines.join("\n")}\n`,
  };
}

function swift(lines: string[]): Snippet {
  return {
    id: "swift",
    label: "Swift",
    filename: "Example.swift",
    code: `import KenyaLocations\n\n${lines.join("\n")}\n`,
  };
}

function dart(lines: string[]): Snippet {
  return {
    id: "dart",
    label: "Dart",
    filename: "example.dart",
    code: `import 'package:kenya_locations/kenya_locations.dart';\n\n${lines.join("\n")}\n`,
  };
}

function php(lines: string[]): Snippet {
  return {
    id: "php",
    label: "PHP",
    filename: "example.php",
    code: `<?php\n\nuse KenyaLocations\\KenyaLocations;\n\n${lines.join("\n")}\n`,
  };
}
