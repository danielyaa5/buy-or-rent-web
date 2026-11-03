'use client'

import { useEffect } from 'react'

import { POSTHOG_SCRIPT, POSTHOG_TOKEN, analyticsEnabled, posthogConfig } from '@/lib/analytics'

type PostHogWindow = Window & { posthog?: { init: (token: string, config: ReturnType<typeof posthogConfig>) => unknown } }

/** Loads PostHog's cookieless page views on the production host only; renders nothing. */
export function Analytics() {
  useEffect(() => {
    if (!analyticsEnabled(window.location.hostname) || document.querySelector(`script[src="${POSTHOG_SCRIPT}"]`)) return
    const script = document.createElement('script')
    script.src = POSTHOG_SCRIPT
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => (window as PostHogWindow).posthog?.init(POSTHOG_TOKEN, posthogConfig())
    document.head.append(script)
  }, [])
  return null
}
