# Cross-language parity

`cases.json` holds lookups and searches that every language package must answer the same way. Each package runs the file against its own implementation, so a fix or behaviour change in one language that the others don't share fails CI.

JS (`packages/js`) is the reference: write and verify a case there first, then the other packages must agree.

| Package | Harness | Run |
|---|---|---|
| JS | `packages/js/lib/tests/parity.test.ts` | `pnpm --filter kenya-locations test` |
| Kotlin | `packages/kotlin/src/test/kotlin/ke/locations/ParityTest.kt` | `cd packages/kotlin && ./gradlew test` |
| Swift | `packages/swift/Tests/KenyaLocationsTests/ParityTests.swift` | `cd packages/swift && swift test` |
| PHP | `packages/php/tests/ParityTest.php` | `composer --working-dir=packages/php test` |
| .NET | `packages/dotnet/tests/KenyaLocations.Tests/ParityTests.cs` | `dotnet test packages/dotnet` |
| Dart | not yet | |

## What is compared

- **`lookups`**: a code or name lookup returns exactly the expected value (a name for code lookups, a code for name lookups, or `null`).
- **`counts`**: relation lookups return exactly the expected number of records.
- **`areasInLocality`, `localitiesInCounty`**: the result includes the listed names (`expectCount` is exact when present).
- **`search`, `searchByType`**: the expected records appear in the top `limit` results. Order is not compared, because JS ranks with Fuse.js and the other packages use a Levenshtein port. `empty` and `nonEmpty` check short queries and the presence of any result.

Types are `county`, `sub-county`, `constituency`, `ward`, `locality` and `area`.

## Adding a case

1. Add it to `cases.json`. Keep expectations to things that survive routine data changes: prefer exact lookups, and electoral counts (stable) over area or locality counts (which grow).
2. Run the JS test and confirm it passes there.
3. Run the other harnesses. A failure is a real divergence: fix the package that disagrees, or, if the behaviour is deliberately different, narrow the case rather than skipping a language.

Each harness reports every mismatch in a category at once, so one run lists all the differences.

## Adding a call

To cover a new function, add a section to `cases.json` and a matching test to every harness above. `call` names are shared (`countyByCode`, `wardsInCounty`, …) and each harness maps them to its own API.
