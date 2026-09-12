# kenya-locations

Shared Kenyan administrative divisions (counties → wards / localities → areas) packaged as typed libraries. `data/*.json` is the source of truth; every language package consumes it.

## Packages

| Path | Publish as | Notes |
|---|---|---|
| `packages/js` | npm `kenya-locations` | Canonical API; changesets |
| `packages/react` | npm `kenya-locations-react` | Versions independently |
| `packages/kotlin` | Maven `io.github.davidamunga:kenya-locations` | Copies JSON at build (`copyLocationData`) |
| `packages/swift` | Swift Package Index `KenyaLocations` | CI copies `data/*.json` into Resources |
| `packages/dart` | pub.dev `kenya_locations` | Versions independently; codegen into consts |
| `apps/web` | kenya-locations.web.app | Demo |
| `examples/android`, `examples/flutter` | — | Consume Kotlin / Dart packages |

JS, Kotlin, and Swift share one version number. React and Dart do not.

## Commands

```bash
pnpm validate                                      # data/*.json integrity
pnpm --filter kenya-locations test                 # JS tests
pnpm --filter kenya-locations lint
dart run packages/dart/scripts/generate_data.dart  # from repo root, after data edits
```

Data shape and validation rules: `packages/js/CONTRIBUTING.md`.

## Branches

`<type>/<short-slug>` using the same types as commits. No `cursor/` prefix.

```
feat/search-types
fix/dart-ward-lookup
data/nairobi-westlands
ci/commitlint
chore/agents-md
```

Open PRs from that branch against `main`. Title the PR as a conventional commit (`fix(dart): …`) so squash-merges stay valid.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Enforced by commitlint (`commitlint.config.js`) in the `commit-msg` hook and in CI.

```
<type>(<optional scope>): <description>
```

Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert` · **`data`** (shared JSON updates).

Description: imperative, lowercase, no trailing period, ≤ 100 chars.

Scopes are optional. Prefer a package or concern: `js` · `react` · `kotlin` · `swift` · `dart` · `web` · `examples` · `ci` · `search` · `validation` · a county name for data (`nairobi`).

```
data(nairobi): add localities in Westlands
feat(search): add type-specific filtering
fix(dart): resolve Township ward collisions by code
ci: run commitlint on pull requests
docs: document dart data regeneration
```

Breaking API changes: `feat(js)!:` or a `BREAKING CHANGE:` footer. One logical change per commit.

`pnpm exec commitlint --last --verbose` checks HEAD. Squash-merge PR titles must also match this format. Rules live in `commitlint.config.js` — edit that file, not this list, when types change.
