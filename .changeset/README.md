# Changesets

Each `.md` file here describes one releasable change. Changesets turns them into version bumps and changelog entries when the "chore: version packages" PR is opened.

## Writing one

- **Code changes:** `pnpm changeset`, pick the packages, then write the summary for users: what changed and what to do about it. The first line is the headline.
- **Data changes:** `pnpm changeset:data`. It writes the summary from the `data/*.json` diff and bumps every package that ships the data.

## Format

`changelog.cjs` turns each changeset into an entry like this:

```md
- Codes are zero-padded: `getCountyByCode("47")` finds Nairobi. ([#49](https://github.com/DavidAmunga/kenya-locations/pull/49)) by [@octocat](https://github.com/octocat)
```

The PR number and author come from the GitHub API for the squash-merge commit (the workflow supplies `GITHUB_TOKEN`); there are no commit hashes. To credit other people, add a line to the changeset: `Credit: @alice, @bob`.

See [RELEASING.md](../RELEASING.md) for the release flow and the release manifest.
