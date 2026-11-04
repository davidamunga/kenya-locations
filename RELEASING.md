# Releasing

Two phases: Changesets versions packages, then a human publishes to each registry.

## Version graph

| Group | Packages | How they bump |
|---|---|---|
| Core trio | JS, Kotlin, Swift | Same number. A changeset for any one bumps all three. |
| React | `kenya-locations-react` | Own number. Add a changeset only when hooks need a release. |
| Dart | `kenya_locations` | Own number. Add a changeset only when the Dart package should ship. |
| PHP | `davidamunga/kenya-locations` | Own number. Add a changeset only when the PHP package should ship. |

`apps/web` is ignored. Do not bump versions by hand except in an emergency.

```
pnpm changeset                 # pick packages + bump type
# merge the feature PR
# merge the "chore: version packages" PR
```

`pnpm changeset:version` (used by CI) runs `changeset version`, then `pnpm release:sync`.

## Release manifest

[`scripts/release/manifest.js`](scripts/release/manifest.js) lists every product, where its version is recorded, and its copies of `data/*.json`. Changesets owns the version in each `package.json`; everything else is derived:

| Package | Also records the version in | Ships a copy of `data/` |
|---|---|---|
| JS | — | bundled at build |
| Kotlin | `gradle.properties` (`VERSION_NAME`) | `src/main/resources/` |
| Swift | — (git tag) | `Sources/KenyaLocations/Resources/` |
| Dart | `pubspec.yaml` | `lib/src/generated/data.dart` (generated) |
| PHP | `composer.json` + `composer.lock` content-hash | `data/` |

| Command | What it does |
|---|---|
| `pnpm release:sync` | Writes each `package.json` version into the files above and refreshes `composer.lock` |
| `pnpm release:verify` | Fails if any recorded version, lock file or data copy is out of date |
| `pnpm data:sync` | Copies `data/*.json` into every package; regenerates Dart if `dart` is installed |

To add a product or another place a version lives, edit the manifest; sync, verify and the changeset check all read it.

Swift stays on the stub version. **Create Release** owns the `vX.Y.Z` git tag.

## After the Version PR

If the core trio changed, CI tags `v{js}` , pushes `release/v{js}`, and opens a **draft** GitHub release.

Then run workflows from that release branch (or `main` if you prefer):

| Workflow | When |
|---|---|
| **Publish Core Packages** | JS → npm, Kotlin → Maven Central, Swift verifies `v*` exists |
| **Publish React to npm** | React-only or when React was in the Version PR |
| **Publish Dart to pub.dev** | Dart-only or when Dart was in the Version PR |
| **Publish PHP to Packagist** | PHP-only or when PHP was in the Version PR |
| **Publish WordPress plugin zip** | Rebuild / attach the plugin zip to an existing `v*` release |

Do not use a leftover **Publish All Packages** button — that workflow is now core-only.

First `kenya_locations` publish on pub.dev must succeed once (package + trusted publisher). After that, **Publish Dart to pub.dev** can use OIDC.

PHP is published from the subtree repo
[`davidamunga/kenya-locations-php`](https://github.com/davidamunga/kenya-locations-php)
(not this monorepo — Packagist needs `composer.json` at the repo root).

**Publish PHP to Packagist** validates `packages/php`, then `git subtree split`s
that prefix and pushes `main` plus `v{php}` to the subtree repo. Add a
`PHP_SPLIT_TOKEN` secret (PAT with `contents:write` on `kenya-locations-php`).

First Packagist submit: [packagist.org/packages/submit](https://packagist.org/packages/submit)
with `https://github.com/davidamunga/kenya-locations-php`. After that, Packagist
follows tags on the subtree repo via the GitHub webhook.

React, Dart, and PHP do not undraft the core `v*` release.

The WordPress plugin is not a Changesets package. A self-contained zip (PHP library copied into `vendor/`, install steps in `readme.txt`) is built from `examples/wordpress` and attached to the core `v*` GitHub release:

```bash
composer --working-dir=examples/wordpress zip
```

**Create Release** uploads `kenya-locations-wordpress-{plugin}.zip` when it opens the draft `v{js}` release. **Publish PHP to Packagist** rebuilds that zip and `--clobber`s it onto the latest `v*` release so a PHP/data bump can refresh the plugin without a core trio tag. **Publish WordPress plugin zip** does the same on demand.

WordPress.org SVN is not part of this process.

## Changesets on feature PRs

Required when you change shared `data/*.json` or published package source. Not required for docs, tests, examples, or CI.

```bash
pnpm changeset
pnpm changeset:check --base origin/main
```

Version Check fails the PR if product files changed without a new `.changeset/*.md` file.

### Data changes

Don't write data changesets by hand:

```bash
# edit data/*.json
pnpm validate
pnpm data:sync            # refresh the Kotlin, Swift and PHP copies (and Dart, if installed)
pnpm changeset:data       # write .changeset/data-*.md from the diff against origin/main
```

`changeset:data` lists every added, removed, renamed and changed record by code, and bumps every product that ships the data (core, Dart and PHP). Version Check fails a data PR whose changesets skip one of them. Edit the generated summary if a change needs more context.

### Changelog format

`.changeset/changelog.cjs` writes each entry as the change followed by its PR link. There are no author credits or commit hashes.
