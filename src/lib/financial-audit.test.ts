import { describe, expect, it } from 'vitest'
import { STATE_CODES, STATE_DEFAULTS } from '@/data/states'
import { calculateBuyOrRent, calculateMortgagePayment, DEFAULT_INPUTS, getAnnualTimeline, LOAN_TYPE_DEFAULTS, LoanType, sanitizeInputs } from './calculator'
import { calculateAnnualHomeownerTaxBenefit, calculateFederalIncomeTax, FilingStatus, getSaltDeductionCap, getMortgageInterestDebtLimit } from './tax'
import { formatBreakEven, formatCurrency, formatCompactCurrency, formatPercent } from './format'

// Independent arithmetic fixtures, in addition to invariants across the input space.
const flat = { ...DEFAULT_INPUTS, annualIncome: 0, annualStateTaxBenefit: 0,
  homeAppreciation: 0, rentGrowth: 0, investmentReturn: 0, propertyTaxGrowth: 0,
  insuranceGrowth: 0, costInflation: 0, sellingCosts: 0, buyingCosts: 0,
  propertyTaxRate: 0, annualHomeInsurance: 0, annualRentersInsurance: 0, maintenanceRate: 0,
  renterSecurityDepositMonths: 0, pmiRate: 0, stayYears: 1 }

describe('independent financial fixtures', () => {
  it('reconciles a zero-interest mortgage and both savings accounts by hand', () => {
    const r = calculateBuyOrRent({ ...flat, homePrice: 120_000, downPaymentPercent: 20,
      mortgageRate: 0, loanTermYears: 10, monthlyRent: 1_000 })
    // $24k equal initial capital. Buyer pays $800, invests $200/month; renter invests $24k initially.
    expect(r.monthlyMortgage).toBe(800)
    expect(r.finalMortgageBalance).toBe(86_400)
    expect(r.buyWealth).toBe(36_000)
    expect(r.rentWealth).toBe(24_000)
    expect(r.advantage).toBe(12_000)
    expect(r.totalInterest).toBe(0)
  })
  it('returns a security deposit without treating it as an expense or invested cash', () => {
    const r = calculateBuyOrRent({ ...flat, loanType: 'cash', homePrice: 120_000,
      monthlyRent: 1_000, renterSecurityDepositMonths: 2 })
    expect(r.renterUpfrontCash).toBe(2_000)
    expect(r.rentWealth).toBe(120_000)
    expect(r.buyWealth).toBe(132_000)
  })
  it('uses enough equal starting capital when the renter needs more cash', () => {
    const r = calculateBuyOrRent({ ...flat, homePrice: 120_000, downPaymentPercent: 0,
      mortgageRate: 0, loanTermYears: 10, monthlyRent: 1_000, renterMoveInCosts: 50_000 })
    expect(r.buyWealth).toBe(62_000)
    expect(r.rentWealth).toBe(0)
  })
  it('finances a fee exactly once or pays it upfront, with neither disappearing', () => {
    const input = { ...flat, homePrice: 200_000, downPaymentPercent: 10, upfrontLoanFeeRate: 2 }
    const financed = calculateBuyOrRent({ ...input, financeUpfrontLoanFee: true })
    const paid = calculateBuyOrRent({ ...input, financeUpfrontLoanFee: false })
    expect(financed.loanAmount).toBe(183_600)
    expect(paid.loanAmount).toBe(180_000)
    expect(paid.buyerUpfrontCash - financed.buyerUpfrontCash).toBe(3_600)
    expect(financed.monthlyMortgage).toBeGreaterThan(paid.monthlyMortgage)
  })
  it('limits seller credit to closing expenses without manufacturing cash back', () => {
    const r = calculateBuyOrRent({ ...flat, homePrice: 200_000, buyingCosts: 2, sellerCreditRate: 10 })
    expect(r.buyerUpfrontCash).toBe(40_000)
  })
  it('does not create a tax refund from a rental operating loss', () => {
    const r = calculateBuyOrRent({ ...flat, monthlyRentalIncome: 1_000, rentalVacancyRate: 100,
      monthlyRentalOperatingCosts: 200, rentalIncomeTaxRate: 50 })
    expect(r.firstMonthNetRentalIncome).toBe(-200)
    expect(r.firstMonthRentalIncomeTax).toBe(0)
  })
  it('sums growing rental cash flow rather than multiplying the last month', () => {
    const r = calculateBuyOrRent({ ...flat, monthlyRentalIncome: 1_000, rentalVacancyRate: 0,
      rentalMaintenanceRate: 0, rentalIncomeTaxRate: 0, rentalIncomeGrowth: 12, stayYears: 1.5 })
    const periods = getAnnualTimeline(r.timeline)
    const rate = Math.pow(1.12, 1 / 12)
    const firstYear = 1000 * (Math.pow(rate, 12) - 1) / (rate - 1)
    const lastHalf = 1120 * (Math.pow(rate, 6) - 1) / (rate - 1)
    expect(periods.map((p) => p.year)).toEqual([1, 1.5])
    expect(periods[0].annualNetRentalIncome).toBeCloseTo(firstYear, 6)
    expect(periods[1].annualNetRentalIncome).toBeCloseTo(lastHalf, 6)
    expect(periods.reduce((n, p) => n + p.annualNetRentalIncome, 0)).toBeCloseTo(r.totalNetRentalIncome, 6)
  })
  it('applies the modeled home-sale exclusion starting at month 24', () => {
    const r = calculateBuyOrRent({ ...flat, homePrice: 100_000, homeAppreciation: 10,
      homeSaleTaxRate: 20, homeSaleGainExclusion: 250_000, stayYears: 2 })
    expect(r.timeline[22].homeSaleTax).toBeGreaterThan(0)
    expect(r.timeline[23].homeSaleTax).toBe(0)
  })
  it('continues without mortgage payments or insurance after payoff', () => {
    const r = calculateBuyOrRent({ ...flat, homePrice: 120_000, mortgageRate: 0,
      downPaymentPercent: 0, loanTermYears: 1, stayYears: 2 })
    expect(r.timeline[11].mortgageBalance).toBe(0)
    expect(r.timeline[12].monthlyOwnerCost).toBe(0)
    expect(r.timeline[12].monthlyPmi).toBe(0)
  })
  it('uses declining FHA average balances and ends MIP after 11 years at 90% LTV', () => {
    const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, loanType: 'fha', downPaymentPercent: 10,
      pmiRate: .5, upfrontLoanFeeRate: 1.75, stayYears: 12 })
    expect(r.timeline[12].monthlyPmi).toBeLessThan(r.timeline[0].monthlyPmi)
    expect(r.timeline[131].monthlyPmi).toBeGreaterThan(0)
    expect(r.timeline[132].monthlyPmi).toBe(0)
  })
  it('includes financed fees in conventional loan-to-value and insured balance', () => {
    const financed = calculateBuyOrRent({ ...flat, homePrice: 100_000, downPaymentPercent: 20,
      upfrontLoanFeeRate: 2, financeUpfrontLoanFee: true, pmiRate: 1 })
    const paid = calculateBuyOrRent({ ...flat, homePrice: 100_000, downPaymentPercent: 20,
      upfrontLoanFeeRate: 2, financeUpfrontLoanFee: false, pmiRate: 1 })
    expect(financed.loanAmount).toBe(81_600)
    expect(financed.timeline[0].monthlyPmi).toBe(68)
    expect(paid.timeline[0].monthlyPmi).toBe(0)
  })
  it('has no mortgage insurance with 20% down, regardless of appreciation', () => {
    const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, homeAppreciation: -20 })
    expect(r.timeline.every((p) => p.monthlyPmi === 0)).toBe(true)
  })
  it('computes cash purchase and negative appreciation without NaN', () => {
    const r = calculateBuyOrRent({ ...flat, loanType: 'cash', homeAppreciation: -20 })
    expect(r.finalHomeValue).toBeCloseTo(flat.homePrice * .8, 6)
    expect(calculateMortgagePayment(0, 0, 30)).toBe(0)
  })
})

