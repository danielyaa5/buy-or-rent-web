import { isStateCode, StateCode, STATE_DEFAULTS } from '@/data/states'
import {
  calculateAnnualHomeownerTaxBenefit,
  FilingStatus,
  get2026SaltDeductionCap,
  getSaltDeductionCap,
  getMortgageInterestDebtLimit,
  HomeownerTaxBenefit,
  isFilingStatus,
} from '@/lib/tax'

export type LoanType = 'conventional' | 'fha' | 'va' | 'cash'

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  conventional: 'Conventional mortgage',
  fha: 'FHA loan',
  va: 'VA loan',
  cash: 'Cash purchase',
}

export const LOAN_TYPE_DEFAULTS: Record<
  LoanType,
  { upfrontLoanFeeRate: number; pmiRate: number }
> = {
  conventional: { upfrontLoanFeeRate: 0, pmiRate: 0.7 },
  fha: { upfrontLoanFeeRate: 1.75, pmiRate: 0.55 },
  va: { upfrontLoanFeeRate: 2.15, pmiRate: 0 },
  cash: { upfrontLoanFeeRate: 0, pmiRate: 0 },
}

export const isLoanType = (value: string): value is LoanType =>
  Object.hasOwn(LOAN_TYPE_LABELS, value)

export type CalculatorInputs = {
  state: StateCode
  zipCode: string
  loanType: LoanType
  financeUpfrontLoanFee: boolean
  useAutomaticSaltCap: boolean
  filingStatus: FilingStatus
  homePrice: number
  monthlyRent: number
  downPaymentPercent: number
  mortgageRate: number
  monthlyExtraPrincipal: number
  loanTermYears: number
  stayYears: number
  propertyTaxRate: number
  annualHomeInsurance: number
  annualRentersInsurance: number
  maintenanceRate: number
  monthlyHoa: number
  monthlyUtilitiesDelta: number
  monthlyRenterExtras: number
  monthlyRentalIncome: number
  rentalVacancyRate: number
  rentalIncomeGrowth: number
  rentalManagementRate: number
  rentalMaintenanceRate: number
  monthlyRentalOperatingCosts: number
  annualRentalInsurance: number
  rentalSetupCosts: number
  rentalIncomeTaxRate: number
  homeAppreciation: number
  rentGrowth: number
  investmentReturn: number
  propertyTaxGrowth: number
  insuranceGrowth: number
  costInflation: number
  buyingCosts: number
  sellingCosts: number
  mortgagePointsRate: number
  sellerCreditRate: number
  upfrontLoanFeeRate: number
  renovationCosts: number
  renterSecurityDepositMonths: number
  renterBrokerFeeRate: number
  renterMoveInCosts: number
  pmiRate: number
  annualIncome: number
  incomeGrowth: number
  annualOtherItemizedDeductions: number
  annualStateLocalTaxes: number
  saltDeductionCap: number
  saltDeductionCapAfter2029: number
  mortgageInterestDebtLimit: number
  annualStateTaxBenefit: number
  homeSaleTaxRate: number
  homeSaleGainExclusion: number
}

export type TimelinePoint = {
  month: number
  year: number
  buyWealth: number
  rentWealth: number
  homeValue: number
  mortgageBalance: number
  monthlyOwnerCost: number
  monthlyOwnerCostBeforeTax: number
  monthlyRent: number
  monthlyPmi: number
  monthlyTaxBenefit: number
  monthlyGrossRentalIncome: number
  monthlyNetRentalIncome: number
  monthlyRentalIncomeTax: number
  homeSaleTax: number
}

export type CostLine = { label: string; amount: number }

