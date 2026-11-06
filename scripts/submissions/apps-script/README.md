# Submissions endpoint (Google Apps Script)

`Code.gs` receives area suggestions from the web app and appends them to the submissions sheet. It is kept here so changes are reviewed; Google runs the copy you deploy.

## Deploy

1. Create the Google Sheet. Rename the first tab to `Submissions` (the script adds the header row on first use).
2. In the sheet: **Extensions → Apps Script**. Replace the contents of `Code.gs` with this folder's `Code.gs`.
3. **Project Settings → Show "appsscript.json" manifest file**, then paste this folder's `appsscript.json` over it (it sets the web app to run as you and be open to anyone).
4. **Deploy → New deployment → Web app**. Execute as **Me**, who has access **Anyone**. Authorize it when asked: it only needs access to this spreadsheet.
5. Copy the **Web app URL** (it ends in `/exec`). Opening it in a browser should show `{"ok":true,…}`.
6. **Share** the sheet as "Anyone with the link can view", so the weekly import can read it without a key.
7. Give the URL to the web app as `VITE_SUBMISSIONS_URL` (see `apps/web/.env.example`). In CI, set it as the repository variable of the same name; the deploy workflow passes it to the build.

Redeploy after changing `Code.gs` (**Deploy → Manage deployments → Edit → New version**); the URL stays the same.

## What it accepts

A text/plain POST (so browsers send it without a preflight) with JSON:

```json
{ "county_code": "047", "locality": "Westlands", "area": "Highpoint", "display_name": "Jane Doe", "consent": true, "website": "" }
```

| Check | Result |
|---|---|
| `website` filled in (the honeypot) | Answers `ok` and stores nothing |
| `consent` is not `true` | `consent_required` |
| County is not `001`–`047` | `invalid_county` |
| A name is 2–60 characters of letters, digits and ` '’.,-/&()`, with a letter, no link | else `invalid_name` |
| More than 200 submissions in a UTC day, all visitors together | `too_many_today` |

Anything else answers `bad_request`. Values are written as plain text, and one that starts like a formula (`=`, `+`, `-`, `@`) is stored with a leading apostrophe.

Apps Script cannot see visitors' IP addresses, so the limit is global, not per person. The import script is the real gate: it re-checks every rule, drops duplicates, and a maintainer reviews the pull request. To stop a bad row, set its `status` column to `rejected` in the sheet.

## Privacy

The sheet is public. It holds the place names and the optional display name the contributor chose to give, and nothing else: no email addresses, IP addresses or accounts.
