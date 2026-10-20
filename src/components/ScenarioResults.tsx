'use client'

import { useEffect } from 'react'
import { CalculatorInputs, CalculationResult, calculateBuyOrRent } from '@/lib/calculator'
import { formatCurrency, formatBreakEven } from '@/lib/format'
import { annualCsv, inputLabel } from '@/lib/scenario-tools'

export function CostBreakdown({ result }: { result: CalculationResult }) {
  return <details className="result-details cost-breakdown">
    <summary>See the month-one cost breakdown</summary>
    <p>Cash paid or received in the first month. Principal builds equity; it is included in cash flow and credited in home equity.</p>
    <div className="cost-columns">
      {(['owner', 'renter'] as const).map(side => <div key={side}>
        <h3>{side === 'owner' ? 'Buying' : 'Renting'}</h3>
        <dl>{result.firstMonthBreakdown[side].map(line => <div key={line.label}><dt>{line.label}</dt><dd>{formatCurrency(Math.abs(line.amount) < 0.5 ? 0 : line.amount)}</dd></div>)}
          <div className="cost-total"><dt>Total per month</dt><dd>{formatCurrency(side === 'owner' ? result.firstMonthOwnerCost : result.firstMonthRent)}</dd></div>
        </dl>
      </div>)}
    </div>
    <p className="detail-note">Negative amounts reduce costs. Rounded line items may differ from the displayed total by a few dollars. Rental income includes its entered effective tax rate; homeowner savings are a separate estimate.</p>
  </details>
}

export function ScenarioComparison({ pinned, current, onRestore, onRemove }: {
  pinned: CalculatorInputs; current: CalculatorInputs; onRestore: () => void; onRemove: () => void
}) {
  const a = calculateBuyOrRent(pinned)
  const b = calculateBuyOrRent(current)
  const changed = (Object.keys(current) as (keyof CalculatorInputs)[]).filter(key => pinned[key] !== current[key])
  const rows = [
    ['Home price', formatCurrency(pinned.homePrice), formatCurrency(current.homePrice)],
    ['Stay', `${pinned.stayYears} years`, `${current.stayYears} years`],
    ['Buying wealth', formatCurrency(a.buyWealth), formatCurrency(b.buyWealth)],
    ['Renting wealth', formatCurrency(a.rentWealth), formatCurrency(b.rentWealth)],
    ['Buying minus renting', formatCurrency(a.buyWealth - a.rentWealth), formatCurrency(b.buyWealth - b.rentWealth)],
    ['Owner cost / month', formatCurrency(a.firstMonthOwnerCost), formatCurrency(b.firstMonthOwnerCost)],
    ['Renter cost / month', formatCurrency(a.firstMonthRent), formatCurrency(b.firstMonthRent)],
    ['Break-even', formatBreakEven(a.breakEvenMonth), formatBreakEven(b.breakEvenMonth)],
  ]
  return <section className="scenario-comparison" aria-label="Scenario comparison">
    <h3>Compare your scenarios</h3>
    {pinned.stayYears !== current.stayYears ? <p className="comparison-warning">These scenarios use different time horizons. Wealth totals are not for the same date.</p> : null}
    <div className="table-wrap" role="region" aria-label="Scenario comparison table" tabIndex={0}>
      <table><caption>Scenario A is pinned. Scenario B follows your current inputs.</caption><thead><tr><th scope="col">Metric</th><th scope="col">A · Pinned</th><th scope="col">B · Current</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table>
    </div>
    <details className="result-details"><summary>{changed.length} changed assumptions</summary>
      <ul>{changed.map(key => <li key={key}>{inputLabel(key)}: {String(pinned[key]) || 'empty'} → {String(current[key]) || 'empty'}</li>)}</ul>
    </details>
    <div className="result-actions"><button type="button" onClick={onRestore}>Restore scenario A</button><button type="button" onClick={onRemove}>Remove pinned scenario</button></div>
  </section>
}

export function ExportActions({ result }: { result: CalculationResult }) {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = []
    const before = () => {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>('.results-panel details:not([open])'))
      opened.forEach(detail => { detail.open = true })
    }
    const after = () => { opened.forEach(detail => { detail.open = false }); opened = [] }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after) }
  }, [])
  const download = () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF', annualCsv(result)], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'buy-or-rent-annual-comparison.csv'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }
  return <div className="result-actions export-actions">
    <button type="button" onClick={download}>Download annual CSV</button>
    <button type="button" onClick={() => window.print()}>Print / save PDF</button>
  </div>
}