export type CalculationResult = {
  winner: 'buy' | 'rent'
  advantage: number
  buyWealth: number
  rentWealth: number
  breakEvenMonth: number | null
  monthlyMortgage: number
  mortgagePayoffMonth: number | null
  firstMonthBreakdown: { owner: CostLine[]; renter: CostLine[] }
  firstMonthOwnerCost: number
  firstMonthOwnerCostBeforeTax: number
  firstMonthRent: number
  firstMonthTaxBenefit: number
  firstMonthGrossRentalIncome: number
  firstMonthNetRentalIncome: number
  firstMonthRentalIncomeTax: number
  totalNetRentalIncome: number
  totalTaxBenefit: number
  firstYearFederalTaxBenefit: number
  firstYearStateTaxBenefit: number
  ownerItemizesFirstYear: boolean
  totalInterest: number
  finalHomeValue: number
  finalMortgageBalance: number
  finalHomeEquity: number
  homeSaleTax: number
  downPayment: number
  baseLoanAmount: number
  loanAmount: number
  upfrontLoanFee: number
  buyerUpfrontCash: number
  renterUpfrontCash: number
  timeline: TimelinePoint[]
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  state: 'CA',
  zipCode: '',
  loanType: 'conventional',
  financeUpfrontLoanFee: true,
  useAutomaticSaltCap: true,
  filingStatus: 'marriedJoint',
  homePrice: 750_000,
  monthlyRent: 3_200,
  downPaymentPercent: 20,
  mortgageRate: 6.5,
  monthlyExtraPrincipal: 0,
  loanTermYears: 30,
  stayYears: 10,
  propertyTaxRate: STATE_DEFAULTS.CA.propertyTaxRate,
  annualHomeInsurance: STATE_DEFAULTS.CA.annualHomeInsurance,
  annualRentersInsurance: STATE_DEFAULTS.CA.annualRentersInsurance,
  maintenanceRate: 1,
  monthlyHoa: 0,
  monthlyUtilitiesDelta: 0,
  monthlyRenterExtras: 0,
  monthlyRentalIncome: 0,
  rentalVacancyRate: 8,
  rentalIncomeGrowth: 3,
  rentalManagementRate: 0,
  rentalMaintenanceRate: 8,
  monthlyRentalOperatingCosts: 0,
  annualRentalInsurance: 0,
  rentalSetupCosts: 0,
  rentalIncomeTaxRate: 25,
  homeAppreciation: 3,
  rentGrowth: 3,
  investmentReturn: 7,
  propertyTaxGrowth: 3,
  insuranceGrowth: 5,
  costInflation: 3,
  buyingCosts: 2,
  sellingCosts: 6,
  mortgagePointsRate: 0,
  sellerCreditRate: 0,
  upfrontLoanFeeRate: 0,
  renovationCosts: 0,
  renterSecurityDepositMonths: 1,
  renterBrokerFeeRate: 0,
  renterMoveInCosts: 0,
  pmiRate: 0.7,
  annualIncome: 150_000,
  incomeGrowth: 3,
  annualOtherItemizedDeductions: 0,
  annualStateLocalTaxes: 10_000,
  saltDeductionCap: get2026SaltDeductionCap('marriedJoint', 150_000),
  saltDeductionCapAfter2029: 10_000,
  mortgageInterestDebtLimit: getMortgageInterestDebtLimit('marriedJoint'),
  annualStateTaxBenefit: 0,
  homeSaleTaxRate: 0,
  homeSaleGainExclusion: 500_000,
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(Number.isFinite(value) ? value : min, min), max)

const annualToMonthlyRate = (annualPercent: number) =>
  Math.pow(1 + annualPercent / 100, 1 / 12) - 1

const cleanZipCode = (value: string) => value.replace(/\D/g, '').slice(0, 5)

export const calculateMortgagePayment = (
  principal: number,
  annualRatePercent: number,
  termYears: number,
) => {
  if (principal <= 0) return 0
  const months = Math.max(1, Math.round(termYears * 12))
  const monthlyRate = annualRatePercent / 100 / 12
  if (monthlyRate === 0) return principal / months
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  )
}

