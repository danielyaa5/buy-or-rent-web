import { describe, expect, it } from 'vitest'

import {
  calculateAnnualHomeownerTaxBenefit,
  calculateFederalIncomeTax,
  get2026SaltDeductionCap,
} from './tax'

describe('2026 federal homeowner tax estimate', () => {
  it('calculates ordinary federal income tax across brackets', () => {
    expect(calculateFederalIncomeTax(150_000, 'marriedJoint')).toBeCloseTo(
      22_424,
      2,
    )
  })

  it('does not invent a homeowner benefit below the standard deduction', () => {
    const result = calculateAnnualHomeownerTaxBenefit({
      annualIncome: 100_000,
      filingStatus: 'marriedJoint',
      annualOtherItemizedDeductions: 0,
      annualStateLocalTaxes: 5_000,
      annualPropertyTax: 4_000,
      annualMortgageInterest: 10_000,
      averageMortgageDebt: 300_000,
      saltDeductionCap: 40_400,
      mortgageInterestDebtLimit: 750_000,
      annualStateTaxBenefit: 0,
    })

    expect(result.ownerItemizes).toBe(false)
    expect(result.annualFederalBenefit).toBe(0)
  })

  it('compares owner itemizing against the renter deduction', () => {
    const result = calculateAnnualHomeownerTaxBenefit({
      annualIncome: 200_000,
      filingStatus: 'marriedJoint',
      annualOtherItemizedDeductions: 5_000,
      annualStateLocalTaxes: 10_000,
      annualPropertyTax: 12_000,
      annualMortgageInterest: 35_000,
      averageMortgageDebt: 600_000,
      saltDeductionCap: 40_400,
      mortgageInterestDebtLimit: 750_000,
      annualStateTaxBenefit: 500,
    })

    expect(result.ownerItemizes).toBe(true)
    expect(result.renterItemizes).toBe(false)
    expect(result.annualFederalBenefit).toBeGreaterThan(0)
    expect(result.annualTotalBenefit).toBe(
      result.annualFederalBenefit + result.annualStateBenefit,
    )
  })

  it('applies the 2026 SALT income phaseout and statutory floor', () => {
    expect(get2026SaltDeductionCap('single', 505_000)).toBe(40_400)
    expect(get2026SaltDeductionCap('single', 1_000_000)).toBe(10_000)
    expect(get2026SaltDeductionCap('marriedSeparate', 1_000_000)).toBe(5_000)
  })
})
