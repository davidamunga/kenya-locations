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
| `packages/php` | Packagist `davidamunga/kenya-locations` | Versions independently; split to `kenya-locations-php` |
| `apps/web` | kenya-locations.web.app | Demo |
| `examples/android`, `examples/flutter`, `examples/wordpress` | — | Consume Kotlin / Dart / PHP packages |

JS, Kotlin, and Swift share one version number (`fixed` in `.changeset/config.json`). React, Dart, and PHP do not.

Release process: [RELEASING.md](RELEASING.md).

## Commands

```bash
pnpm validate                                      # data/*.json integrity
pnpm --filter kenya-locations test                 # JS tests
pnpm --filter kenya-locations lint
composer --working-dir=packages/php test           # PHP tests
composer --working-dir=examples/wordpress test     # WordPress example tests
composer --working-dir=examples/wordpress zip      # WordPress release zip (vendor copied in)
pnpm changeset                                     # describe a releasable change
pnpm changeset:check                               # fail if product files lack a changeset
dart run packages/dart/scripts/generate_data.dart  # from repo root, after data edits
php packages/php/scripts/copy-data.php             # refresh PHP package JSON copies
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

Scopes are optional. Prefer a package or concern: `js` · `react` · `kotlin` · `swift` · `dart` · `php` · `web` · `examples` · `ci` · `search` · `validation` · a county name for data (`nairobi`).

```
data(nairobi): add localities in Westlands
feat(search): add type-specific filtering
fix(dart): resolve Township ward collisions by code
ci: run commitlint on pull requests
docs: document dart data regeneration
```

Breaking API changes: `feat(js)!:` or a `BREAKING CHANGE:` footer. One logical change per commit.

`pnpm exec commitlint --last --verbose` checks HEAD. Squash-merge PR titles must also match this format. Rules live in `commitlint.config.js` — edit that file, not this list, when types change.

## Releases

Do not bump package versions on feature PRs. Add a changeset instead.

- Data or JS / Kotlin / Swift API: one changeset; the core trio bumps together.
- React-only: changeset that lists `kenya-locations-react`.
- Dart-only: changeset that lists `kenya-locations-dart`.
- PHP-only: changeset that lists `kenya-locations-php`.
- Docs / CI / examples (including the WordPress zip): no changeset.

After merge, Changesets opens `chore: version packages`. Merging that PR tags `v{js}` when the core trio moved. Publish is manual: **Publish Core Packages**, **Publish React to npm**, **Publish Dart to pub.dev**, **Publish PHP to Packagist**. Details in [RELEASING.md](RELEASING.md).
