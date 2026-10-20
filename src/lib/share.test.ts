import { describe, expect, it } from 'vitest'

import { DEFAULT_INPUTS } from './calculator'
import { inputsFromSearchParams, inputsToSearchParams } from './share'

describe('shareable scenarios', () => {
  it('round-trips state and changed financial assumptions', () => {
    const scenario = {
      ...DEFAULT_INPUTS,
      state: 'TX' as const,
      propertyTaxRate: 1.49,
      annualHomeInsurance: 2397,
      monthlyRent: 4100,
      zipCode: '78701',
      loanType: 'fha' as const,
      filingStatus: 'single' as const,
      financeUpfrontLoanFee: false,
    }
    const restored = inputsFromSearchParams(inputsToSearchParams(scenario))
    expect(restored).toEqual(scenario)
  })

  it('falls back safely when a shared state or number is invalid', () => {
    const restored = inputsFromSearchParams(
      new URLSearchParams({
        state: 'XX',
        stayYears: '-10',
        homePrice: 'not-a-number',
      }),
    )
    expect(restored.state).toBe(DEFAULT_INPUTS.state)
    expect(restored.stayYears).toBe(1)
    expect(restored.homePrice).toBe(DEFAULT_INPUTS.homePrice)
  })
})
