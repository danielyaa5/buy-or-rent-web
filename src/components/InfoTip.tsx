'use client'

import { Info } from 'lucide-react'
import { CSSProperties, useId, useState } from 'react'

type InfoTipProps = {
  label: string
  text: string
}

export function InfoTip({ label, text }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const [left, setLeft] = useState(-12)

  return (
    <span
      className={`info-tip${open ? ' is-open' : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          event.currentTarget.querySelector('button')?.focus()
        }
      }}
    >
      <button
        className="info-tip-button"
        type="button"
        aria-label={`More information about ${label}`}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={(event) => {
          const anchor = event.currentTarget.parentElement!.getBoundingClientRect()
          const width = Math.min(260, window.innerWidth - 44)
          const pageLeft = Math.max(12, Math.min(anchor.left - 12, window.innerWidth - width - 12))
          setLeft(pageLeft - anchor.left)
          setOpen((current) => !current)
        }}
      >
        <Info size={14} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <span className="info-tip-content" id={tooltipId} role="tooltip" style={{ left, "--tip-arrow-left": `${6 - left}px` } as CSSProperties}>
        {text}
      </span>
    </span>
  )
}
