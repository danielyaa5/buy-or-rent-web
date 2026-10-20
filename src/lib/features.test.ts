import { describe, expect, it } from 'vitest'
import { calculateBuyOrRent, DEFAULT_INPUTS, sanitizeInputs } from './calculator'
import { annualCsv, applyPropertyPreset, inputLabel } from './scenario-tools'
import { inputsFromSearchParams, inputsToSearchParams } from './share'

describe('extra principal', () => {
  it('pays a zero-interest mortgage off early without overpaying its final month', () => {
    const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, homePrice: 120_000, downPaymentPercent: 0,
      mortgageRate: 0, loanTermYears: 10, monthlyExtraPrincipal: 7_000, stayYears: 2, pmiRate: 0 })
    expect(r.monthlyMortgage).toBe(1_000)
    expect(r.mortgagePayoffMonth).toBe(15)
    expect(r.timeline[14].mortgageBalance).toBe(0)
    expect(r.timeline[15].monthlyOwnerCost).toBeLessThan(r.timeline[14].monthlyOwnerCost)
    expect(r.totalInterest).toBe(0)
  })
  it('reduces interest and tax deductions consistently with faster amortization', () => {
    const input = { ...DEFAULT_INPUTS, stayYears: 20, annualIncome: 300_000, annualOtherItemizedDeductions: 50_000 }
    const normal = calculateBuyOrRent(input)
    const extra = calculateBuyOrRent({ ...input, monthlyExtraPrincipal: 2_000 })
    expect(extra.totalInterest).toBeLessThan(normal.totalInterest)
    expect(extra.totalTaxBenefit).toBeLessThan(normal.totalTaxBenefit)
    expect(extra.mortgagePayoffMonth).not.toBeNull()
    expect(normal.mortgagePayoffMonth).toBeNull()
    expect(extra.firstMonthOwnerCost - normal.firstMonthOwnerCost).toBeGreaterThan(2_000)
    expect(extra.timeline.every(p => p.mortgageBalance >= 0)).toBe(true)
  })
  it('caps a large final payment and has no extra payment for cash purchases', () => {
    const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, monthlyExtraPrincipal: 1_000_000 })
    expect(r.mortgagePayoffMonth).toBe(1)
    expect(r.firstMonthBreakdown.owner.find(line => line.label.startsWith('Mortgage principal'))?.amount).toBe(r.loanAmount)
    expect(sanitizeInputs({ ...DEFAULT_INPUTS, loanType: 'cash', monthlyExtraPrincipal: 1000 }).monthlyExtraPrincipal).toBe(0)
    expect(calculateBuyOrRent({ ...DEFAULT_INPUTS, loanType: 'cash' }).mortgagePayoffMonth).toBeNull()
  })
  it('round-trips extra principal in shared links', () => {
    expect(inputsFromSearchParams(inputsToSearchParams({ ...DEFAULT_INPUTS, monthlyExtraPrincipal: 500 })).monthlyExtraPrincipal).toBe(500)
  })
})

describe('explainable cash flow', () => {
  it.each(['conventional', 'fha', 'va', 'cash'] as const)('reconciles every month-one line for %s', loanType => {
    const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, loanType, monthlyExtraPrincipal: 500,
      monthlyRentalIncome: 1800, monthlyUtilitiesDelta: -50, monthlyHoa: 400, monthlyRenterExtras: 75 })
    expect(r.firstMonthBreakdown.owner.reduce((sum, line) => sum + line.amount, 0)).toBeCloseTo(r.firstMonthOwnerCost, 8)
    expect(r.firstMonthBreakdown.renter.reduce((sum, line) => sum + line.amount, 0)).toBeCloseTo(r.firstMonthRent, 8)
  })
})

describe('property presets and exports', () => {
  it('changes only the three disclosed preset assumptions', () => {
    const condo = applyPropertyPreset(DEFAULT_INPUTS, 'condo')
    expect(condo.monthlyHoa).toBe(400)
    expect(condo.maintenanceRate).toBe(.5)
    expect(condo.annualHomeInsurance).toBe(600)
    expect(Object.keys(DEFAULT_INPUTS).filter(key => condo[key as keyof typeof condo] !== DEFAULT_INPUTS[key as keyof typeof condo]).sort()).toEqual(['annualHomeInsurance', 'maintenanceRate', 'monthlyHoa'])
    expect(applyPropertyPreset(condo, 'house')).toEqual(DEFAULT_INPUTS)
  })
  it('exports actual partial-period totals with a stable header', () => {
    const r = calculateBuyOrRent({ ...DEFAULT_INPUTS, stayYears: 1.5, monthlyRentalIncome: 1000 })
    const rows = annualCsv(r).trim().split('\r\n').map(row => row.split(','))
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveLength(8)
    expect(rows[2][0]).toBe('18')
    expect(rows[2][1]).toBe('1.50')
    expect(Number(rows[2][2])).toBeCloseTo(r.buyWealth, 2)
    expect(Number(rows[1][6]) + Number(rows[2][6])).toBeCloseTo(r.totalNetRentalIncome, 1)
    expect(rows.slice(1).flat().every(cell => Number.isFinite(Number(cell)))).toBe(true)
    expect(inputLabel('monthlyExtraPrincipal')).toBe('Monthly Extra Principal')
  })
})