describe('tax boundaries', () => {
  it.each(['single', 'marriedJoint', 'headOfHousehold', 'marriedSeparate'] as FilingStatus[])(
    'keeps federal tax nonnegative and continuous for %s', (status) => {
      expect(calculateFederalIncomeTax(-100, status)).toBe(0)
      expect(calculateFederalIncomeTax(10_000, status)).toBe(1_000)
      for (const income of [12_400, 24_800, 50_400, 100_800, 201_775, 256_225, 640_600, 768_700, 1_000_000]) {
        const change = calculateFederalIncomeTax(income + 1, status) - calculateFederalIncomeTax(income, status)
        expect(change).toBeGreaterThanOrEqual(.09999)
        expect(change).toBeLessThanOrEqual(.37001)
      }
    })
  it('uses a 30% SALT phaseout and the separate-filer threshold', () => {
    expect(getSaltDeductionCap('single', 515_000, 2026)).toBe(37_400)
    expect(getSaltDeductionCap('marriedSeparate', 262_500, 2026)).toBe(17_200)
    expect(getSaltDeductionCap('single', 0, 2027)).toBe(40_804)
    expect(getSaltDeductionCap('single', 1_000_000, 2029)).toBe(10_000)
    expect(getSaltDeductionCap('single', 0, 2030)).toBe(10_000)
    expect(getSaltDeductionCap('marriedSeparate', 0, 2030)).toBe(5_000)
    expect(getMortgageInterestDebtLimit('marriedSeparate')).toBe(375_000)
  })
  it('deducts only the eligible fraction of interest on the average acquisition balance', () => {
    const r = calculateAnnualHomeownerTaxBenefit({ annualIncome: 300_000, filingStatus: 'single',
      annualOtherItemizedDeductions: 20_000, annualStateLocalTaxes: 40_400,
      annualPropertyTax: 20_000, annualMortgageInterest: 60_000, averageMortgageDebt: 1_000_000,
      saltDeductionCap: 40_400, mortgageInterestDebtLimit: 750_000, annualStateTaxBenefit: -100 })
    expect(r.deductibleMortgageInterest).toBe(45_000)
    expect(r.deductiblePropertyTax).toBe(0)
    expect(r.renterItemizes).toBe(true)
    expect(r.annualStateBenefit).toBe(0)
    expect(r.ownerDeduction - r.renterDeduction).toBe(45_000)
  })
  it('recomputes phaseout as projected income grows, and supports an explicit override', () => {
    const inputs = { ...DEFAULT_INPUTS, annualIncome: 500_000, incomeGrowth: 30, stayYears: 3,
      annualStateLocalTaxes: 0, propertyTaxRate: 5, costInflation: 0 }
    const automatic = calculateBuyOrRent(inputs)
    const manual = calculateBuyOrRent({ ...inputs, useAutomaticSaltCap: false, saltDeductionCap: 40_400 })
    expect(automatic.timeline[0].monthlyTaxBenefit).toBeCloseTo(manual.timeline[0].monthlyTaxBenefit, 6)
    expect(automatic.timeline[12].monthlyTaxBenefit).toBeLessThan(manual.timeline[12].monthlyTaxBenefit)
  })
  it('reconciles table tax totals for complete and partial years', () => {
    const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, stayYears: 2.5 })
    expect(getAnnualTimeline(r.timeline).reduce((n, p) => n + p.annualTaxBenefit, 0)).toBeCloseTo(r.totalTaxBenefit, 6)
    expect(getAnnualTimeline([])).toEqual([])
  })
})

