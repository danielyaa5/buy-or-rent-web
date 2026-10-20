# Financial model

## Decision metric

The calculator compares **liquidatable net worth at the end of the selected stay**, not the sum of payments.

For the buyer:

```text
buy wealth =
  home market value
  - remaining mortgage
  - selling costs
  - optional tax on non-excluded sale gain
  + invested remaining starting cash
  + invested monthly owner savings
```

When the buyer plans to rent a room or ADU, monthly owner cost is reduced by
expected rental cash flow:

```text
collected rent =
  gross room / ADU rent × (1 - vacancy allowance)

net rental income =
  collected rent
  - management fee
  - repairs and turnover reserve
  - other recurring rental costs
  - added landlord insurance
  - estimated income tax on positive cash profit
```

One-time permitting, furnishing, and tenant-ready setup costs increase the
buyer's upfront cash requirement. Gross rental income grows using its own
assumption; recurring costs grow with cost inflation and added insurance grows
with insurance inflation.

For the renter:

```text
rent wealth =
  invested remaining starting cash
  + invested monthly renter savings
  + refundable security deposit
```

Both paths start with the same capital: the larger of buyer and renter upfront cash requirements. Each invests the amount remaining after its own upfront costs. This prevents a negative renter investment account when renter move-in costs exceed buyer cash requirements. The security deposit is held outside investments and returned without growth.

Both sides compound their invested balances monthly using the user’s expected **after-tax, after-fee** investment return. Home appreciation, rent, insurance, property taxes, maintenance, HOA, and the owner utility difference each grow using their relevant assumptions.

## Corrections made during the v2 audit

The rebuilt model corrects several weak assumptions in the original prototype and the first v2 pass:

1. **Mortgage insurance follows the selected program.** Conventional PMI is modeled until the modeled balance reaches 78% of the original home value (or the loan midpoint). FHA MIP lasts 11 years when original LTV is 90% or less and the full loan term above 90% LTV. VA and cash purchases have no monthly mortgage insurance. FHA premiums use the projected annual average base-loan balance; conventional PMI uses the original financed balance, including financed fees when they push the modeled loan above 80% loan-to-value. This is a planning approximation, not exact servicer billing. User-entered rates remain authoritative; defaults do not check loan size, term, eligibility, VA exemptions or prior use.
2. **Property tax no longer follows home appreciation automatically.** The starting tax is based on a state effective rate, then grows by a separate editable assessment-growth assumption. This matters in states with assessment caps.
3. **Insurance is a dollar estimate, not a percent of market value.** State average annual homeowner and renter premiums load as starting points and grow using a separate insurance assumption.
4. **Maintenance follows cost inflation.** The maintenance reserve begins as a percent of purchase price, then grows with cost inflation rather than speculative home appreciation.
5. **HOA and utility differences follow cost inflation.** They no longer reuse rent growth.
6. **Renters insurance is included.** Renting cost is rent plus the editable annual renters insurance estimate.
7. **Break-even is durable.** The reported month is the first point after which buying remains ahead through the selected horizon, not a temporary crossover.
8. **Home-sale tax can be modeled.** Users may enter a combined effective tax rate and gain exclusion. The model applies the exclusion only after a two-year stay; actual eligibility can be more complicated.
9. **The investment assumption is labeled correctly.** Users should enter an expected return after taxes and investment fees so the renter portfolio is not overstated.
10. **Financing costs affect both cash and debt.** Points, seller credits, FHA/VA-style upfront fees, and the choice to finance the fee change the buyer's initial cash and mortgage balance.
11. **Move-in costs are asymmetric.** Immediate buyer renovations and renter broker/move-in fees reduce wealth. A renter security deposit is removed from invested cash and returned without appreciation at the end. Entered renovation costs are treated as capital improvements for the optional sale-gain estimate; ordinary repairs may not qualify.
12. **Federal tax savings are incremental.** The model compares the renter's best deduction (standard or itemized) with the owner's best deduction every month using annualized interest and property tax. Only the difference in estimated federal tax is credited to ownership.
13. **Room and ADU income is net, not headline rent.** The owner receives rent only after an editable vacancy allowance, management fee, repair/turnover reserve, recurring costs, added insurance, one-time setup costs, and an effective tax rate on positive rental cash profit.

## 2026 federal income-tax estimate

The tax module uses the IRS tax-year 2026 ordinary-income brackets and standard deductions for single, married filing jointly, head of household, and married filing separately.

The renter and owner calculations both include user-entered other itemized deductions and non-property state/local taxes. The owner additionally receives:

- property tax that fits inside the combined SALT cap after other state/local taxes;
- mortgage interest, reduced proportionally when annual average acquisition debt exceeds the entered debt limit;
- an optional user-entered annual state-specific homeowner benefit.

