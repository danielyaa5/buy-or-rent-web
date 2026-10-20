'use client'

import {
  ArrowDown,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Home,
  Landmark,
  ReceiptText,
  RefreshCcw,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  StateCode,
  STATE_CODES,
  STATE_DEFAULTS,
} from '@/data/states'
import {
  CalculatorInputs,
  calculateBuyOrRent,
  DEFAULT_INPUTS,
  sanitizeInputs,
  getAnnualTimeline,
  LoanType,
  LOAN_TYPE_DEFAULTS,
  LOAN_TYPE_LABELS,
} from '@/lib/calculator'
import {
  formatBreakEven,
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from '@/lib/format'
import { normalizeScenario, scenarioFromLocation, scenarioUrl } from '@/lib/share'
import {
  FilingStatus,
  FILING_STATUS_LABELS,
  get2026SaltDeductionCap,
  getMortgageInterestDebtLimit,
  STANDARD_DEDUCTION_2026,
} from '@/lib/tax'

import { NumberField } from './NumberField'
import { WealthChart } from './WealthChart'
import { CostBreakdown, ExportActions, ScenarioComparison } from './ScenarioResults'
import { applyPropertyPreset, inputLabel } from '@/lib/scenario-tools'

const STORAGE_KEY = 'buy-or-rent-scenario-v5'
const PINNED_KEY = 'buy-or-rent-pinned-v1'

const OUTLOOKS = {
  cautious: {
    label: 'Cautious',
    homeAppreciation: 1.5,
    rentGrowth: 2,
    investmentReturn: 5,
  },
  balanced: {
    label: 'Balanced',
    homeAppreciation: 3,
    rentGrowth: 3,
    investmentReturn: 7,
  },
  growth: {
    label: 'Growth',
    homeAppreciation: 4.5,
    rentGrowth: 3.5,
    investmentReturn: 9,
  },
} as const

type OutlookKey = keyof typeof OUTLOOKS
type NumericInputKey = Exclude<
  keyof CalculatorInputs,
  | 'state'
  | 'zipCode'
  | 'loanType'
  | 'financeUpfrontLoanFee'
  | 'useAutomaticSaltCap'
  | 'filingStatus'
>

const getActiveOutlook = (inputs: CalculatorInputs): OutlookKey | null => {
  const entry = Object.entries(OUTLOOKS).find(
    ([, outlook]) =>
      outlook.homeAppreciation === inputs.homeAppreciation &&
      outlook.rentGrowth === inputs.rentGrowth &&
      outlook.investmentReturn === inputs.investmentReturn,
  )
  return (entry?.[0] as OutlookKey | undefined) ?? null
}

export function BuyOrRentCalculator() {
  const [inputs, setRawInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS)
  const [pinned, setPinned] = useState<CalculatorInputs | null>(null)
  const [pinNotice, setPinNotice] = useState('')
  const [presetNotice, setPresetNotice] = useState('')
  const [viewingShared, setViewingShared] = useState(false)
  const [savedInputs, setSavedInputs] = useState<CalculatorInputs | null>(null)
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [shareLink, setShareLink] = useState('')
  const shareDialog = useRef<HTMLDialogElement>(null)
  const setInputs = useCallback((next: CalculatorInputs | ((current: CalculatorInputs) => CalculatorInputs)) => {
    setViewingShared(false)
    if (scenarioFromLocation(window.location.search, window.location.hash)) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    setShareStatus('')
    setRawInputs((current) => sanitizeInputs(typeof next === 'function' ? next(current) : next))
  }, [])
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const result = useMemo(() => calculateBuyOrRent(inputs), [inputs])
  const annualTimeline = useMemo(() => getAnnualTimeline(result.timeline), [result])
  const activeOutlook = getActiveOutlook(inputs)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let saved: CalculatorInputs | null = null
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try { saved = normalizeScenario(JSON.parse(stored)) }
          catch { window.localStorage.removeItem(STORAGE_KEY) }
        }
      } catch { setStorageUnavailable(true) }
      try {
        const storedPin = window.localStorage.getItem(PINNED_KEY)
        if (storedPin) setPinned(normalizeScenario(JSON.parse(storedPin)))
      } catch { /* Pinning remains available in memory. */ }
      setSavedInputs(saved)
      const shared = scenarioFromLocation(window.location.search, window.location.hash)
      setRawInputs(shared ?? saved ?? DEFAULT_INPUTS)
      setViewingShared(shared !== null)
      setInitialized(true)
    })
    const loadSharedFragment = () => {
      const shared = scenarioFromLocation(window.location.search, window.location.hash)
      if (!shared) return
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        setSavedInputs(stored ? normalizeScenario(JSON.parse(stored)) : null)
      } catch { /* The previously loaded saved scenario remains available. */ }
      setRawInputs(shared)
      setViewingShared(true)
    }
    window.addEventListener('hashchange', loadSharedFragment)
    window.addEventListener('popstate', loadSharedFragment)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', loadSharedFragment)
      window.removeEventListener('popstate', loadSharedFragment)
    }
  }, [])

  useEffect(() => {
    if (!initialized || viewingShared) return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)) }
    catch {
      const frame = window.requestAnimationFrame(() => setStorageUnavailable(true))
      return () => window.cancelAnimationFrame(frame)
    }
  }, [initialized, inputs, viewingShared])

  const updateInput = (key: NumericInputKey, value: number) => {
    setInputs((current) => ({
      ...current,
      [key]: Number.isFinite(value) ? value : 0,
    }))
  }

  const updateState = (state: StateCode) => {
    const defaults = STATE_DEFAULTS[state]
    setInputs((current) => ({
      ...current,
      state,
      propertyTaxRate: defaults.propertyTaxRate,
      annualHomeInsurance: defaults.annualHomeInsurance,
      annualRentersInsurance: defaults.annualRentersInsurance,
    }))
  }

  const updateLoanType = (loanType: LoanType) => {
    const defaults = LOAN_TYPE_DEFAULTS[loanType]
    setInputs((current) => ({
      ...current,
      loanType,
      downPaymentPercent: loanType === 'cash' ? 100 : current.loanType === 'cash'
        ? (loanType === 'fha' ? 3.5 : loanType === 'va' ? 0 : 20) : current.downPaymentPercent,
      mortgageRate: loanType === 'cash' ? 0 : current.loanType === 'cash' ? DEFAULT_INPUTS.mortgageRate : current.mortgageRate,
      upfrontLoanFeeRate: defaults.upfrontLoanFeeRate,
      pmiRate: defaults.pmiRate,
    }))
  }

  const updateFilingStatus = (filingStatus: FilingStatus) => {
    setInputs((current) => ({
      ...current,
      filingStatus,
      saltDeductionCap: get2026SaltDeductionCap(
        filingStatus,
        current.annualIncome,
      ),
      mortgageInterestDebtLimit: getMortgageInterestDebtLimit(filingStatus),
      saltDeductionCapAfter2029:
        filingStatus === 'marriedSeparate' ? 5_000 : 10_000,
      homeSaleGainExclusion:
        filingStatus === 'marriedJoint' ? 500_000 : 250_000,
    }))
  }

  const applyOutlook = (key: OutlookKey) => {
    const outlook = OUTLOOKS[key]
    setInputs((current) => ({
      ...current,
      homeAppreciation: outlook.homeAppreciation,
      rentGrowth: outlook.rentGrowth,
      investmentReturn: outlook.investmentReturn,
    }))
  }

  const pinCurrent = () => {
    setPinned({ ...inputs })
    try {
      window.localStorage.setItem(PINNED_KEY, JSON.stringify(inputs))
      setPinNotice('Scenario A pinned and saved on this browser.')
    } catch { setPinNotice('Scenario A pinned for this visit. Browser storage is unavailable.') }
  }

  const removePinned = () => {
    setPinned(null)
    setPinNotice('Pinned scenario removed.')
    try { window.localStorage.removeItem(PINNED_KEY) }
    catch { setPinNotice('Removed for this visit. Browser storage could not be cleared.') }
  }

  const reset = () => {
    setInputs(DEFAULT_INPUTS)
    removePinned()
    setPresetNotice('')
    setAdvancedOpen(false)
    setShareStatus('')
    shareDialog.current?.close()
    window.history.replaceState({}, '', window.location.pathname)
  }

  const share = () => {
    setShareLink(scenarioUrl(window.location.href, inputs))
    setShareStatus('')
    shareDialog.current?.showModal()
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setShareStatus('Link copied')
    } catch {
      setShareStatus('Copying is unavailable. Select the link below and copy it manually.')
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'Buy or Rent scenario', url: shareLink })
      setShareStatus('Scenario shared')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setShareStatus('Sharing is unavailable. You can copy the link instead.')
    }
  }

  const restoreSaved = () => {
    setInputs(savedInputs ?? DEFAULT_INPUTS)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const winnerLabel = result.winner === 'buy' ? 'Buying' : 'Renting'
  const winnerIcon =
    result.winner === 'buy' ? <Home size={17} /> : <Building2 size={17} />
  const firstYearGap = result.firstMonthOwnerCost - result.firstMonthRent
  const priceToRentRatio = inputs.homePrice / (inputs.monthlyRent * 12)
  const priceToRentLabel =
    priceToRentRatio <= 15
      ? 'Leans toward buying'
      : priceToRentRatio >= 21
        ? 'Leans toward renting'
        : 'A mixed signal'

  return (
    <main data-ready={initialized}>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Buy or Rent home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>BUY / RENT</span>
        </a>
        <div className="header-meta">
          <span className="privacy-note">
            <Check size={13} /> Calculated on your device
          </span>
          <button className="share-button" type="button" onClick={share} aria-label="Share scenario">
            <Share2 size={16} /> Share scenario
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={14} />
          A home decision, made clearer
        </div>
        <h1>
          Should you buy
          <br />
          <em>or keep renting?</em>
        </h1>
        <p>
          See the long-term wealth impact—not just the monthly payment. Change any
          assumption and the answer updates instantly.
        </p>
        <a className="hero-jump" href="#calculator">
          Run your numbers <ArrowDown size={16} />
        </a>
      </section>

      {viewingShared ? (
        <div className="scenario-notice" role="status">
          You are viewing a shared scenario. Your saved scenario is preserved until you edit these inputs.
          <button type="button" onClick={restoreSaved}>Return to my saved scenario</button>
        </div>
      ) : null}
      <section className="calculator-layout" id="calculator">
        <aside className="inputs-panel">
          <div className="panel-heading">
            <div>
              <span className="step-label">Your scenario</span>
              <h2>Start with the essentials</h2>
            </div>
            <button className="icon-button" type="button" onClick={reset} title="Reset">
              <RefreshCcw size={17} />
              <span>Reset</span>
            </button>
          </div>

          <div className="location-block">
            <div className="field-grid location-grid">
              <label className="field" htmlFor="state">
                <span className="field-label">State</span>
                <span className="input-shell select-shell">
                  <select
                    id="state"
                    value={inputs.state}
                    onChange={(event) => updateState(event.target.value as StateCode)}
                  >
                    {STATE_CODES.map((code) => (
                      <option value={code} key={code}>
                        {STATE_DEFAULTS[code].name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </span>
              </label>
              <label className="field" htmlFor="zip-code">
                <span className="field-label">ZIP code</span>
                <span className="input-shell">
                  <input
                    id="zip-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    placeholder="Optional"
                    value={inputs.zipCode}
                    onChange={(event) =>
                      setInputs((current) => ({
                        ...current,
                        zipCode: event.target.value.replace(/\D/g, '').slice(0, 5),
                      }))
                    }
                  />
                </span>
              </label>
            </div>
            <small className="state-note">
              State estimates load automatically. ZIP is saved with the scenario so
              you can replace them with county tax and local insurance quotes.
            </small>
          </div>

          <details className="property-presets">
            <summary>Try a property preset</summary>
            <p>These replace HOA, maintenance, and home insurance only. Condo uses illustrative $400/month HOA, 0.5% maintenance, and $600/year insurance. Replace them with your building’s fees and an HO-6 quote; special assessments are not included.</p>
            <div className="preset-actions">
              <button type="button" onClick={() => { setInputs(current => applyPropertyPreset(current, 'house')); setPresetNotice('House preset applied. HOA, maintenance, and home insurance updated.') }}>Apply house preset</button>
              <button type="button" onClick={() => { setInputs(current => applyPropertyPreset(current, 'condo')); setPresetNotice('Condo starter values applied. Confirm HOA, coverage, and maintenance for your building.') }}>Apply condo preset</button>
            </div>
            <p role="status">{presetNotice}</p>
          </details>
          <div className="field-grid">
            <NumberField
              label="Home price"
              value={inputs.homePrice}
              onChange={(value) => updateInput('homePrice', value)}
              prefix="$"
              min={10_000}
              step={10_000}
            />
            <NumberField
              label="Monthly rent"
              value={inputs.monthlyRent}
              onChange={(value) => updateInput('monthlyRent', value)}
              prefix="$"
              min={100}
              step={100}
            />
            <label className="field" htmlFor="loan-type">
              <span className="field-label">Purchase financing</span>
              <span className="input-shell select-shell">
                <select
                  id="loan-type"
                  value={inputs.loanType}
                  onChange={(event) =>
                    updateLoanType(event.target.value as LoanType)
                  }
                >
                  {(Object.keys(LOAN_TYPE_LABELS) as LoanType[]).map((loanType) => (
                    <option value={loanType} key={loanType}>
                      {LOAN_TYPE_LABELS[loanType]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </span>
            </label>
            <NumberField
              label="Down payment"
              disabled={inputs.loanType === 'cash'}
              value={inputs.downPaymentPercent}
              onChange={(value) => updateInput('downPaymentPercent', value)}
              suffix="%"
              min={0}
              max={100}
              step={1}
              helper={`${formatCurrency(result.downPayment)} upfront`}
            />
            <NumberField
              label="Mortgage rate"
              disabled={inputs.loanType === 'cash'}
              value={inputs.mortgageRate}
              onChange={(value) => updateInput('mortgageRate', value)}
              suffix="%"
              min={0}
              max={25}
              step={0.125}
            />
          </div>

          <label className="range-field" htmlFor="stay-years">
            <span>
              <span className="field-label">How long might you stay?</span>
              <strong>{inputs.stayYears} years</strong>
            </span>
            <input
              id="stay-years"
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={inputs.stayYears}
              onChange={(event) => updateInput('stayYears', event.target.valueAsNumber)}
            />
            <span className="range-labels">
              <span>1 year</span>
              <span>40 years</span>
            </span>
          </label>

          <button
            className="advanced-trigger"
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            <span>
              <Landmark size={18} />
              Fine-tune assumptions
            </span>
            <ChevronDown className={advancedOpen ? 'rotated' : ''} size={18} />
          </button>

          {advancedOpen ? (
            <div className="advanced-content">
              <details className="input-section">
                <summary className="input-section-heading">
                  <span>Market outlook</span>
                  <small>Test the assumptions most likely to change the answer.</small>
                </summary>
                <div className="outlook-block">
                  <div className="segmented-control" role="group" aria-label="Market outlook">
                    {(Object.keys(OUTLOOKS) as OutlookKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={activeOutlook === key ? 'active' : ''}
                        aria-pressed={activeOutlook === key}
                          onClick={() => applyOutlook(key)}
                      >
                        {OUTLOOKS[key].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field-grid advanced-grid">
                  <NumberField
                    label="Home appreciation"
                    value={inputs.homeAppreciation}
                    onChange={(value) => updateInput('homeAppreciation', value)}
                    suffix="% / yr"
                    step={0.1}
                    helper="Expected yearly change in the home's market value."
                  />
                  <NumberField
                    label="Investment return"
                    value={inputs.investmentReturn}
                    onChange={(value) => updateInput('investmentReturn', value)}
                    suffix="% / yr"
                    step={0.1}
                    helper="Expected return after taxes and investment fees."
                  />
                  <NumberField
                    label="Rent increase"
                    value={inputs.rentGrowth}
                    onChange={(value) => updateInput('rentGrowth', value)}
                    suffix="% / yr"
                    step={0.1}
                  />
                </div>
              </details>

              <details className="input-section">
                <summary className="input-section-heading">
                  <span>Financing & move-in</span>
                  <small>Loan-program fees, credits, points, and immediate work.</small>
                </summary>
                <div className="field-grid advanced-grid">
                  <NumberField
                    label="Loan term"
                    value={inputs.loanTermYears}
                    onChange={(value) => updateInput('loanTermYears', value)}
                    suffix="years"
                    min={1}
                    max={40}
                  />
                  <NumberField
                    label="Extra mortgage principal"
                    value={inputs.monthlyExtraPrincipal}
                    onChange={(value) => updateInput('monthlyExtraPrincipal', value)}
                    disabled={inputs.loanType === 'cash'}
                    prefix="$" suffix="/ mo" min={0} step={100}
                    helper="Paid with every mortgage payment until payoff, including the first. Check prepayment terms. PMI cancellation with accelerated payments may require a lender request."
                  />
                  <NumberField
                    label="Buying costs"
                    value={inputs.buyingCosts}
                    onChange={(value) => updateInput('buyingCosts', value)}
                    suffix="%"
                    step={0.25}
                  />
                  <NumberField
                    label="Mortgage points"
                    value={inputs.mortgagePointsRate}
                    onChange={(value) => updateInput('mortgagePointsRate', value)}
                    suffix="% of loan"
                    step={0.125}
                    helper="Discount points or origination points paid at closing."
                  />
                  <NumberField
                    label="Seller credits"
                    value={inputs.sellerCreditRate}
                    onChange={(value) => updateInput('sellerCreditRate', value)}
                    suffix="% of price"
                    step={0.25}
                    helper="Credits reduce eligible buyer closing costs, but never the down payment."
                  />
                  <NumberField
                    label="Upfront loan fee"
                    value={inputs.upfrontLoanFeeRate}
                    onChange={(value) => updateInput('upfrontLoanFeeRate', value)}
                    suffix="% of loan"
                    step={0.05}
                    helper="FHA starts at 1.75%. VA starts at 2.15% for first use with less than 5% down; adjust for down payment, prior use, or an exemption using your Loan Estimate."
                  />
                  <NumberField
                    label={
                      inputs.loanType === 'fha'
                        ? 'Annual FHA MIP'
                        : 'Annual PMI / MI'
                    }
                    value={inputs.pmiRate}
                    onChange={(value) => updateInput('pmiRate', value)}
                    suffix="% / yr"
                    step={0.05}
                    helper={
                      inputs.loanType === 'fha'
                        ? 'The 0.55% starting rate is an estimate; confirm your rate for the loan amount, term, and LTV. FHA MIP lasts 11 years at 90% LTV or below and generally the loan term above 90% LTV.'
                        : 'Conventional PMI automatically ends at 78% of original value in this model. VA and cash purchases have no monthly mortgage insurance.'
                    }
                  />
                  <NumberField
                    label="Immediate repairs / renovation"
                    value={inputs.renovationCosts}
                    onChange={(value) => updateInput('renovationCosts', value)}
                    prefix="$"
                    step={1_000}
                    helper="One-time work needed immediately after purchase. The sale-tax estimate treats this as a capital improvement; enter repairs separately only if your tax professional says they increase basis."
                  />
                </div>
                {inputs.upfrontLoanFeeRate > 0 ? (
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={inputs.financeUpfrontLoanFee}
                      onChange={(event) =>
                        setInputs((current) => ({
                          ...current,
                          financeUpfrontLoanFee: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      Finance the {formatCurrency(result.upfrontLoanFee)} upfront loan
                      fee into the mortgage
                    </span>
                  </label>
                ) : null}
              </details>

              <details className="input-section">
                <summary className="input-section-heading">
                  <span>Ongoing housing costs</span>
                  <small>Replace state estimates with real quotes when possible.</small>
                </summary>
                <div className="field-grid advanced-grid">
                  <NumberField
                    label="Property tax"
                    value={inputs.propertyTaxRate}
                    onChange={(value) => updateInput('propertyTaxRate', value)}
                    suffix="% / yr"
                    step={0.05}
                    helper="Statewide effective starting rate. New-purchase assessments, exemptions, and local levies can differ materially."
                  />
                  <NumberField
                    label="Home insurance"
                    value={inputs.annualHomeInsurance}
                    onChange={(value) => updateInput('annualHomeInsurance', value)}
                    prefix="$"
                    suffix="/ yr"
                    step={100}
                    helper={`Statewide 2022 average for ${STATE_DEFAULTS[inputs.state].name}. Replace with a current local quote.`}
                  />
                  <NumberField
                    label="Renters insurance"
                    value={inputs.annualRentersInsurance}
                    onChange={(value) => updateInput('annualRentersInsurance', value)}
                    prefix="$"
                    suffix="/ yr"
                    step={25}
                  />
                  <NumberField
                    label="Maintenance"
                    value={inputs.maintenanceRate}
                    onChange={(value) => updateInput('maintenanceRate', value)}
                    suffix="% / yr"
                    step={0.1}
                  />
                  <NumberField
                    label="Monthly HOA"
                    value={inputs.monthlyHoa}
                    onChange={(value) => updateInput('monthlyHoa', value)}
                    prefix="$"
                    step={25}
                  />
                  <NumberField
                    label="Owner utility difference"
                    value={inputs.monthlyUtilitiesDelta}
                    onChange={(value) => updateInput('monthlyUtilitiesDelta', value)}
                    prefix="$"
                    suffix="/ mo"
                    step={25}
                    helper="Extra utilities an owner pays versus a renter. Use a negative value if renting costs more."
                  />
                  <NumberField
                    label="Renter extras"
                    value={inputs.monthlyRenterExtras}
                    onChange={(value) => updateInput('monthlyRenterExtras', value)}
                    prefix="$"
                    suffix="/ mo"
                    step={25}
                    helper="Parking, amenity fees, and utilities not included in advertised rent."
                  />
                  <NumberField
                    label="Property tax growth"
                    value={inputs.propertyTaxGrowth}
                    onChange={(value) => updateInput('propertyTaxGrowth', value)}
                    suffix="% / yr"
                    step={0.1}
                  />
                  <NumberField
                    label="Insurance growth"
                    value={inputs.insuranceGrowth}
                    onChange={(value) => updateInput('insuranceGrowth', value)}
                    suffix="% / yr"
                    step={0.1}
                  />
                  <NumberField
                    label="Cost inflation"
                    value={inputs.costInflation}
                    onChange={(value) => updateInput('costInflation', value)}
                    suffix="% / yr"
                    step={0.1}
                    helper="Growth for maintenance, HOA, utilities, and renter extras."
                  />
                </div>
              </details>

              <details className="input-section rental-income-section">
                <summary className="input-section-heading">
                  <span>Rent out a room or ADU</span>
                  <small>
                    Model owner-only income after vacancy, operating costs, and
                    estimated income tax.
                  </small>
                </summary>
                <div className="rental-preview">
                  <Building2 size={18} />
                  <span>
                    Estimated net income in month one
                    <strong>
                      {formatCurrency(result.firstMonthNetRentalIncome)} / mo
                    </strong>
                  </span>
                </div>
                <div className="field-grid advanced-grid">
                  <NumberField
                    label="Gross room / ADU rent"
                    value={inputs.monthlyRentalIncome}
                    onChange={(value) => updateInput('monthlyRentalIncome', value)}
                    prefix="$"
                    suffix="/ mo"
                    step={100}
                    helper="Advertised monthly rent before vacancy, management, repairs, utilities, insurance, or income tax. Leave at zero if you will not rent part of the home."
                  />
                  <NumberField
                    label="Vacancy allowance"
                    value={inputs.rentalVacancyRate}
                    onChange={(value) => updateInput('rentalVacancyRate', value)}
                    suffix="%"
                    min={0}
                    max={100}
                    step={1}
                    helper="Expected share of potential rent lost to vacancy or nonpayment. Eight percent is roughly one vacant month per year."
                  />
                  <NumberField
                    label="Rental income growth"
                    value={inputs.rentalIncomeGrowth}
                    onChange={(value) => updateInput('rentalIncomeGrowth', value)}
                    suffix="% / yr"
                    step={0.1}
                    helper="Expected annual change in the room or ADU's gross rent."
                  />
                  <NumberField
                    label="Management fee"
                    value={inputs.rentalManagementRate}
                    onChange={(value) => updateInput('rentalManagementRate', value)}
                    suffix="% collected"
                    min={0}
                    max={100}
                    step={1}
                    helper="Property-management or booking fee applied only to rent expected to be collected."
                  />
                  <NumberField
                    label="Repairs & turnover reserve"
                    value={inputs.rentalMaintenanceRate}
                    onChange={(value) => updateInput('rentalMaintenanceRate', value)}
                    suffix="% collected"
                    min={0}
                    max={100}
                    step={1}
                    helper="Reserve for tenant-caused wear, cleaning between tenants, small repairs, and replacement of rental furnishings."
                  />
                  <NumberField
                    label="Other rental costs"
                    value={inputs.monthlyRentalOperatingCosts}
                    onChange={(value) =>
                      updateInput('monthlyRentalOperatingCosts', value)
                    }
                    prefix="$"
                    suffix="/ mo"
                    step={25}
                    helper="Incremental utilities, internet, cleaning, advertising, permits, bookkeeping, or other recurring costs. This grows with cost inflation."
                  />
                  <NumberField
                    label="Added landlord insurance"
                    value={inputs.annualRentalInsurance}
                    onChange={(value) => updateInput('annualRentalInsurance', value)}
                    prefix="$"
                    suffix="/ yr"
                    step={100}
                    helper="Annual increase in homeowners, landlord, or umbrella coverage caused by the rental. This grows with insurance inflation."
                  />
                  <NumberField
                    label="Rental setup costs"
                    value={inputs.rentalSetupCosts}
                    onChange={(value) => updateInput('rentalSetupCosts', value)}
                    prefix="$"
                    step={500}
                    helper="One-time permitting, safety work, furnishings, appliances, locks, or tenant-ready costs. This reduces buyer wealth upfront and is not automatically added to the home's tax basis."
                  />
                  <NumberField
                    label="Effective rental tax rate"
                    value={inputs.rentalIncomeTaxRate}
                    onChange={(value) => updateInput('rentalIncomeTaxRate', value)}
                    suffix="% of profit"
                    min={0}
                    max={60}
                    step={1}
                    helper="Approximate combined federal and state tax on positive rental cash profit after the costs entered above. This simplified rate does not calculate Schedule E depreciation, passive-loss limits, self-employment issues, or local lodging taxes."
                  />
                </div>
                <p className="rental-note">
                  Long-term room and ADU rentals can have different zoning, lease,
                  depreciation, expense-allocation, and owner-occupancy rules. Use
                  your expected after-expense tax rate here and verify the result with
                  local professionals.
                </p>
              </details>

              <details className="input-section">
                <summary className="input-section-heading">
                  <span>Rental move-in costs</span>
                  <small>The refundable deposit is returned at the end.</small>
                </summary>
                <div className="field-grid advanced-grid">
                  <NumberField
                    label="Security deposit"
                    value={inputs.renterSecurityDepositMonths}
                    onChange={(value) =>
                      updateInput('renterSecurityDepositMonths', value)
                    }
                    suffix="months"
                    step={0.5}
                  />
                  <NumberField
                    label="Rental broker fee"
                    value={inputs.renterBrokerFeeRate}
                    onChange={(value) => updateInput('renterBrokerFeeRate', value)}
                    suffix="% of yr rent"
                    step={1}
                  />
                  <NumberField
                    label="Other renter move-in costs"
                    value={inputs.renterMoveInCosts}
                    onChange={(value) => updateInput('renterMoveInCosts', value)}
                    prefix="$"
                    step={100}
                    helper="Application, administration, moving, or other nonrefundable costs."
                  />
                </div>
              </details>

              <details className="input-section tax-section">
                <summary className="input-section-heading">
                  <span>2026 federal tax estimate</span>
                  <small>
                    Incremental savings only—buying gets no automatic deduction.
                  </small>
                </summary>
                <div className="tax-preview">
                  <ReceiptText size={18} />
                  <span>
                    Estimated first-year homeowner benefit
                    <strong>
                      {formatCurrency(
                        result.firstYearFederalTaxBenefit +
                          result.firstYearStateTaxBenefit,
                      )}
                    </strong>
                  </span>
                </div>
                <div className="field-grid advanced-grid">
                  <label className="field" htmlFor="filing-status">
                    <span className="field-label">Filing status</span>
                    <span className="input-shell select-shell">
                      <select
                        id="filing-status"
                        value={inputs.filingStatus}
                        onChange={(event) =>
                          updateFilingStatus(event.target.value as FilingStatus)
                        }
                      >
                        {(
                          Object.keys(FILING_STATUS_LABELS) as FilingStatus[]
                        ).map((status) => (
                          <option value={status} key={status}>
                            {FILING_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={17} />
                    </span>
                  </label>
                  <NumberField
                    label="Annual income / MAGI"
                    value={inputs.annualIncome}
                    onChange={(value) => updateInput('annualIncome', value)}
                    prefix="$"
                    step={5_000}
                    helper="Approximate modified adjusted gross income before standard or itemized deductions. Used only for this local estimate."
                  />
                  <NumberField
                    label="Other itemized deductions"
                    value={inputs.annualOtherItemizedDeductions}
                    onChange={(value) =>
                      updateInput('annualOtherItemizedDeductions', value)
                    }
                    prefix="$"
                    suffix="/ yr"
                    step={1_000}
                    helper="Charity and other Schedule A deductions, excluding mortgage interest and state/local taxes."
                  />
                  <NumberField
                    label="Income growth"
                    value={inputs.incomeGrowth}
                    onChange={(value) => updateInput('incomeGrowth', value)}
                    suffix="% / yr"
                    step={0.5}
                    helper="Used to project income and non-property state/local taxes in future years."
                  />
                  <NumberField
                    label="Other state & local taxes"
                    value={inputs.annualStateLocalTaxes}
                    onChange={(value) =>
                      updateInput('annualStateLocalTaxes', value)
                    }
                    prefix="$"
                    suffix="/ yr"
                    step={1_000}
                    helper="State/local income or sales and personal-property taxes, excluding this home's property tax."
                  />
                  <label className="field salt-mode">
                    <span><input type="checkbox" checked={inputs.useAutomaticSaltCap}
                      onChange={(event) => setInputs((current) => ({ ...current, useAutomaticSaltCap: event.target.checked }))} /> Use current-law SALT caps</span>
                    <small>Recalculate each year from projected income. Uncheck to enter your own caps.</small>
                  </label>
                  <NumberField
                    disabled={inputs.useAutomaticSaltCap}
                    label="SALT deduction cap"
                    value={inputs.saltDeductionCap}
                    onChange={(value) => updateInput('saltDeductionCap', value)}
                    prefix="$"
                    step={1_000}
                    helper="2026 cap after the income phaseout. The default updates with filing status and income."
                  />
                  <NumberField
                    disabled={inputs.useAutomaticSaltCap}
                    label="SALT cap from 2030"
                    value={inputs.saltDeductionCapAfter2029}
                    onChange={(value) =>
                      updateInput('saltDeductionCapAfter2029', value)
                    }
                    prefix="$"
                    step={1_000}
                    helper="Current law returns the cap to $10,000 in 2030 ($5,000 if married filing separately)."
                  />
                  <NumberField
                    label="Mortgage debt limit"
                    value={inputs.mortgageInterestDebtLimit}
                    onChange={(value) =>
                      updateInput('mortgageInterestDebtLimit', value)
                    }
                    prefix="$"
                    step={25_000}
                    helper="2026 acquisition-debt limit is generally $750,000, or $375,000 if married filing separately."
                  />
                  <NumberField
                    label="Other state tax savings"
                    value={inputs.annualStateTaxBenefit}
                    onChange={(value) =>
                      updateInput('annualStateTaxBenefit', value)
                    }
                    prefix="$"
                    suffix="/ yr"
                    step={250}
                    helper="Optional annual benefit from state-specific deductions or credits. Defaults to zero because rules vary across all 50 states."
                  />
                </div>
                <p className="tax-note">
                  Standard deduction used:{' '}
                  <strong>
                    {formatCurrency(STANDARD_DEDUCTION_2026[inputs.filingStatus])}
                  </strong>
                  . Brackets and the standard deduction grow with cost inflation. The
                  current-law SALT cap and phaseout adjust through 2029, then revert in 2030. Manual mode uses your entered caps. This
                  estimate excludes AMT, credits, senior additions, the high-income
                  itemized-benefit limit, and state-specific rules.
                </p>
              </details>

              <details className="input-section">
                <summary className="input-section-heading">
                  <span>Sale & exit costs</span>
                  <small>What comes out of the buyer’s proceeds.</small>
                </summary>
                <div className="field-grid advanced-grid">
                  <NumberField
                    label="Selling costs"
                    value={inputs.sellingCosts}
                    onChange={(value) => updateInput('sellingCosts', value)}
                    suffix="%"
                    step={0.5}
                  />
                  <NumberField
                    label="Home-sale tax rate"
                    value={inputs.homeSaleTaxRate}
                    onChange={(value) => updateInput('homeSaleTaxRate', value)}
                    suffix="%"
                    step={1}
                    helper="Optional combined effective tax rate on gain above your exclusion."
                  />
                  <NumberField
                    label="Gain exclusion"
                    value={inputs.homeSaleGainExclusion}
                    onChange={(value) =>
                      updateInput('homeSaleGainExclusion', value)
                    }
                    prefix="$"
                    step={25_000}
                    helper="Applied after a two-year stay. Actual ownership, use, and state eligibility can differ."
                  />
                </div>
              </details>
            </div>
          ) : null}

          <p className="autosave-note">
            {storageUnavailable ? 'Saving is unavailable in this browser. Keep a scenario link to save your work.' : viewingShared ? 'This shared scenario is not replacing your saved inputs.' : 'Inputs save on this browser. No account required.'}
          </p>
        </aside>

        <section className="results-panel" id="results" aria-label="Your results">
          <h1 className="print-title">Buy or Rent: Scenario report</h1>
          <div className="verdict">
            <div className={`winner-badge ${result.winner}`}>
              {winnerIcon}
              {winnerLabel} comes out ahead
            </div>
            <h2>{formatCompactCurrency(result.advantage)}</h2>
            <p>
              more projected wealth after <strong>{inputs.stayYears} years</strong>,
              based on the assumptions you entered.
            </p>
          </div>

          <div className="wealth-summary">
            <div>
              <span className="legend buy" />
              <span>Buying</span>
              <strong>{formatCompactCurrency(result.buyWealth)}</strong>
            </div>
            <div>
              <span className="legend rent" />
              <span>Renting</span>
              <strong>{formatCompactCurrency(result.rentWealth)}</strong>
            </div>
          </div>

          <WealthChart data={result.timeline} />

          <div className="metric-grid">
            <article>
              <span>Break-even point</span>
              <strong>{formatBreakEven(result.breakEvenMonth)}</strong>
              <small>When buying pulls ahead and stays ahead</small>
            </article>
            <article>
              <span>Owner cost after tax</span>
              <strong>{formatCurrency(result.firstMonthOwnerCost)}</strong>
              <small>
                {formatCurrency(result.firstMonthOwnerCostBeforeTax)} before
                homeowner tax savings
                {inputs.monthlyRentalIncome > 0
                  ? ' and rental-income tax'
                  : ''}
              </small>
            </article>
            <article>
              <span>Price-to-rent ratio</span>
              <strong>{priceToRentRatio.toFixed(1)}×</strong>
              <small>{priceToRentLabel}</small>
            </article>
          </div>

          <CostBreakdown result={result} />
          {inputs.monthlyExtraPrincipal > 0 ? <p className="payoff-note">With extra principal: {result.mortgagePayoffMonth ? `mortgage paid off in ${formatBreakEven(result.mortgagePayoffMonth)}` : 'mortgage not paid off within this stay'}. Scheduled payment before extra principal: {formatCurrency(result.monthlyMortgage)}.</p> : null}
          <div className="explanation-card">
            <div className="section-title">
              <span>What is driving the result?</span>
              <TrendingUp size={17} />
            </div>
            <div className="driver-list">
              <div>
                <span className="driver-icon">
                  <Home size={17} />
                </span>
                <p>
                  <strong>{formatPercent(inputs.homeAppreciation)} appreciation</strong>
                  Your home is modeled at {formatCompactCurrency(result.finalHomeValue)} in
                  year {inputs.stayYears}.
                </p>
              </div>
              <div>
                <span className="driver-icon">
                  <Landmark size={17} />
                </span>
                <p>
                  <strong>{formatCurrency(Math.abs(firstYearGap))} monthly gap</strong>
                  {firstYearGap >= 0
                    ? 'Renting costs less at first, and that difference is invested.'
                    : 'Owning costs less at first, and that difference is invested.'}
                </p>
              </div>
              <div>
                <span className="driver-icon">
                  <Building2 size={17} />
                </span>
                <p>
                  <strong>{formatPercent(inputs.investmentReturn)} investment return</strong>
                  Both paths start with equal cash and invest whatever is left after upfront costs.
                </p>
              </div>
              {inputs.monthlyRentalIncome > 0 ? (
                <div>
                  <span className="driver-icon">
                    <Home size={17} />
                  </span>
                  <p>
                    <strong>
                      {formatCurrency(result.firstMonthNetRentalIncome)} net room /
                      ADU income in month one
                    </strong>
                    After the vacancy, management, repair reserve, recurring costs,
                    added insurance, and effective tax rate you entered.
                  </p>
                </div>
              ) : null}
              <div>
                <span className="driver-icon">
                  <ReceiptText size={17} />
                </span>
                <p>
                  <strong>
                    {formatCurrency(result.firstYearFederalTaxBenefit)} federal tax
                    savings in year one
                  </strong>
                  {result.firstYearFederalTaxBenefit <= 0
                    ? 'No federal savings is credited at this income and deduction profile.'
                    : result.ownerItemizesFirstYear
                      ? 'Ownership-specific deductions push this scenario above the standard deduction.'
                      : 'The owner does not clear the standard deduction in this scenario, so no federal ownership benefit is assumed.'}
                  {result.firstYearStateTaxBenefit > 0
                    ? ` You also entered ${formatCurrency(result.firstYearStateTaxBenefit)} of annual state savings.`
                    : ''}
                </p>
              </div>
            </div>
          </div>

          <details className="timeline-details">
            <summary>
              <span>See the year-by-year comparison</span>
              <ArrowRight size={16} />
            </summary>
            <div className="table-wrap" role="region" aria-label="Year-by-year comparison" tabIndex={0}>
              <table>
                <caption>Wealth at each period end; rental income and tax savings are totals for that period.</caption>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Buy wealth</th>
                    <th>Rent wealth</th>
                    {inputs.monthlyRentalIncome > 0 ? (
                      <th>Net room / ADU</th>
                    ) : null}
                    <th>Tax benefit</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {annualTimeline.map((point) => (
                    <tr key={point.month}>
                      <td>{Number(point.year.toFixed(2))}{point.month % 12 ? " (partial)" : ""}</td>
                      <td>{formatCompactCurrency(point.buyWealth)}</td>
                      <td>{formatCompactCurrency(point.rentWealth)}</td>
                      {inputs.monthlyRentalIncome > 0 ? (
                        <td>
                          {formatCompactCurrency(point.annualNetRentalIncome)}
                        </td>
                      ) : null}
                      <td>{formatCompactCurrency(point.annualTaxBenefit)}</td>
                      <td className={point.buyWealth >= point.rentWealth ? 'positive' : ''}>
                        {point.buyWealth >= point.rentWealth ? '+' : '−'}
                        {formatCompactCurrency(Math.abs(point.buyWealth - point.rentWealth))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <div className="result-actions"><button type="button" onClick={pinCurrent}>{pinned ? 'Replace pinned scenario A' : 'Pin this as scenario A'}</button></div>
          <p className="pin-notice" role="status">{pinNotice}</p>
          {pinned ? <ScenarioComparison pinned={pinned} current={inputs} onRestore={() => setInputs(pinned)} onRemove={removePinned} /> : null}
          <ExportActions result={result} />
          <button className="primary-share" type="button" onClick={share}>
            <Share2 size={18} /> Share this scenario
          </button>
        </section>
      </section>

      <a className="mobile-results-shortcut" href="#results">{winnerLabel} +{formatCompactCurrency(result.advantage)} <span>View results ↓</span></a>
      <section className="print-assumptions"><h2>Scenario assumptions</h2><p>Current scenario. Dollar amounts are USD; rates are percentages. Income and ZIP code are included if entered. Planning estimates, not a loan quote or tax return.</p><dl>{(Object.keys(inputs) as (keyof CalculatorInputs)[]).map(key => <div key={key}><dt>{inputLabel(key)}</dt><dd>{String(inputs[key]) || 'Not entered'}</dd></div>)}</dl></section>
      <section className="method-section">
        <div>
          <span className="step-label">Built for honest decisions</span>
          <h2>The math should never be a black box.</h2>
        </div>
        <div className="method-grid">
          <article>
            <span>01</span>
            <h3>Compare wealth, not payments</h3>
            <p>
              We track home equity, mortgage payoff, transaction costs, and the
              renter’s invested savings month by month.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Start local, then get specific</h3>
            <p>
              All 50 states have tax and insurance starting points. Replace them with
              a county tax bill and local insurance quote whenever possible.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Count tax savings honestly</h3>
            <p>
              We compare itemizing with the standard deduction, enforce current SALT
              and mortgage-debt limits, and show the benefit separately.
            </p>
          </article>
        </div>
        <p className="source-note">
          State property-tax starting points are derived from the U.S. Census
          Bureau’s 2024 ACS median real-estate tax and home-value tables. Insurance
          starting points use 2022 state-level NAIC averages published by Triple-I. Federal tax defaults use IRS tax-year 2026
          brackets, standard deductions, SALT limits, and mortgage-interest rules.{' '}
          <a
            href="https://data.census.gov/table/ACSDT1Y2024.B25103"
            target="_blank"
            rel="noreferrer"
          >
            Census source
          </a>
          {' · '}
          <a
            href="https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill"
            target="_blank"
            rel="noreferrer"
          >
            IRS 2026 tax source
          </a>
          {' · '}
          <a
            href="https://www.iii.org/fact-statistic/facts-statistics-homeowners-and-renters-insurance"
            target="_blank"
            rel="noreferrer"
          >
            Insurance source
          </a>
        </p>
      </section>

      <section className="method-section privacy-section" id="privacy">
        <h2>Your scenario and privacy</h2>
        <p>Calculations run in your browser. This app has no analytics and saves inputs only in this browser’s local storage. Pinned scenario A also stays in this browser. Reset replaces saved inputs with the defaults and removes the pinned scenario.</p>
        <p>Sharing is optional. A scenario link contains all your inputs, including income and ZIP code, and anyone with the link can read them. New links put inputs after the # character so they are not sent in page requests. Your hosting provider may retain normal access logs; older query-based links can include inputs in those logs.</p>
        <p>Loan rates and insurance fees are editable estimates, not eligibility checks or lender quotes. Mixed-use rental taxes, depreciation, recapture, and detailed sale-basis adjustments are not modeled. Federal projections start in 2026; future brackets are assumptions.</p>
      </section>
      <dialog ref={shareDialog} className="share-dialog" aria-labelledby="share-title">
        <h2 id="share-title">Share your scenario</h2>
        <p>This link includes every input, including income and ZIP code. Anyone with it can read your scenario.</p>
        <label htmlFor="scenario-link">Scenario link</label>
        <textarea id="scenario-link" readOnly value={shareLink} onFocus={(event) => event.target.select()} />
        <p role="status">{shareStatus}</p>
        <div className="dialog-actions">
          <button type="button" onClick={copyLink}>Copy link</button>
          {initialized && typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? <button type="button" onClick={nativeShare}>Share via device</button> : null}
          <button type="button" onClick={() => shareDialog.current?.close()}>Close</button>
        </div>
      </dialog>
      <footer>
        <a className="brand footer-brand" href="#">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>BUY / RENT</span>
        </a>
        <p>
          Educational estimates only—not financial, tax, or legal advice. Tax results
          are incremental estimates, not a tax return. Verify local costs, eligibility,
          and current law with qualified professionals.
        </p>
        <span>Made for clearer home decisions.</span>
      </footer>
    </main>
  )
}
