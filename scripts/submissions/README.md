# Contributed submissions

Anyone can suggest an area from the web app without a GitHub account. Submissions go to a public Google Sheet, and a weekly workflow turns the new rows into one pull request for review.

```
Web form ─► Apps Script endpoint ─► Google Sheet ─► import.js (weekly Action) ─► PR on branch data/submissions
```

The pull request is the moderation step. Nothing reaches `data/` until a maintainer merges it.

## What the importer does

`scripts/submissions/import.js` reads the sheet's public CSV export (no API key) and, for each row it has not seen:

- rejects an unknown county code, a name that is too short or long, or one with links, markup or odd characters;
- rejects an area that already exists in that locality (case, accents and punctuation ignored, like the libraries);
- reuses an existing locality's spelling, or creates a new locality and flags it in the PR;
- adds the area next to its siblings in `data/area.json` (and `data/locality.json`), then writes a data changeset with a `Credit:` line for the contributor display names;
- records the row in `sources/submissions/ledger.json`, so every row is handled once.

A maintainer can keep a row out by setting its `status` column to `rejected` (or `spam`, `ignore`) in the sheet.

At most 50 areas are imported per run (`--max`); the rest wait for the next one. A run with nothing to add does not open a PR.

## Sheet format

One tab, named `Submissions`, with a header row. Columns can be in any order:

| Column | Notes |
|---|---|
| `id` | Unique per row; the Apps Script generates it. Rows without one get a hash of their contents |
| `submitted_at` | Timestamp |
| `type` | `area` (the only type imported today; empty means `area`) |
| `county_code` | `001`–`047`; `47` is padded to `047` |
| `locality`, `area` | Place names |
| `display_name` | Optional. Printed in the changelog as `by Jane Doe`; `@`, links, commas and markup are removed |
| `status` | Optional. `rejected`, `spam`, `ignore`, `ignored` or `duplicate` skips the row |

## One-time setup

1. **Create the sheet** with the columns above on a tab named `Submissions`.
2. **Share it** as "Anyone with the link can view". Display names are then public: the form says so, and the field is optional.
3. **Deploy the Apps Script** that appends rows (added with the web form change). Deploy it as a web app that runs as you and is accessible to anyone, and give the web app its URL.
4. **Tell the workflow about the sheet:** in the repository, Settings → Secrets and variables → Actions → Variables, add `SUBMISSIONS_SHEET_ID` (the id in the sheet URL). Add `SUBMISSIONS_SHEET_NAME` only if the tab is not called `Submissions`. The workflow does nothing until the first one is set.
5. **Let CI run on the PR (recommended).** Pull requests opened with the default `GITHUB_TOKEN` do not start other workflows, so the checks would not run. Add a fine-grained personal access token (or a GitHub App token) with Contents and Pull requests read-write on this repository as the secret `SUBMISSIONS_PR_TOKEN`. Without it the PR still opens; push an empty commit to start CI.

## Running it

```bash
SUBMISSIONS_SHEET_ID=<id> node scripts/submissions/import.js --dry-run   # see what would change
SUBMISSIONS_SHEET_ID=<id> pnpm submissions:import                        # edit data/ and write a changeset
node scripts/submissions/import.js --csv rows.csv --dry-run              # a local CSV instead of the sheet
```

Then `pnpm validate && pnpm data:sync`, as for any data change. In CI, run **Import submissions** from the Actions tab; "dry run" prints the result without changing anything.

## Reviewing the pull request

The description lists what was added, what was skipped and why, and which localities are new. Check the new localities and names first. Fix or drop a row by editing the data in the PR, or set its `status` in the sheet and re-run the workflow. The branch is rebuilt from `main` on every run, so rows not yet merged stay in it.
