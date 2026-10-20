'use client'

import { useId, useState } from 'react'

import { InfoTip } from './InfoTip'

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
  helper?: string
  min?: number
  max?: number
  step?: number
  inputMode?: 'decimal' | 'numeric'
  disabled?: boolean
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  helper,
  min,
  max,
  step = 1,
  inputMode = 'decimal',
  disabled = false,
}: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <div className="field">
      <span className="field-label">
        <label htmlFor={id}>{label}</label>
        {helper ? <InfoTip label={label} text={helper} /> : null}
      </span>
      <span className="input-shell">
        {prefix ? <span className="input-affix prefix">{prefix}</span> : null}
        <input
          id={id}
          type="number"
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={draft ?? value}
          onChange={(event) => {
            setDraft(event.target.value)
            if (Number.isFinite(event.target.valueAsNumber)) onChange(event.target.valueAsNumber)
          }}
          onBlur={() => setDraft(null)}
        />
        {suffix ? <span className="input-affix suffix">{suffix}</span> : null}
      </span>
    </div>
  )
}