describe('state and loan matrix', () => {
  it.each(STATE_CODES)('maintains finite, reconciled results in %s across all four loan types', (state) => {
    for (const loanType of Object.keys(LOAN_TYPE_DEFAULTS) as LoanType[]) {
      const defaults = STATE_DEFAULTS[state]
      const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, ...LOAN_TYPE_DEFAULTS[loanType], state, loanType,
        propertyTaxRate: defaults.propertyTaxRate, annualHomeInsurance: defaults.annualHomeInsurance,
        annualRentersInsurance: defaults.annualRentersInsurance, stayYears: 40, downPaymentPercent: 5 })
      expect(r.timeline).toHaveLength(480)
      expect(r.finalMortgageBalance).toBeCloseTo(0, 5)
      expect(r.advantage).toBeCloseTo(Math.abs(r.buyWealth - r.rentWealth), 6)
      for (const value of Object.values(r).filter((v) => typeof v === 'number')) expect(Number.isFinite(value)).toBe(true)
      expect(r.timeline.every((p) => p.rentWealth >= 0 && p.mortgageBalance >= 0)).toBe(true)
      if (r.breakEvenMonth !== null) {
        expect(r.timeline.slice(r.breakEvenMonth - 1).every((p) => p.buyWealth >= p.rentWealth)).toBe(true)
      }
    }
  })
  it.each([-Infinity, -1e9, 0, 1e9, Infinity, NaN])('sanitizes every numeric field at boundary %s', (value) => {
    const raw = { ...DEFAULT_INPUTS }
    for (const key of Object.keys(raw) as (keyof typeof raw)[]) {
      if (typeof raw[key] === 'number') Object.assign(raw, { [key]: value })
    }
    const clean = sanitizeInputs(raw)
    const r = calculateBuyOrRent(clean)
    expect(r.timeline.length).toBeGreaterThanOrEqual(12)
    expect(r.timeline.length).toBeLessThanOrEqual(480)
    expect(Object.values(r).filter((v) => typeof v === 'number').every(Number.isFinite)).toBe(true)
  })
})

describe('display formatting', () => {
  it.each([[null, 'Not within your timeline'], [1, '1 mo'], [12, '1 yr'], [25, '2 yr 1 mo']] as const)(
    'formats break-even %s', (months, expected) => expect(formatBreakEven(months)).toBe(expected))
  it('formats finite monetary values and rates', () => {
    expect(formatCurrency(1234.4)).toBe('$1,234')
    expect(formatCompactCurrency(120_000)).toBe('$120K')
    expect(formatPercent(6.5)).toBe('6.5%')
  })
})
