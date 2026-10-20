import { CalculatorInputs, CalculationResult, DEFAULT_INPUTS, getAnnualTimeline, sanitizeInputs } from './calculator'
import { STATE_DEFAULTS } from '@/data/states'

export type PropertyPreset = 'house' | 'condo'

/** Illustrative inputs, not quotes or a property-specific prediction. */
export function applyPropertyPreset(input: CalculatorInputs, preset: PropertyPreset): CalculatorInputs {
  return sanitizeInputs({ ...input,
    monthlyHoa: preset === 'condo' ? 400 : 0,
    maintenanceRate: preset === 'condo' ? 0.5 : DEFAULT_INPUTS.maintenanceRate,
    annualHomeInsurance: preset === 'condo' ? 600 : STATE_DEFAULTS[input.state].annualHomeInsurance,
  })
}

export function annualCsv(result: CalculationResult): string {
  const rows = [['Month', 'Years', 'Buy wealth', 'Rent wealth', 'Buy minus rent', 'Mortgage balance', 'Net rental income in period', 'Tax benefit in period'],
    ...getAnnualTimeline(result.timeline).map(p => [p.month, p.year, p.buyWealth, p.rentWealth,
      p.buyWealth - p.rentWealth, p.mortgageBalance, p.annualNetRentalIncome, p.annualTaxBenefit]
      .map(value => Number.isInteger(value) ? String(value) : value.toFixed(2)))]
  return rows.map(row => row.join(',')).join('\r\n') + '\r\n'
}

export function inputLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase())
}
