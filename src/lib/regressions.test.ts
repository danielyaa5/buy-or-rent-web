import { describe, expect, it } from 'vitest'
import { calculateBuyOrRent, DEFAULT_INPUTS, sanitizeInputs } from './calculator'
import { inputsFromSearchParams } from './share'

describe('launch regressions', () => {
  it.each(['constructor', '__proto__', 'toString'])('rejects inherited enum name %s in shared scenarios', (value) => {
    const input = inputsFromSearchParams(new URLSearchParams({ filingStatus: value, loanType: value, state: value }))
    expect(input.filingStatus).toBe(DEFAULT_INPUTS.filingStatus)
    expect(input.loanType).toBe(DEFAULT_INPUTS.loanType)
    expect(input.state).toBe(DEFAULT_INPUTS.state)
    expect(() => calculateBuyOrRent(input)).not.toThrow()
  })

  it('reports an immediate durable advantage before year one', () => {
    const result = calculateBuyOrRent({ ...DEFAULT_INPUTS, loanType: 'cash', monthlyRent: 5_000,
      buyingCosts: 0, sellingCosts: 0, investmentReturn: 0, homeAppreciation: 0,
      propertyTaxRate: 0, annualHomeInsurance: 0, maintenanceRate: 0, annualIncome: 0 })
    expect(result.breakEvenMonth).toBe(1)
  })

  it('uses full annual tax estimates for a partial final projection year', () => {
    const short = calculateBuyOrRent({ ...DEFAULT_INPUTS, stayYears: 1.5 })
    const long = calculateBuyOrRent({ ...DEFAULT_INPUTS, stayYears: 2 })
    expect(short.timeline[12].monthlyTaxBenefit).toBeCloseTo(long.timeline[12].monthlyTaxBenefit, 8)
  })

  it('does not represent renter move-in expenses as a negative investment account', () => {
    const result = calculateBuyOrRent({ ...DEFAULT_INPUTS, downPaymentPercent: 0,
      buyingCosts: 0, renterMoveInCosts: 1_000_000, investmentReturn: 10, stayYears: 1 })
    expect(result.rentWealth).toBeGreaterThanOrEqual(0)
  })

  it('does not treat the string false as a financed-fee instruction', () => {
    const result = sanitizeInputs({ ...DEFAULT_INPUTS, financeUpfrontLoanFee: 'false' as unknown as boolean })
    expect(result.financeUpfrontLoanFee).toBe(false)
  })
})