export function sanitizeInputs(raw: CalculatorInputs): CalculatorInputs {
  const filingStatus = isFilingStatus(raw.filingStatus)
    ? raw.filingStatus
    : DEFAULT_INPUTS.filingStatus
  const loanType = isLoanType(raw.loanType) ? raw.loanType : DEFAULT_INPUTS.loanType

  return {
    state: isStateCode(raw.state) ? raw.state : DEFAULT_INPUTS.state,
    zipCode: cleanZipCode(String(raw.zipCode ?? '')),
    loanType,
    financeUpfrontLoanFee: raw.financeUpfrontLoanFee === true,
    useAutomaticSaltCap: raw.useAutomaticSaltCap !== false,
    filingStatus,
    homePrice: clamp(raw.homePrice, 10_000, 100_000_000),
    monthlyRent: clamp(raw.monthlyRent, 100, 500_000),
    downPaymentPercent:
      loanType === 'cash' ? 100 : clamp(raw.downPaymentPercent, 0, 100),
    mortgageRate: loanType === 'cash' ? 0 : clamp(raw.mortgageRate, 0, 25),
    monthlyExtraPrincipal: loanType === 'cash' ? 0 : clamp(raw.monthlyExtraPrincipal, 0, 1_000_000),
    loanTermYears: clamp(raw.loanTermYears, 1, 40),
    stayYears: clamp(raw.stayYears, 1, 40),
    propertyTaxRate: clamp(raw.propertyTaxRate, 0, 10),
    annualHomeInsurance: clamp(raw.annualHomeInsurance, 0, 1_000_000),
    annualRentersInsurance: clamp(raw.annualRentersInsurance, 0, 100_000),
    maintenanceRate: clamp(raw.maintenanceRate, 0, 10),
    monthlyHoa: clamp(raw.monthlyHoa, 0, 100_000),
    monthlyUtilitiesDelta: clamp(raw.monthlyUtilitiesDelta, -10_000, 100_000),
    monthlyRenterExtras: clamp(raw.monthlyRenterExtras, 0, 100_000),
    monthlyRentalIncome: clamp(raw.monthlyRentalIncome, 0, 500_000),
    rentalVacancyRate: clamp(raw.rentalVacancyRate, 0, 100),
    rentalIncomeGrowth: clamp(raw.rentalIncomeGrowth, -20, 30),
    rentalManagementRate: clamp(raw.rentalManagementRate, 0, 100),
    rentalMaintenanceRate: clamp(raw.rentalMaintenanceRate, 0, 100),
    monthlyRentalOperatingCosts: clamp(
      raw.monthlyRentalOperatingCosts,
      0,
      100_000,
    ),
    annualRentalInsurance: clamp(raw.annualRentalInsurance, 0, 1_000_000),
    rentalSetupCosts: clamp(raw.rentalSetupCosts, 0, 20_000_000),
    rentalIncomeTaxRate: clamp(raw.rentalIncomeTaxRate, 0, 60),
    homeAppreciation: clamp(raw.homeAppreciation, -20, 30),
    rentGrowth: clamp(raw.rentGrowth, -20, 30),
    investmentReturn: clamp(raw.investmentReturn, -20, 40),
    propertyTaxGrowth: clamp(raw.propertyTaxGrowth, -10, 30),
    insuranceGrowth: clamp(raw.insuranceGrowth, -10, 30),
    costInflation: clamp(raw.costInflation, -10, 30),
    buyingCosts: clamp(raw.buyingCosts, 0, 20),
    sellingCosts: clamp(raw.sellingCosts, 0, 20),
    mortgagePointsRate: clamp(raw.mortgagePointsRate, 0, 10),
    sellerCreditRate: clamp(raw.sellerCreditRate, 0, 10),
    upfrontLoanFeeRate:
      loanType === 'cash' ? 0 : clamp(raw.upfrontLoanFeeRate, 0, 10),
    renovationCosts: clamp(raw.renovationCosts, 0, 20_000_000),
    renterSecurityDepositMonths: clamp(raw.renterSecurityDepositMonths, 0, 12),
    renterBrokerFeeRate: clamp(raw.renterBrokerFeeRate, 0, 100),
    renterMoveInCosts: clamp(raw.renterMoveInCosts, 0, 1_000_000),
    pmiRate: loanType === 'va' || loanType === 'cash' ? 0 : clamp(raw.pmiRate, 0, 5),
    annualIncome: clamp(raw.annualIncome, 0, 100_000_000),
    incomeGrowth: clamp(raw.incomeGrowth, -20, 30),
    annualOtherItemizedDeductions: clamp(
      raw.annualOtherItemizedDeductions,
      0,
      10_000_000,
    ),
    annualStateLocalTaxes: clamp(raw.annualStateLocalTaxes, 0, 10_000_000),
    saltDeductionCap: raw.useAutomaticSaltCap !== false
      ? get2026SaltDeductionCap(filingStatus, clamp(raw.annualIncome, 0, 100_000_000))
      : clamp(raw.saltDeductionCap, 0, 1_000_000),
    saltDeductionCapAfter2029: clamp(
      raw.saltDeductionCapAfter2029,
      0,
      1_000_000,
    ),
    mortgageInterestDebtLimit: clamp(
      raw.mortgageInterestDebtLimit,
      0,
      10_000_000,
    ),
    annualStateTaxBenefit: clamp(raw.annualStateTaxBenefit, 0, 1_000_000),
    homeSaleTaxRate: clamp(raw.homeSaleTaxRate, 0, 60),
    homeSaleGainExclusion: clamp(raw.homeSaleGainExclusion, 0, 5_000_000),
  }
}

