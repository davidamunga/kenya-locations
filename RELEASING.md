# Releasing

Changesets versions packages; the **Release** workflow tags them and, after one approval, publishes each to its registry.

## Version graph

| Group | Packages | How they bump |
|---|---|---|
| Core trio | JS, Kotlin, Swift | Same number. A changeset for any one bumps all three. |
| React | `kenya-locations-react` | Own number. Add a changeset only when hooks need a release. |
| Dart | `kenya_locations` | Own number. Add a changeset only when the Dart package should ship. |
| PHP | `davidamunga/kenya-locations` | Own number. Add a changeset only when the PHP package should ship. |
| .NET | `KenyaLocations` (NuGet) | Own number. Add a changeset only when the .NET package should ship. |
| Python | `kenya-locations` on PyPI | Own number. Add a changeset for `kenya-locations-python` only when the Python package should ship. |
| Go | `github.com/davidamunga/kenya-locations/packages/go` | Own number. Add a changeset for `kenya-locations-go` only when the Go module should ship. |

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
| .NET | `src/KenyaLocations/KenyaLocations.csproj` (`<Version>`) | `src/KenyaLocations/Data/` |
| Python | `pyproject.toml` + the package's own entry in `uv.lock` | `src/kenya_locations/data/` |
| Go | — (git tag `packages/go/v{version}`) | `data/` (`go:embed`) |

| Command | What it does |
|---|---|
| `pnpm release:sync` | Writes each `package.json` version into the files above and refreshes `composer.lock` and `uv.lock` |
| `pnpm release:verify` | Fails if any recorded version, lock file or data copy is out of date |
| `pnpm data:sync` | Copies `data/*.json` into every package; regenerates Dart if `dart` is installed |

To add a product or another place a version lives, edit the manifest; sync, verify and the changeset check all read it.

Swift stays on the stub version. The **Release** workflow owns the git tags.

## After the Version PR

Merging `chore: version packages` runs the **Release** workflow (`.github/workflows/release.yml`) on `main`:

1. **Plan.** `scripts/release/plan.js` compares each product's version with its tags. A product is released when its tag doesn't exist yet. The workflow doesn't look at the commit title, so a reworded squash title can't skip a release, and a failed release is retried on the next push to `main`.
2. **Tag and draft.** It creates one tag per released product and a draft GitHub release whose notes come from that product's changelog:

   | Product | Tag |
   |---|---|
   | JS, Kotlin, Swift | `v{version}` |
   | React | `react-v{version}` |
   | Dart | `dart-v{version}` |
   | PHP | `php-v{version}` |
   | .NET | `dotnet-v{version}` |
   | Python | `python-v{version}` |
   | Go | `packages/go/v{version}` |

   The WordPress plugin zip is attached to the core `v*` release.
3. **Approve.** The publish job waits on the `release` environment. Approve it once in the Actions run.
4. **Publish.** It dispatches each product's workflow on its tag: **Publish Core Packages** (JS → npm, Kotlin → Maven Central, Swift tag check), **Publish React to npm**, **Publish Dart to pub.dev**, **Publish PHP to Packagist**, **Publish .NET to NuGet**, **Publish Python to PyPI**, **Publish Go module**. Each one publishes its draft GitHub release only after its registry publish succeeds. A failure fails that run; nothing is hidden with `|| true`.

You can still run any publish workflow by hand (Actions → Run workflow) to retry one product.

### One-time setup

