import { CalculatorInputs, DEFAULT_INPUTS, sanitizeInputs } from './calculator'

/** Accept only known, correctly typed own properties from untrusted saved data. */
export function normalizeScenario(raw: unknown): CalculatorInputs {
  const parsed = { ...DEFAULT_INPUTS }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const key of Object.keys(DEFAULT_INPUTS) as (keyof CalculatorInputs)[]) {
      if (!Object.hasOwn(raw, key)) continue
      const value = (raw as Record<string, unknown>)[key]
      if (typeof value !== typeof DEFAULT_INPUTS[key]) continue
      if (typeof value === 'number' && !Number.isFinite(value)) continue
      Object.assign(parsed, { [key]: value })
    }
    // Preserve a deliberately customized cap in pre-v2 scenarios.
    if (!Object.hasOwn(raw, 'useAutomaticSaltCap') && Object.hasOwn(raw, 'saltDeductionCap')) {
      parsed.useAutomaticSaltCap = false
    }
  }
  return sanitizeInputs(parsed)
}

export function inputsFromSearchParams(searchParams: URLSearchParams): CalculatorInputs {
  const parsed: Record<string, unknown> = {}
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof CalculatorInputs)[]) {
    const value = searchParams.get(key)
    if (value === null || value.trim() === '') continue
    switch (typeof DEFAULT_INPUTS[key]) {
      case 'number': parsed[key] = Number(value); break
      case 'boolean':
        if (value === 'true' || value === 'false') parsed[key] = value === 'true'
        break
      default: parsed[key] = value
    }
  }
  return normalizeScenario(parsed)
}

export function inputsToSearchParams(inputs: CalculatorInputs) {
  const params = new URLSearchParams({ version: '2' })
  const normalized = normalizeScenario(inputs)
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof CalculatorInputs)[]) {
    params.set(key, String(normalized[key]))
  }
  return params
}

export function scenarioFromLocation(search: string, hash: string): CalculatorInputs | null {
  const params = new URLSearchParams(hash.startsWith('#scenario=') ? hash.slice(10) : search)
  if (![...params.keys()].some((key) => Object.hasOwn(DEFAULT_INPUTS, key))) return null
  return inputsFromSearchParams(params)
}

export function scenarioUrl(baseUrl: string, inputs: CalculatorInputs): string {
  const url = new URL(baseUrl)
  url.search = ''
  url.hash = `scenario=${inputsToSearchParams(inputs)}`
  return url.toString()
}
