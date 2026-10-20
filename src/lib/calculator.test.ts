import { describe, expect, it } from 'vitest'

import {
  calculateBuyOrRent,
  calculateMortgagePayment,
  DEFAULT_INPUTS,
  sanitizeInputs,
} from './calculator'
import { STATE_CODES, STATE_DEFAULTS } from '@/data/states'

describe('calculateMortgagePayment', () => {
  it('matches the standard amortization formula', () => {
    expect(calculateMortgagePayment(400_000, 6.5, 30)).toBeCloseTo(2528.27, 2)
  })

  it('supports zero-interest loans', () => {
    expect(calculateMortgagePayment(120_000, 0, 10)).toBe(1000)
  })
})

describe('calculateBuyOrRent', () => {
  it('returns a complete monthly timeline', () => {
    const result = calculateBuyOrRent(DEFAULT_INPUTS)
    expect(result.timeline).toHaveLength(120)
    expect(result.finalHomeValue).toBeGreaterThan(DEFAULT_INPUTS.homePrice)
    expect(result.finalMortgageBalance).toBeLessThan(result.loanAmount)
    expect(result.buyWealth).toBeGreaterThan(0)
    expect(result.rentWealth).toBeGreaterThan(0)
    expect(result.firstMonthRent).toBeCloseTo(
      DEFAULT_INPUTS.monthlyRent + DEFAULT_INPUTS.annualRentersInsurance / 12,
      2,
    )
  })

  it('favors renting when appreciation is weak and buying costs are high', () => {
    const result = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      homeAppreciation: -1,
      investmentReturn: 10,
      buyingCosts: 5,
      sellingCosts: 8,
      stayYears: 5,
    })
    expect(result.winner).toBe('rent')
  })

  it('favors buying when appreciation is strong and rent is expensive', () => {
    const result = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      monthlyRent: 5_500,
      mortgageRate: 4,
      homeAppreciation: 5,
      stayYears: 10,
    })
    expect(result.winner).toBe('buy')
  })

  it('pays off the mortgage at the end of its term', () => {
    const result = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      loanTermYears: 15,
      stayYears: 15,
    })
    expect(result.finalMortgageBalance).toBeCloseTo(0, 2)
  })

  it('ends conventional PMI at 78% of original value, not appreciated value', () => {
    const result = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      downPaymentPercent: 10,
      homeAppreciation: 20,
      stayYears: 15,
    })
    const lastPmiMonth = result.timeline.findLast((point) => point.monthlyPmi > 0)
    expect(lastPmiMonth).toBeDefined()
    expect(lastPmiMonth!.mortgageBalance).toBeGreaterThan(
      DEFAULT_INPUTS.homePrice * 0.78,
    )
    expect(result.timeline[lastPmiMonth!.month].monthlyPmi).toBe(0)
  })

  it('applies optional tax only to home-sale gain above the exclusion', () => {
    const untaxed = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      homeAppreciation: 10,
      stayYears: 10,
    })
    const taxed = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      homeAppreciation: 10,
      stayYears: 10,
      homeSaleTaxRate: 20,
    })
    expect(untaxed.homeSaleTax).toBe(0)
    expect(taxed.homeSaleTax).toBeGreaterThan(0)
    expect(taxed.buyWealth).toBeLessThan(untaxed.buyWealth)
  })

  it('includes only incremental homeowner income-tax savings', () => {
    const withTaxBenefit = calculateBuyOrRent(DEFAULT_INPUTS)
    const withoutTaxBenefit = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      annualIncome: 0,
      annualStateTaxBenefit: 0,
    })

    expect(withTaxBenefit.firstYearFederalTaxBenefit).toBeGreaterThan(0)
    expect(withTaxBenefit.firstMonthOwnerCost).toBeLessThan(
      withTaxBenefit.firstMonthOwnerCostBeforeTax,
    )
    expect(
      withTaxBenefit.timeline
        .slice(0, 12)
        .every(
          (point) =>
            point.monthlyTaxBenefit ===
            withTaxBenefit.timeline[0].monthlyTaxBenefit,
        ),
    ).toBe(true)
    expect(withTaxBenefit.firstMonthTaxBenefit * 12).toBeCloseTo(
      withTaxBenefit.firstYearFederalTaxBenefit +
        withTaxBenefit.firstYearStateTaxBenefit,
      2,
    )
    expect(withTaxBenefit.rentWealth).toBeLessThan(withoutTaxBenefit.rentWealth)
    expect(withTaxBenefit.advantage).not.toBe(withoutTaxBenefit.advantage)
  })

  it('supports FHA mortgage insurance duration and VA funding fees', () => {
    const fha = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      loanType: 'fha',
      downPaymentPercent: 3.5,
      upfrontLoanFeeRate: 1.75,
      pmiRate: 0.55,
      stayYears: 15,
    })
    const va = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      loanType: 'va',
      downPaymentPercent: 0,
      upfrontLoanFeeRate: 2.15,
      pmiRate: 0,
      stayYears: 15,
    })

    expect(fha.upfrontLoanFee).toBeGreaterThan(0)
    expect(fha.timeline.at(-1)!.monthlyPmi).toBeGreaterThan(0)
    expect(va.upfrontLoanFee).toBeGreaterThan(0)
    expect(va.timeline.every((point) => point.monthlyPmi === 0)).toBe(true)
  })

  it('supports a cash purchase with no mortgage payment', () => {
    const result = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      loanType: 'cash',
      downPaymentPercent: 5,
      mortgageRate: 9,
    })

    expect(result.loanAmount).toBe(0)
    expect(result.monthlyMortgage).toBe(0)
    expect(result.downPayment).toBe(DEFAULT_INPUTS.homePrice)
  })

  it('applies credits, renovation, and renter move-in costs upfront', () => {
    const baseline = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      annualIncome: 0,
    })
    const detailed = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      annualIncome: 0,
      mortgagePointsRate: 1,
      sellerCreditRate: 0.5,
      renovationCosts: 25_000,
      renterSecurityDepositMonths: 2,
      renterBrokerFeeRate: 10,
      renterMoveInCosts: 1_000,
    })

    expect(detailed.buyerUpfrontCash).toBeGreaterThan(baseline.buyerUpfrontCash)
    expect(detailed.renterUpfrontCash).toBeGreaterThan(baseline.renterUpfrontCash)
  })

  it('models room or ADU income after vacancy, costs, and income tax', () => {
    const baseline = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      stayYears: 1,
      annualIncome: 0,
    })
    const withRentalIncome = calculateBuyOrRent({
      ...DEFAULT_INPUTS,
      stayYears: 1,
      annualIncome: 0,
      monthlyRentalIncome: 2_000,
      rentalVacancyRate: 10,
      rentalIncomeGrowth: 0,
      rentalManagementRate: 10,
      rentalMaintenanceRate: 10,
      monthlyRentalOperatingCosts: 200,
      annualRentalInsurance: 1_200,
      rentalSetupCosts: 10_000,
      rentalIncomeTaxRate: 25,
      costInflation: 0,
      insuranceGrowth: 0,
    })

    expect(withRentalIncome.firstMonthGrossRentalIncome).toBe(2_000)
    expect(withRentalIncome.firstMonthRentalIncomeTax).toBe(285)
    expect(withRentalIncome.firstMonthNetRentalIncome).toBe(855)
    expect(withRentalIncome.totalNetRentalIncome).toBe(855 * 12)
    expect(withRentalIncome.firstMonthOwnerCost).toBeCloseTo(
      baseline.firstMonthOwnerCost - 855,
      2,
    )
    expect(withRentalIncome.buyerUpfrontCash).toBe(
      baseline.buyerUpfrontCash + 10_000,
    )
    expect(
      withRentalIncome.timeline.every(
        (point) => point.monthlyNetRentalIncome === 855,
      ),
    ).toBe(true)
  })
})

describe('sanitizeInputs', () => {
  it('clamps unsafe and non-finite values', () => {
    const result = sanitizeInputs({
      ...DEFAULT_INPUTS,
      homePrice: Number.NaN,
      downPaymentPercent: 200,
      stayYears: 0,
    })
    expect(result.homePrice).toBe(10_000)
    expect(result.downPaymentPercent).toBe(100)
    expect(result.stayYears).toBe(1)
  })
})

describe('state assumptions', () => {
  it('covers every U.S. state with plausible editable starting points', () => {
    expect(STATE_CODES).toHaveLength(50)
    for (const code of STATE_CODES) {
      const state = STATE_DEFAULTS[code]
      expect(state.name.length).toBeGreaterThan(3)
      expect(state.propertyTaxRate).toBeGreaterThan(0)
      expect(state.propertyTaxRate).toBeLessThan(3)
      expect(state.annualHomeInsurance).toBeGreaterThan(500)
      expect(state.annualRentersInsurance).toBeGreaterThan(100)
    }
  })
})
