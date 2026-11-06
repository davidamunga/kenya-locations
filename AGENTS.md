# kenya-locations

Shared Kenyan administrative divisions (counties → wards / localities → areas) packaged as typed libraries. `data/*.json` is the source of truth; every language package consumes it.

## Packages

| Path | Publish as | Notes |
|---|---|---|
| `packages/js` | npm `kenya-locations` | Canonical API; changesets |
| `packages/react` | npm `kenya-locations-react` | Versions independently |
| `packages/kotlin` | Maven `io.github.davidamunga:kenya-locations` | Copies JSON at build (`copyLocationData`) |
| `packages/swift` | Swift Package Index `KenyaLocations` | Commits a copy of `data/*.json` in `Sources/KenyaLocations/Resources` |
| `packages/dart` | pub.dev `kenya_locations` | Versions independently; codegen into consts |
| `packages/php` | Packagist `davidamunga/kenya-locations` | Versions independently; split to `kenya-locations-php` |
| `packages/dotnet` | NuGet `KenyaLocations` | Versions independently; embeds a copy of `data/*.json` (`pnpm data:sync`) |
| `packages/python` | PyPI `kenya-locations` | Versions independently; `django` and `fastapi` extras; commits a copy of `data/*.json` |
| `apps/web` | kenya-locations.web.app | Demo |
| `examples/android`, `examples/flutter`, `examples/wordpress`, `examples/django`, `examples/fastapi` | — | Consume Kotlin / Dart / PHP / Python packages |

JS, Kotlin, and Swift share one version number (`fixed` in `.changeset/config.json`). React, Dart, PHP, .NET, and Python do not.

Release process: [RELEASING.md](RELEASING.md).

## Commands

```bash
pnpm validate                                      # data/*.json integrity
pnpm --filter kenya-locations test                 # JS tests
pnpm --filter kenya-locations lint
composer --working-dir=packages/php test           # PHP tests
dotnet test packages/dotnet                        # .NET tests
composer --working-dir=examples/wordpress test     # WordPress example tests
composer --working-dir=examples/wordpress zip      # WordPress release zip (vendor copied in)
uv run --directory packages/python pytest          # Python, Django and FastAPI tests
uv run --directory packages/python ruff check      # Python lint (also: ruff format --check, mypy)
pnpm changeset                                     # describe a releasable change
pnpm changeset:data                                # write the changeset for a data/*.json change
pnpm changeset:check                               # fail if product files lack a changeset
pnpm data:sync                                     # copy data/*.json into every package (after data edits)
pnpm release:verify                                # versions, composer.lock and data copies are consistent
dart run packages/dart/scripts/generate_data.dart  # from repo root, after data edits (data:sync runs it if dart is installed)
```

Data shape, codes and validation rules: [`data/README.md`](data/README.md).

Cross-language behaviour (lookups, search) is pinned by [`tests/parity/cases.json`](tests/parity/README.md); every package runs it, with JS as the reference. Add a case there when changing matching or search rules.

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

Scopes are optional. Prefer a package or concern: `js` · `react` · `kotlin` · `swift` · `dart` · `php` · `dotnet` · `python` · `web` · `examples` · `ci` · `search` · `validation` · a county name for data (`nairobi`).

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

- Data: `pnpm changeset:data` (bumps core, Dart, PHP, .NET and Python; Version Check enforces it).
- JS / Kotlin / Swift API: one changeset; the core trio bumps together.
- React-only: changeset that lists `kenya-locations-react`.
- Dart-only: changeset that lists `kenya-locations-dart`.
- PHP-only: changeset that lists `kenya-locations-php`.
- .NET-only: changeset that lists `kenya-locations-dotnet`.
- Python-only (including Django and FastAPI): changeset that lists `kenya-locations-python`.
- Docs / CI / examples (including the WordPress zip): no changeset.

After merge, Changesets opens `chore: version packages`. Merging it runs the **Release** workflow: it tags each product whose version moved (`v{core}`, `react-v{x}`, `dart-v{x}`, `php-v{x}`, `dotnet-v{x}`, `python-v{x}`), drafts the GitHub releases, and after one approval on the `release` environment dispatches each publish workflow on its tag. Details in [RELEASING.md](RELEASING.md).