const hasMortgageInsurance = (
  input: CalculatorInputs,
  month: number,
  mortgageBalance: number,
  baseLoanAmount: number,
  loanAmount: number,
) => {
  if (mortgageBalance <= 0 || input.pmiRate <= 0) return false
  if (input.loanType === 'fha') {
    const originalLtv = (baseLoanAmount / input.homePrice) * 100
    return originalLtv > 90 || month <= 11 * 12
  }
  if (input.loanType !== 'conventional') return false
  return (
    loanAmount > input.homePrice * 0.8 &&
    mortgageBalance > input.homePrice * 0.78 &&
    month <= (input.loanTermYears * 12) / 2
  )
}

const buildTaxBenefitSchedule = (
  input: CalculatorInputs,
  totalMonths: number,
  loanAmount: number,
  baseLoanAmount: number,
  monthlyMortgage: number,
) => {
  const schedule: (HomeownerTaxBenefit & { averageBaseBalance: number })[] = []
  const mortgageRateMonthly = input.mortgageRate / 100 / 12
  const propertyTaxGrowthMonthly = annualToMonthlyRate(input.propertyTaxGrowth)
  let mortgageBalance = loanAmount
  let monthlyPropertyTax =
    (input.homePrice * input.propertyTaxRate) / 100 / 12
  const totalProjectionYears = Math.ceil(totalMonths / 12)

  for (let projectionYear = 0; projectionYear < totalProjectionYears; projectionYear += 1) {
    const monthsThisYear = Math.min(12, totalMonths - projectionYear * 12)
    let annualMortgageInterest = 0
    let annualPropertyTax = 0
    let balanceSum = 0

    // A partial final year uses the same annualized planning estimate as a full year.
    for (let month = 0; month < 12; month += 1) {
      const openingBalance = mortgageBalance
      const interest = mortgageBalance * mortgageRateMonthly
      const scheduledPrincipal = Math.max(0, monthlyMortgage - interest)
      const principal = Math.min(mortgageBalance, scheduledPrincipal + input.monthlyExtraPrincipal)
      mortgageBalance = Math.max(0, mortgageBalance - principal)
      balanceSum += (openingBalance + mortgageBalance) / 2
      annualMortgageInterest += interest
      annualPropertyTax += monthlyPropertyTax
      monthlyPropertyTax *= 1 + propertyTaxGrowthMonthly
    }

    const calendarYear = 2026 + projectionYear
    const taxInflationFactor = Math.pow(
      1 + input.costInflation / 100,
      projectionYear,
    )
    const incomeGrowthFactor = Math.pow(
      1 + input.incomeGrowth / 100,
      projectionYear,
    )
    const projectedSaltCap = input.useAutomaticSaltCap
      ? getSaltDeductionCap(input.filingStatus, input.annualIncome * incomeGrowthFactor, calendarYear)
      : calendarYear <= 2029
        ? input.saltDeductionCap * Math.pow(1.01, calendarYear - 2026)
        : input.saltDeductionCapAfter2029
    const acquisitionPortion = loanAmount > 0 ? baseLoanAmount / loanAmount : 0
    const averageBaseBalance = balanceSum / 12 * acquisitionPortion
    const annualBenefit = calculateAnnualHomeownerTaxBenefit({
      annualIncome: input.annualIncome * incomeGrowthFactor,
      filingStatus: input.filingStatus,
      annualOtherItemizedDeductions:
        input.annualOtherItemizedDeductions * taxInflationFactor,
      annualStateLocalTaxes:
        input.annualStateLocalTaxes * incomeGrowthFactor,
      annualPropertyTax,
      annualMortgageInterest: annualMortgageInterest * acquisitionPortion,
      averageMortgageDebt: averageBaseBalance,
      saltDeductionCap: projectedSaltCap,
      mortgageInterestDebtLimit: input.mortgageInterestDebtLimit,
      annualStateTaxBenefit:
        input.annualStateTaxBenefit * taxInflationFactor,
      taxInflationFactor,
    })

    for (let month = 0; month < monthsThisYear; month += 1) {
      schedule.push({ ...annualBenefit, averageBaseBalance })
    }
  }

  return schedule
}