- **`release` environment:** Settings → Environments → `release` → add yourself under **Required reviewers**. Do this before the first release that uses this workflow: without reviewers, GitHub creates the environment unprotected and publishing starts without asking.
- **pub.dev:** in the package's admin page → Automated publishing, allow GitHub Actions for this repository with tag pattern `dart-v{{version}}`, and allow `workflow_dispatch` events. The Release workflow dispatches **Publish Dart to pub.dev** on the `dart-v*` tag.
- **PyPI:** publishing uses [Trusted Publishing](https://docs.pypi.org/trusted-publishers/), so no token is stored. On pypi.org, add a trusted publisher for `DavidAmunga/kenya-locations` with workflow `publish-python.yml` and environment `pypi` (a pending publisher works before the first release). Then create the `pypi` environment in GitHub (Settings → Environments). **Publish Python to PyPI** builds the wheel and sdist from `packages/python`, runs the tests, smoke-tests each installed artifact with `scripts/smoke_test.py`, then uploads them.
- **Go:** there is no registry. A module in `packages/go` is published by the `packages/go/v{version}` tag, which the Release workflow pushes. **Publish Go module** then vets and tests the tagged code, asks the Go proxy (`proxy.golang.org`) to fetch the tag so pkg.go.dev lists it, and publishes the draft GitHub release. The tag must be that exact prefix; `go get ...@v0.1.0` does not resolve a plain `v0.1.0` tag for a subdirectory module.
- **`PHP_SPLIT_DEPLOY_KEY`:** the private half of a write-enabled deploy key on [`davidamunga/kenya-locations-php`](https://github.com/davidamunga/kenya-locations-php) (that repo → Settings → Deploy keys). It can push only to that repo and doesn't expire. **Publish PHP to Packagist** fails if it is missing. To rotate it: `ssh-keygen -t ed25519 -N "" -f key`, add `key.pub` as a deploy key with write access, `gh secret set PHP_SPLIT_DEPLOY_KEY < key`, then delete the old deploy key and both local files.

- **NuGet:** create the `KenyaLocations` package once on nuget.org, then add a **Trusted Publishing** policy (nuget.org → your profile → Trusted Publishing) for repository `DavidAmunga/kenya-locations`, workflow file `publish-dotnet.yml`. Set the repository variable `NUGET_USER` to your nuget.org profile name (Settings → Secrets and variables → Actions → Variables). No API key secret is needed. If a `NUGET_API_KEY` secret is set the workflow uses it instead (needed for the first push of a new package ID); delete the secret afterwards and trusted publishing takes over.

### PHP and WordPress

PHP is published from the subtree repo
[`davidamunga/kenya-locations-php`](https://github.com/davidamunga/kenya-locations-php)
(Packagist needs `composer.json` at the repo root). **Publish PHP to Packagist** validates `packages/php`, then `git subtree split`s that prefix and pushes `main` plus `v{php}` to the subtree repo over SSH with the deploy key. Packagist follows tags there via its GitHub webhook. First submit: [packagist.org/packages/submit](https://packagist.org/packages/submit) with `https://github.com/davidamunga/kenya-locations-php`.

The WordPress plugin is not a Changesets package. A self-contained zip (PHP library copied into `vendor/`, install steps in `readme.txt`) is built from `examples/wordpress`:

```bash
composer --working-dir=examples/wordpress zip
```

The Release workflow attaches it to the core `v*` release. **Publish PHP to Packagist** rebuilds it and `--clobber`s it onto the latest `v*` release, so a PHP or data bump refreshes the plugin without a core tag. **Publish WordPress plugin zip** does the same on demand. WordPress.org SVN is not part of this process.

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
pnpm data:sync            # refresh the Kotlin, Swift, PHP, .NET, Python and Go copies (and Dart, if installed)
pnpm changeset:data       # write .changeset/data-*.md from the diff against origin/main
```

`changeset:data` lists every added, removed, renamed and changed record by code, and bumps every product that ships the data (core, Dart, PHP, .NET, Python and Go). Version Check fails a data PR whose changesets skip one of them. Edit the generated summary if a change needs more context.

### Changelog format

`.changeset/changelog.cjs` writes each entry as the change, its PR link, and the PR author: `… ([#79](…/pull/79)) by [@achingachris](https://github.com/achingachris)`. There are no commit hashes.

- The PR and author come from the GitHub API for the commit that added the changeset, so the Changesets workflow needs `GITHUB_TOKEN` (it has it). If the lookup fails, the entry has the PR link and no credit; the release is not blocked.
- To credit someone else, or several people, add a line to the changeset: `Credit: @alice, @bob`. It replaces the PR author and is removed from the entry. Bots and Claude are never credited.
- GitHub release notes are the changelog section plus a `**Contributors:** @alice, @bob` line built from those credits.
