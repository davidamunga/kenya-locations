/**
 * Release manifest: every published product, where its version lives, and
 * what has to change with it.
 *
 * Changesets owns the version in each package's package.json. Everything
 * else (gradle.properties, pubspec.yaml, composer.json + composer.lock,
 * bundled data copies) is derived from it by `pnpm release:sync` and
 * checked by `pnpm release:verify`.
 *
 * Adding a product or a new place a version/data copy lives? Add it here;
 * sync, verify, changeset:data and the changeset check all read this file.
 */

import { composerContentHash, withContentHash } from "./composer-content-hash.js";

/** A `KEY=value` line in a properties file. */
function propertiesKey(path, key) {
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  return {
    path,
    describe: `${key} in ${path}`,
    read: (text) => text.match(pattern)?.[1]?.trim(),
    write: (text, version) => text.replace(pattern, `${key}=${version}`),
  };
}

/** The top-level `version:` of a pubspec.yaml. */
function yamlVersion(path) {
  const pattern = /^version:\s*(.*)$/m;
  return {
    path,
    describe: `version in ${path}`,
    read: (text) => text.match(pattern)?.[1]?.trim(),
    write: (text, version) => text.replace(pattern, `version: ${version}`),
  };
}

/** The `<Version>` element of an MSBuild project file. */
function msbuildVersion(path) {
  const pattern = /<Version>(.*?)<\/Version>/;
  return {
    path,
    describe: `<Version> in ${path}`,
    read: (text) => text.match(pattern)?.[1]?.trim(),
    write: (text, version) => text.replace(pattern, `<Version>${version}</Version>`),
  };
}

/** composer.json "version"; composer.lock's content-hash must follow it. */
function composerVersion(path, lockPath) {
  return {
    path,
    describe: `version in ${path}`,
    read: (text) => JSON.parse(text).version,
    write: (text, version) => {
      const composer = JSON.parse(text);
      composer.version = version;
      return `${JSON.stringify(composer, null, 2)}\n`;
    },
    dependents: [
      {
        path: lockPath,
        describe: `content-hash in ${lockPath}`,
        expected: (composerText) => composerContentHash(JSON.parse(composerText)),
        read: (lockText) => JSON.parse(lockText)["content-hash"],
        write: (lockText, hash) => withContentHash(lockText, hash),
      },
    ],
  };
}

/** A committed, byte-for-byte copy of data/*.json. */
function dataCopy(dir) {
  return { kind: "copy", dir };
}

/** A file generated from data/*.json by a toolchain Node can't run. */
function dataGenerated(path, command) {
  return { kind: "generated", path, command };
}

export const PRODUCTS = [
  {
    id: "core",
    description: "JS, Kotlin and Swift (one shared version)",
    tag: (version) => `v${version}`,
    packages: [
      { name: "kenya-locations", dir: "packages/js" },
      {
        name: "kenya-locations-kotlin",
        dir: "packages/kotlin",
        versionFiles: [propertiesKey("packages/kotlin/gradle.properties", "VERSION_NAME")],
      },
      // Swift ships from the git tag; package.json is its only version record.
      { name: "kenya-locations-swift", dir: "packages/swift" },
    ],
    data: [
      dataCopy("packages/kotlin/src/main/resources"),
      dataCopy("packages/swift/Sources/KenyaLocations/Resources"),
    ],
  },
  {
    id: "react",
    description: "React hooks",
    tag: (version) => `react-v${version}`,
    packages: [{ name: "kenya-locations-react", dir: "packages/react" }],
    data: [],
  },
  {
    id: "dart",
    description: "Dart / Flutter",
    tag: (version) => `dart-v${version}`,
    packages: [
      {
        name: "kenya-locations-dart",
        dir: "packages/dart",
        versionFiles: [yamlVersion("packages/dart/pubspec.yaml")],
      },
    ],
    data: [
      dataGenerated(
        "packages/dart/lib/src/generated/data.dart",
        "dart run packages/dart/scripts/generate_data.dart"
      ),
    ],
  },
  {
    id: "php",
    description: "PHP / Packagist",
    tag: (version) => `php-v${version}`,
    packages: [
      {
        name: "kenya-locations-php",
        dir: "packages/php",
        versionFiles: [composerVersion("packages/php/composer.json", "packages/php/composer.lock")],
      },
    ],
    data: [dataCopy("packages/php/data")],
  },
  {
    id: "dotnet",
    description: ".NET / NuGet",
    tag: (version) => `dotnet-v${version}`,
    packages: [
      {
        name: "kenya-locations-dotnet",
        dir: "packages/dotnet",
        versionFiles: [msbuildVersion("packages/dotnet/src/KenyaLocations/KenyaLocations.csproj")],
      },
    ],
    data: [dataCopy("packages/dotnet/src/KenyaLocations/Data")],
  },
];

/**
 * One package per product that ships data/*.json. A data changeset lists
 * these; within the core product, the fixed version group bumps the rest.
 */
export function dataPackages() {
  return PRODUCTS.filter((product) => product.data.length > 0).map(
    (product) => product.packages[0].name
  );
}