export function calculateBuyOrRent(rawInputs: CalculatorInputs): CalculationResult {
  const input = sanitizeInputs(rawInputs)
  const totalMonths = Math.round(input.stayYears * 12)
  const downPayment = input.homePrice * (input.downPaymentPercent / 100)
  const baseLoanAmount = Math.max(0, input.homePrice - downPayment)
  const upfrontLoanFee = baseLoanAmount * (input.upfrontLoanFeeRate / 100)
  const financedLoanFee = input.financeUpfrontLoanFee ? upfrontLoanFee : 0
  const loanAmount = baseLoanAmount + financedLoanFee
  const buyingCost = input.homePrice * (input.buyingCosts / 100)
  const mortgagePoints = baseLoanAmount * (input.mortgagePointsRate / 100)
  const sellerCredits = input.homePrice * (input.sellerCreditRate / 100)
  const buyerClosingCash = Math.max(
    0,
    buyingCost +
      mortgagePoints +
      (input.financeUpfrontLoanFee ? 0 : upfrontLoanFee) -
      sellerCredits,
  )
  const buyerUpfrontCash =
    downPayment +
    buyerClosingCash +
    input.renovationCosts +
    input.rentalSetupCosts
  const renterSecurityDeposit =
    input.monthlyRent * input.renterSecurityDepositMonths
  const renterBrokerFee =
    input.monthlyRent * 12 * (input.renterBrokerFeeRate / 100)
  const renterUpfrontCash =
    renterSecurityDeposit + renterBrokerFee + input.renterMoveInCosts
  const monthlyMortgage = calculateMortgagePayment(
    loanAmount,
    input.mortgageRate,
    input.loanTermYears,
  )
  const taxBenefitSchedule = buildTaxBenefitSchedule(
    input,
    totalMonths,
    loanAmount,
    baseLoanAmount,
    monthlyMortgage,
  )
  const mortgageRateMonthly = input.mortgageRate / 100 / 12
  const homeGrowthMonthly = annualToMonthlyRate(input.homeAppreciation)
  const rentGrowthMonthly = annualToMonthlyRate(input.rentGrowth)
  const rentalIncomeGrowthMonthly = annualToMonthlyRate(
    input.rentalIncomeGrowth,
  )
  const investmentGrowthMonthly = annualToMonthlyRate(input.investmentReturn)
  const propertyTaxGrowthMonthly = annualToMonthlyRate(input.propertyTaxGrowth)
  const insuranceGrowthMonthly = annualToMonthlyRate(input.insuranceGrowth)
  const costInflationMonthly = annualToMonthlyRate(input.costInflation)

  let homeValue = input.homePrice
  let mortgageBalance = loanAmount
  let monthlyRent = input.monthlyRent
  let monthlyPropertyTax = (input.homePrice * input.propertyTaxRate) / 100 / 12
  let monthlyHomeInsurance = input.annualHomeInsurance / 12
  let monthlyRentersInsurance = input.annualRentersInsurance / 12
  let monthlyMaintenance = (input.homePrice * input.maintenanceRate) / 100 / 12
  let monthlyHoa = input.monthlyHoa
  let monthlyUtilitiesDelta = input.monthlyUtilitiesDelta
  let monthlyRenterExtras = input.monthlyRenterExtras
  let monthlyGrossRentalIncome = input.monthlyRentalIncome
  let monthlyRentalOperatingCosts = input.monthlyRentalOperatingCosts
  let monthlyRentalInsurance = input.annualRentalInsurance / 12
  const startingCash = Math.max(buyerUpfrontCash, renterUpfrontCash)
  let renterPortfolio = startingCash - renterUpfrontCash
  let buyerPortfolio = startingCash - buyerUpfrontCash
  let totalInterest = 0
  let totalTaxBenefit = 0
  let firstMonthOwnerCost = 0
  let firstMonthOwnerCostBeforeTax = 0
  let firstMonthTaxBenefit = 0
  let firstMonthGrossRentalIncome = 0
  let firstMonthNetRentalIncome = 0
  let firstMonthRentalIncomeTax = 0
  let totalNetRentalIncome = 0
  let firstYearFederalTaxBenefit = 0
  let firstYearStateTaxBenefit = 0
  let ownerItemizesFirstYear = false
  let breakEvenMonth: number | null = null
  const timeline: TimelinePoint[] = []
  const firstMonthBreakdown: CalculationResult["firstMonthBreakdown"] = { owner: [], renter: [] }

  for (let month = 1; month <= totalMonths; month += 1) {
    renterPortfolio *= 1 + investmentGrowthMonthly
    buyerPortfolio *= 1 + investmentGrowthMonthly

    const interest = mortgageBalance * mortgageRateMonthly
    const scheduledPrincipal = Math.max(0, monthlyMortgage - interest)
    const principal = Math.min(mortgageBalance, scheduledPrincipal + input.monthlyExtraPrincipal)
    const actualMortgagePayment = interest + principal
    mortgageBalance = Math.max(0, mortgageBalance - principal)
    totalInterest += interest

    const hasPmi = hasMortgageInsurance(
      input,
      month,
      mortgageBalance,
      baseLoanAmount,
      loanAmount,
    )
    const annualizedTaxBenefit = taxBenefitSchedule[month - 1]
    const insuranceBalance = input.loanType === 'fha'
      ? annualizedTaxBenefit.averageBaseBalance
      : loanAmount
    const pmi = hasPmi ? (insuranceBalance * input.pmiRate) / 100 / 12 : 0
    const monthlyTaxBenefit = annualizedTaxBenefit.annualTotalBenefit / 12
    const grossRentalIncomeThisMonth = monthlyGrossRentalIncome
    const monthlyCollectedRentalIncome =
      grossRentalIncomeThisMonth * (1 - input.rentalVacancyRate / 100)
    const monthlyVariableRentalCosts =
      monthlyCollectedRentalIncome *
      ((input.rentalManagementRate + input.rentalMaintenanceRate) / 100)
    const monthlyRentalProfitBeforeTax =
      monthlyCollectedRentalIncome -
      monthlyVariableRentalCosts -
      monthlyRentalOperatingCosts -
      monthlyRentalInsurance
    const monthlyRentalIncomeTax =
      Math.max(0, monthlyRentalProfitBeforeTax) *
      (input.rentalIncomeTaxRate / 100)
    const monthlyNetRentalIncome =
      monthlyRentalProfitBeforeTax - monthlyRentalIncomeTax
    const monthlyOwnerCostBeforeTax =
      actualMortgagePayment +
      monthlyPropertyTax +
      monthlyHomeInsurance +
      monthlyMaintenance +
      monthlyHoa +
      monthlyUtilitiesDelta +
      pmi -
      monthlyRentalProfitBeforeTax
    const monthlyOwnerCost =
      monthlyOwnerCostBeforeTax +
      monthlyRentalIncomeTax -
      monthlyTaxBenefit
    const monthlyRenterCost =
      monthlyRent + monthlyRentersInsurance + monthlyRenterExtras

    totalTaxBenefit += monthlyTaxBenefit
    totalNetRentalIncome += monthlyNetRentalIncome
    if (month === 1) {
      firstMonthBreakdown.owner = [
        { label: 'Mortgage interest', amount: interest },
        { label: 'Mortgage principal (including extra)', amount: principal },
        { label: 'Property tax', amount: monthlyPropertyTax },
        { label: 'Home insurance', amount: monthlyHomeInsurance },
        { label: 'Maintenance reserve', amount: monthlyMaintenance },
        { label: 'HOA', amount: monthlyHoa },
        { label: 'Utility difference', amount: monthlyUtilitiesDelta },
        { label: 'Mortgage insurance', amount: pmi },
        { label: 'Net room / ADU income after tax', amount: -monthlyNetRentalIncome },
        { label: 'Homeowner tax benefit', amount: -monthlyTaxBenefit },
      ]
      firstMonthBreakdown.renter = [
        { label: 'Rent', amount: monthlyRent },
        { label: 'Renters insurance', amount: monthlyRentersInsurance },
        { label: 'Renter extras', amount: monthlyRenterExtras },
      ]
      firstMonthOwnerCost = monthlyOwnerCost
      firstMonthOwnerCostBeforeTax = monthlyOwnerCostBeforeTax
      firstMonthTaxBenefit = monthlyTaxBenefit
      firstMonthGrossRentalIncome = grossRentalIncomeThisMonth
      firstMonthNetRentalIncome = monthlyNetRentalIncome
      firstMonthRentalIncomeTax = monthlyRentalIncomeTax
      firstYearFederalTaxBenefit = annualizedTaxBenefit.annualFederalBenefit
      firstYearStateTaxBenefit = annualizedTaxBenefit.annualStateBenefit
      ownerItemizesFirstYear = annualizedTaxBenefit.ownerItemizes
    }

    const difference = monthlyOwnerCost - monthlyRenterCost
    if (difference > 0) renterPortfolio += difference
    else buyerPortfolio += Math.abs(difference)

    homeValue *= 1 + homeGrowthMonthly
    monthlyRent *= 1 + rentGrowthMonthly
    monthlyGrossRentalIncome *= 1 + rentalIncomeGrowthMonthly
    monthlyPropertyTax *= 1 + propertyTaxGrowthMonthly
    monthlyHomeInsurance *= 1 + insuranceGrowthMonthly
    monthlyRentersInsurance *= 1 + insuranceGrowthMonthly
    monthlyMaintenance *= 1 + costInflationMonthly
    monthlyHoa *= 1 + costInflationMonthly
    monthlyUtilitiesDelta *= 1 + costInflationMonthly
    monthlyRenterExtras *= 1 + costInflationMonthly
    monthlyRentalOperatingCosts *= 1 + costInflationMonthly
    monthlyRentalInsurance *= 1 + insuranceGrowthMonthly

    const sellingCost = homeValue * (input.sellingCosts / 100)
    const adjustedBasis = input.homePrice + input.renovationCosts
    const grossTaxableGain = Math.max(
      0,
      homeValue - adjustedBasis - sellingCost,
    )
    const eligibleExclusion = month >= 24 ? input.homeSaleGainExclusion : 0
    const taxableGain = Math.max(0, grossTaxableGain - eligibleExclusion)
    const homeSaleTax = taxableGain * (input.homeSaleTaxRate / 100)
    const homeEquity = homeValue - mortgageBalance - sellingCost - homeSaleTax
    const buyWealth = homeEquity + buyerPortfolio
    const rentWealth = renterPortfolio + renterSecurityDeposit

    timeline.push({
      month,
      year: month / 12,
      buyWealth,
      rentWealth,
      homeValue,
      mortgageBalance,
      monthlyOwnerCost,
      monthlyOwnerCostBeforeTax,
      monthlyRent: monthlyRenterCost,
      monthlyPmi: pmi,
      monthlyTaxBenefit,
      monthlyGrossRentalIncome: grossRentalIncomeThisMonth,
      monthlyNetRentalIncome,
      monthlyRentalIncomeTax,
      homeSaleTax,
    })
  }

  const final = timeline.at(-1)
  if (!final) throw new Error('A calculation requires a time horizon of at least one month.')
  if (final.buyWealth >= final.rentWealth) {
    const durableBreakEven = timeline.findIndex(
      (point, index) =>
        point.buyWealth >= point.rentWealth &&
        timeline.slice(index).every((future) => future.buyWealth >= future.rentWealth),
    )
    breakEvenMonth = durableBreakEven >= 0 ? durableBreakEven + 1 : null
  }
  const finalHomeEquity =
    final.homeValue -
    final.mortgageBalance -
    final.homeValue * (input.sellingCosts / 100) -
    final.homeSaleTax
  const advantage = final.buyWealth - final.rentWealth

  return {
    winner: advantage >= 0 ? 'buy' : 'rent',
    advantage: Math.abs(advantage),
    buyWealth: final.buyWealth,
    rentWealth: final.rentWealth,
    breakEvenMonth,
    monthlyMortgage,
    mortgagePayoffMonth: loanAmount > 0 ? timeline.find((point) => point.mortgageBalance < 0.005)?.month ?? null : null,
    firstMonthBreakdown,
    firstMonthOwnerCost,
    firstMonthOwnerCostBeforeTax,
    firstMonthRent:
      input.monthlyRent +
      input.annualRentersInsurance / 12 +
      input.monthlyRenterExtras,
    firstMonthTaxBenefit,
    firstMonthGrossRentalIncome,
    firstMonthNetRentalIncome,
    firstMonthRentalIncomeTax,
    totalNetRentalIncome,
    totalTaxBenefit,
    firstYearFederalTaxBenefit,
    firstYearStateTaxBenefit,
    ownerItemizesFirstYear,
    totalInterest,
    finalHomeValue: final.homeValue,
    finalMortgageBalance: final.mortgageBalance,
    finalHomeEquity,
    homeSaleTax: final.homeSaleTax,
    downPayment,
    baseLoanAmount,
    loanAmount,
    upfrontLoanFee,
    buyerUpfrontCash,
    renterUpfrontCash,
    timeline,
  }
}

export const getAnnualTimeline = (timeline: TimelinePoint[]) =>
  timeline.filter((point, index) => point.month % 12 === 0 || index === timeline.length - 1)
    .map((point) => {
      const start = Math.floor((point.month - 1) / 12) * 12
      const months = timeline.slice(start, point.month)
      return {
        ...point,
        annualNetRentalIncome: months.reduce((sum, month) => sum + month.monthlyNetRentalIncome, 0),
        annualTaxBenefit: months.reduce((sum, month) => sum + month.monthlyTaxBenefit, 0),
      }
    })
