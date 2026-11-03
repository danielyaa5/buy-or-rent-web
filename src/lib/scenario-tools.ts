import { CalculatorInputs, CalculationResult, DEFAULT_INPUTS, getAnnualTimeline, sanitizeInputs } from './calculator'
import { STATE_DEFAULTS } from '@/data/states'
import { formatCurrency, formatPercent } from './format'

export type PropertyPreset = 'house' | 'condo'

/** Illustrative inputs, not quotes or a property-specific prediction. */
export function applyPropertyPreset(input: CalculatorInputs, preset: PropertyPreset): CalculatorInputs {
  return sanitizeInputs({ ...input,
    monthlyHoa: preset === 'condo' ? 400 : 0,
    maintenanceRate: preset === 'condo' ? 0.5 : DEFAULT_INPUTS.maintenanceRate,
    annualHomeInsurance: preset === 'condo' ? 600 : STATE_DEFAULTS[input.state].annualHomeInsurance,
  })
}

const PRESET_KEYS = ['monthlyHoa', 'maintenanceRate', 'annualHomeInsurance'] as const

/** The preset whose three values the inputs currently match, so editing any of them clears it. */
export function activePropertyPreset(input: CalculatorInputs): PropertyPreset | null {
  return (['house', 'condo'] as const).find(preset => {
    const values = applyPropertyPreset(input, preset)
    return PRESET_KEYS.every(key => values[key] === input[key])
  }) ?? null
}

export function propertyPresetSummary(input: CalculatorInputs): string {
  return `${formatCurrency(input.monthlyHoa)}/month HOA, ${formatPercent(input.maintenanceRate)} yearly maintenance, and ${formatCurrency(input.annualHomeInsurance)}/year home insurance`
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
