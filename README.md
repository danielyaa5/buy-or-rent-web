# Buy or Rent

Compare the projected wealth from buying a home with renting and investing. Change assumptions and see the result, cash-flow gap, and durable break-even point update immediately.

## Features

- Month-by-month mortgage, home equity, and investment simulation
- Editable tax and insurance starting points for all 50 U.S. states
- Conventional, FHA, VA, and cash purchases, including upfront financing fees
- Buyer closing costs, points, credits, capital improvements, and renter move-in costs
- Room or ADU income after vacancy, operating costs, insurance, and an effective tax estimate
- Incremental federal homeowner tax estimate using 2026 rules, filing status, projected SALT phaseouts, and acquisition-debt limits
- Market outlook and illustrative house/condo presets, year-by-year comparison, and partial-year results
- Extra monthly principal payments with accelerated payoff and updated interest/tax estimates
- Month-one itemized cash flow, pinned scenario A versus current scenario B, annual CSV, and printable reports
- Collapsible advanced input groups and a mobile shortcut to results
- Browser-local autosave, explicit scenario sharing, and recovery from blocked or corrupt storage
- Responsive interface with keyboard-accessible controls and automated accessibility checks

This is a planning calculator, not a lender quote, eligibility check, tax return, or guarantee of investment results. Read [the financial model and limitations](MODEL.md) before interpreting results.

## Run locally

Use the Node version in `.nvmrc` (Node 24) and npm:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No account, API key, database, or backend financial-data service is required.

For a production build:

```sh
npm run build
npm start
```

Fonts are downloaded at build time through `next/font` and served locally at runtime. The first build needs internet access.

## Verification

```sh
npm run check
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

`check` runs unit tests with coverage gates, TypeScript, and lint. Browser tests build a separate production app in `.next-e2e`, run headlessly on port 3100, and stop their own server afterward. They cover Chromium, Firefox, WebKit, and an emulated iPhone viewport. Port 3100 must be free. Reports stay in ignored `playwright-report/`, `test-results/`, and `coverage/` folders.

Financial tests include independent arithmetic fixtures, all state/loan combinations, tax boundaries, malicious saved data, and reconciliation of monthly and annual totals. Automated accessibility checks supplement browser and keyboard testing; they do not certify complete accessibility or real-device behavior.

## Privacy and sharing

All calculations run in the browser. The app has no analytics, advertising, or scenario database. Inputs and an optional pinned scenario are saved in browser local storage; Reset replaces current inputs with defaults and removes the pin. CSV exports contain annual results. Printed reports include all current assumptions, including entered income and ZIP code; review them before sharing. If storage is blocked or full, the calculator continues to work and displays a notice.

A shared link contains **all inputs**, including income and optional ZIP code. Anyone holding it can read them. New links encode the scenario in the URL fragment (after `#`), which is not included in HTTP page requests. Older query-based links still work and can expose inputs to hosting access logs. Hosts may retain ordinary request logs. Opening a shared scenario preserves the previous saved scenario until an input is edited.

## Comparing and exporting

Pin your current inputs as scenario A, then edit scenario B. The comparison shows both results and changed assumptions; restore A or replace the pin at any time. A warning appears when the time horizons differ. Pinned scenarios stay in this browser and are not included in shared links.

Download annual CSV for endpoint wealth and actual period totals, including partial final years. Use Print / save PDF for results and current assumptions. Property presets change only HOA, maintenance, and homeowner insurance. Condo values are illustrative starting values, not quotes, and exclude special assessments.

## Deploying

Use any host supporting Next.js. Set `NEXT_PUBLIC_SITE_URL` to the intended HTTPS origin **at build time**, for example `https://example.com`, only for a public production deployment. `.env.example` documents the setting. With it unset, the app defaults to `noindex`, disallows crawling, and omits sitemap entries. This is an indexing preference, not access control; protect private previews at the host.

See [RELEASE.md](RELEASE.md) for the release checklist and [SECURITY.md](SECURITY.md) for reporting vulnerabilities. CI repeats the checks on pull requests.

## Data and limitations

State property-tax starting points use 2024 ACS medians; insurance inputs use 2022 NAIC statewide averages published by Triple-I. These dated averages are orientation values, not current local quotes. ZIP code is a saved label and does not fetch county data. Replace defaults with property-specific quotes and tax bills.

The model starts its federal projection in 2026. Later brackets and deductions use an inflation assumption; current-law SALT caps are recalculated by projected income through 2029 and revert in 2030. Mixed personal/rental use, depreciation and recapture, AMT, high-income deduction limits, detailed closing-cost basis, and loan qualification are outside the model. See [MODEL.md](MODEL.md) for the full assumptions and primary sources.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md). Released under the [MIT license](LICENSE).
