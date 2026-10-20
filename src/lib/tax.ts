export type FilingStatus =
  | 'single'
  | 'marriedJoint'
  | 'headOfHousehold'
  | 'marriedSeparate'

type TaxBracket = {
  ceiling: number
  rate: number
}

const TAX_BRACKETS_2026: Record<FilingStatus, TaxBracket[]> = {
  marriedJoint: [
    { ceiling: 24_800, rate: 0.1 },
    { ceiling: 100_800, rate: 0.12 },
    { ceiling: 211_400, rate: 0.22 },
    { ceiling: 403_550, rate: 0.24 },
    { ceiling: 512_450, rate: 0.32 },
    { ceiling: 768_700, rate: 0.35 },
    { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  headOfHousehold: [
    { ceiling: 17_700, rate: 0.1 },
    { ceiling: 67_450, rate: 0.12 },
    { ceiling: 105_700, rate: 0.22 },
    { ceiling: 201_750, rate: 0.24 },
    { ceiling: 256_200, rate: 0.32 },
    { ceiling: 640_600, rate: 0.35 },
    { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  single: [
    { ceiling: 12_400, rate: 0.1 },
    { ceiling: 50_400, rate: 0.12 },
    { ceiling: 105_700, rate: 0.22 },
    { ceiling: 201_775, rate: 0.24 },
    { ceiling: 256_225, rate: 0.32 },
    { ceiling: 640_600, rate: 0.35 },
    { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  marriedSeparate: [
    { ceiling: 12_400, rate: 0.1 },
    { ceiling: 50_400, rate: 0.12 },
    { ceiling: 105_700, rate: 0.22 },
    { ceiling: 201_775, rate: 0.24 },
    { ceiling: 256_225, rate: 0.32 },
    { ceiling: 384_350, rate: 0.35 },
    { ceiling: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
}

export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single: 16_100,
  marriedJoint: 32_200,
  headOfHousehold: 24_150,
  marriedSeparate: 16_100,
}

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  marriedJoint: 'Married filing jointly',
  headOfHousehold: 'Head of household',
  marriedSeparate: 'Married filing separately',
}

export const isFilingStatus = (value: string): value is FilingStatus =>
  Object.hasOwn(FILING_STATUS_LABELS, value)

export function calculateFederalIncomeTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
  inflationFactor = 1,
) {
  const safeInflationFactor = Math.max(0.01, inflationFactor)
  let remaining = Math.max(0, taxableIncome) / safeInflationFactor
  let previousCeiling = 0
  let tax = 0

  for (const bracket of TAX_BRACKETS_2026[filingStatus]) {
    if (remaining <= 0) break
    const bracketWidth = bracket.ceiling - previousCeiling
    const incomeInBracket = Math.min(remaining, bracketWidth)
    tax += incomeInBracket * bracket.rate
    remaining -= incomeInBracket
    previousCeiling = bracket.ceiling
  }

  return tax * safeInflationFactor
}

export function get2026SaltDeductionCap(
  filingStatus: FilingStatus,
  modifiedAdjustedGrossIncome: number,
) {
  return getSaltDeductionCap(filingStatus, modifiedAdjustedGrossIncome, 2026)
}

export function getSaltDeductionCap(
  filingStatus: FilingStatus,
  modifiedAdjustedGrossIncome: number,
  year: number,
) {
  const isSeparate = filingStatus === 'marriedSeparate'
  const minimum = isSeparate ? 5_000 : 10_000
  if (year >= 2030) return minimum
  const growth = Math.pow(1.01, Math.max(0, year - 2026))
  const maximum = (isSeparate ? 20_200 : 40_400) * growth
  const phaseoutStarts = (isSeparate ? 252_500 : 505_000) * growth
  const phaseout = Math.max(0, modifiedAdjustedGrossIncome - phaseoutStarts) * 0.3
  return Math.max(minimum, maximum - phaseout)
}

export const getMortgageInterestDebtLimit = (filingStatus: FilingStatus) =>
  filingStatus === 'marriedSeparate' ? 375_000 : 750_000

export type HomeownerTaxBenefitInputs = {
  annualIncome: number
  filingStatus: FilingStatus
  annualOtherItemizedDeductions: number
  annualStateLocalTaxes: number
  annualPropertyTax: number
  annualMortgageInterest: number
  averageMortgageDebt: number
  saltDeductionCap: number
  mortgageInterestDebtLimit: number
  annualStateTaxBenefit: number
  taxInflationFactor?: number
}

export type HomeownerTaxBenefit = {
  annualFederalBenefit: number
  annualStateBenefit: number
  annualTotalBenefit: number
  deductibleMortgageInterest: number
  deductiblePropertyTax: number
  ownerDeduction: number
  renterDeduction: number
  standardDeduction: number
  ownerItemizes: boolean
  renterItemizes: boolean
}

export function calculateAnnualHomeownerTaxBenefit({
  annualIncome,
  filingStatus,
  annualOtherItemizedDeductions,
  annualStateLocalTaxes,
  annualPropertyTax,
  annualMortgageInterest,
  averageMortgageDebt,
  saltDeductionCap,
  mortgageInterestDebtLimit,
  annualStateTaxBenefit,
  taxInflationFactor = 1,
}: HomeownerTaxBenefitInputs): HomeownerTaxBenefit {
  const safeInflationFactor = Math.max(0.01, taxInflationFactor)
  const standardDeduction =
    STANDARD_DEDUCTION_2026[filingStatus] * safeInflationFactor
  const safeSaltCap = Math.max(0, saltDeductionCap)
  const renterSaltDeduction = Math.min(
    Math.max(0, annualStateLocalTaxes),
    safeSaltCap,
  )
  const ownerSaltDeduction = Math.min(
    Math.max(0, annualStateLocalTaxes) + Math.max(0, annualPropertyTax),
    safeSaltCap,
  )
  const deductiblePropertyTax = Math.max(
    0,
    ownerSaltDeduction - renterSaltDeduction,
  )
  const interestDeductiblePortion =
    averageMortgageDebt > 0
      ? Math.min(1, Math.max(0, mortgageInterestDebtLimit) / averageMortgageDebt)
      : 0
  const deductibleMortgageInterest =
    Math.max(0, annualMortgageInterest) * interestDeductiblePortion
  const otherDeductions = Math.max(0, annualOtherItemizedDeductions)
  const renterItemizedDeductions = otherDeductions + renterSaltDeduction
  const ownerItemizedDeductions =
    otherDeductions + ownerSaltDeduction + deductibleMortgageInterest
  const renterDeduction = Math.max(
    standardDeduction,
    renterItemizedDeductions,
  )
  const ownerDeduction = Math.max(standardDeduction, ownerItemizedDeductions)
  const renterTaxableIncome = Math.max(0, annualIncome - renterDeduction)
  const ownerTaxableIncome = Math.max(0, annualIncome - ownerDeduction)
  const annualFederalBenefit = Math.max(
    0,
    calculateFederalIncomeTax(
      renterTaxableIncome,
      filingStatus,
      safeInflationFactor,
    ) -
      calculateFederalIncomeTax(
        ownerTaxableIncome,
        filingStatus,
        safeInflationFactor,
      ),
  )
  const annualStateBenefit = Math.max(0, annualStateTaxBenefit)

  return {
    annualFederalBenefit,
    annualStateBenefit,
    annualTotalBenefit: annualFederalBenefit + annualStateBenefit,
    deductibleMortgageInterest,
    deductiblePropertyTax,
    ownerDeduction,
    renterDeduction,
    standardDeduction,
    ownerItemizes: ownerItemizedDeductions > standardDeduction,
    renterItemizes: renterItemizedDeductions > standardDeduction,
  }
}