The calculator totals scheduled mortgage interest and property tax for each projection year, compares federal tax on income after each side's larger standard-or-itemized deduction, and allocates that year's incremental benefit across its months. For 2026, the default SALT cap is $40,400 ($20,200 married filing separately), with the statutory income phaseout and $10,000/$5,000 floor. In current-law mode, both the cap and phaseout threshold grow 1% through 2029, the income phaseout is recomputed using each year’s projected income, and the cap becomes $10,000/$5,000 in 2030. A manual mode instead grows the entered 2026 cap 1% through 2029 and uses the entered cap from 2030. Income and non-property SALT grow using the income-growth input; brackets, the standard deduction, other deductions, and a manual state benefit grow using cost inflation. The mortgage acquisition-debt limit defaults to $750,000 ($375,000 married filing separately).

This is a planning approximation rather than tax-return software. It does not model alternative minimum tax, tax credits, additional senior/blind deductions, the high-income limitation on itemized-deduction benefits, acquisition dates before December 16, 2017, mixed-use debt, refinancing, points deductibility, or state-specific itemization rules. The interface flags the simplified federal estimate and mixed-use limitations. All modeled statutory dollar limits and any state benefit can be overridden. A partial final year uses a full-year annualized estimate allocated only to the modeled months; it is not a part-year tax filing calculation. Interest on financed upfront fees is conservatively excluded from acquisition-debt interest.

The room/ADU estimate is also a cash-flow approximation, not a Schedule E tax
return. Its effective rental tax-rate input is deliberately manual. The model
does not calculate depreciation, allocate mortgage interest or property tax
between personal and rental use, apply passive-activity loss limits, determine
self-employment treatment, or calculate local short-term-rental and occupancy
taxes.

## State coverage

Every U.S. state has editable starting points for:

- effective property-tax rate;
- annual homeowners insurance;
- annual renters insurance.

Property-tax rates are derived from the U.S. Census Bureau’s 2024 American Community Survey:

- B25103: median real estate taxes paid;
- B25077: median owner-occupied home value;
- effective rate = median tax / median value.

Insurance values use the 2022 state-level NAIC averages published by the Insurance Information Institute, for HO-3 homeowners and HO-4 renters policies.

These are **statewide orientation values**, not quotes. County, municipality, property type, exemptions, coverage amount, construction, catastrophe exposure, credit-based insurance rules, and claim history can materially change them. The interface explicitly asks users to replace the defaults with a local tax bill and insurance quote.

## Deliberately excluded from the default result

The model also excludes:

- special assessments;
- flood, earthquake, wind-only, or other supplemental insurance unless included manually;
- ARM resets and temporary rate buydowns;
- refinancing;
- detailed eligible acquisition closing costs in home-sale basis (buying-cost totals also contain items that do not qualify);
- investment tax-lot timing;
- deposit loss or damage charges;
- federal or state tax on home-sale gain unless entered;
- automatic ZIP-level property-tax or insurance lookup. ZIP is currently scenario context; local figures still require a quote or tax bill.

## Sources

- [U.S. Census Bureau, 2024 ACS Table B25103](https://data.census.gov/table/ACSDT1Y2024.B25103)
- [U.S. Census Bureau, 2024 ACS Table B25077](https://data.census.gov/table/ACSDT1Y2024.B25077)
- [NAIC state insurance averages published by Triple-I](https://www.iii.org/fact-statistic/facts-statistics-homeowners-and-renters-insurance)
- [CFPB guidance on PMI cancellation](https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/)
- [IRS Topic 701, sale of a home](https://www.irs.gov/taxtopics/tc701)
- [IRS 2026 inflation adjustments and tax brackets](https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill)
- [IRS 2026 SALT deduction correction](https://www.irs.gov/forms-pubs/correction-to-state-and-local-income-tax-deduction-amount-in-the-2026-form-1040-es)
- [IRS Topic 505, mortgage-interest debt limits](https://www.irs.gov/taxtopics/tc505)
- [HUD annual mortgage-insurance premiums](https://www.hud.gov/program_offices/housing/comp/premiums/annual_mip)
- [HUD premium calculation](https://www.hud.gov/hud-partners/housing-premium-calculation)
- [IRS Publication 936, average mortgage balances](https://www.irs.gov/publications/p936)
- [VA funding fee and closing costs](https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/)
- [FHFA House Price Index methodology and datasets](https://www.fhfa.gov/data/hpi)

## Extra principal and cash-flow breakdown

Extra principal is paid with each monthly payment, starting in month one, and capped at the remaining balance. The model recalculates interest, annual mortgage-interest deductions, and the payoff date. After payoff, mortgage payments stop and the resulting savings follow the same investment rules as other cost differences. It does not model prepayment penalties or recasting. Conventional PMI uses the modeled balance; accelerated cancellation may require a lender request and other eligibility conditions. Confirm cancellation timing with the servicer.

The first-month breakdown reconciles to reported owner and renter cash flow. Principal, including extra principal, is a cash outflow that also builds equity. Net rental cash flow and estimated tax benefits reduce owner cost. Tax benefits are a monthly allocation, not a promise of monthly refunds.

## Timing and reported periods

Investment balances grow before that month's cost difference is invested (end-of-month contributions). Mortgage amortization is monthly. The chart and table include the final month even when the stay ends partway through a year. Wealth is an endpoint balance; rental income and tax benefit columns sum the actual modeled months in that period. Break-even can occur in month one and means buying stays ahead only through the selected horizon, not forever.
