import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, sanitizeInputs } from './calculator'
import { inputsFromSearchParams, inputsToSearchParams, normalizeScenario, scenarioFromLocation, scenarioUrl } from './share'

describe('untrusted saved scenarios', () => {
  it.each([null, undefined, [], 'bad', 42, { homePrice: '500', filingStatus: ['single'], zipCode: 12345 }, { homePrice: Infinity }])('recovers safely from %j', (value) => {
    expect(normalizeScenario(value)).toEqual(DEFAULT_INPUTS)
  })
  it('discards inherited properties and unknown keys', () => {
    const obj = Object.create({ homePrice: 999_999 })
    obj.unexpected = 'ignore'
    expect(normalizeScenario(obj)).toEqual(DEFAULT_INPUTS)
  })
  it('preserves custom SALT caps in older saved scenarios', () => {
    const { useAutomaticSaltCap: _flag, ...old } = DEFAULT_INPUTS
    void _flag
    expect(normalizeScenario({ ...old, saltDeductionCap: 15_000 }).useAutomaticSaltCap).toBe(false)
    expect(normalizeScenario({ ...old, saltDeductionCap: 15_000 }).saltDeductionCap).toBe(15_000)
  })
  it('discards unexpected boolean encodings and invalid numbers in URLs', () => {
    const parsed = inputsFromSearchParams(new URLSearchParams({ financeUpfrontLoanFee: 'no', useAutomaticSaltCap: '0', homePrice: 'Infinity' }))
    expect(parsed).toEqual(DEFAULT_INPUTS)
  })
  it('records every input and schema version to insulate links from changed defaults', () => {
    const params = inputsToSearchParams(DEFAULT_INPUTS)
    expect(params.get('version')).toBe('2')
    expect(params.size).toBe(Object.keys(DEFAULT_INPUTS).length + 1)
    expect(inputsFromSearchParams(params)).toEqual(DEFAULT_INPUTS)
  })
  it('shares financial values only in the URL fragment and strips old queries', () => {
    const input = { ...DEFAULT_INPUTS, annualIncome: 200_000, zipCode: '01234', monthlyRent: 4_000 }
    const url = new URL(scenarioUrl('https://example.com/?old=private#junk', input))
    expect(url.search).toBe('')
    expect(url.hash).toContain('#scenario=')
    expect(scenarioFromLocation(url.search, url.hash)).toEqual(sanitizeInputs(input))
  })
  it('retains legacy links while ignoring unrelated tracking parameters', () => {
    expect(scenarioFromLocation('?utm_source=newsletter', '')).toBeNull()
    expect(scenarioFromLocation('?homePrice=123456', '')?.homePrice).toBe(123456)
    expect(scenarioFromLocation('', '#calculator')).toBeNull()
  })
  it('gives a new fragment scenario priority over legacy query inputs', () => {
    expect(scenarioFromLocation('?homePrice=10000', '#scenario=homePrice=123456')?.homePrice).toBe(123456)
  })
})
