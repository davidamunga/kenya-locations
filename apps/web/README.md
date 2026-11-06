# kenya-locations-web

Interactive demo for [kenya-locations](https://www.npmjs.com/package/kenya-locations), deployed at [kenya-locations.web.app](https://kenya-locations.web.app). UI is [coss ui](https://coss.com/ui).

## Run locally

From the monorepo root:

```bash
pnpm install
pnpm start
```

The app is served at http://localhost:3000 and uses the local `kenya-locations` workspace package.

Area submissions open a prefilled [GitHub issue](https://github.com/davidamunga/kenya-locations/issues/new?template=data_contribution.md) by default, so no `.env` or backend is required.

To let people submit without a GitHub account, set `VITE_SUBMISSIONS_URL` (see `.env.example`) to the Google Apps Script endpoint in [`scripts/submissions/apps-script`](../../scripts/submissions/apps-script/README.md). The form then sends to a public sheet, and a weekly workflow turns new rows into a data PR.
