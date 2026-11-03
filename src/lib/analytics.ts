/**
 * Anonymous page views on the production site with PostHog, without cookies or browser storage.
 * Scenario links carry every input in the URL fragment (older links in the query string), so every
 * address leaves the browser as origin and path only. Local runs, previews and tests send nothing.
 * The original Vercel address keeps serving beside the custom domain, since saved scenarios live per origin.
 */
export const ANALYTICS_HOSTS: readonly string[] = ['thebuyorrentcalculator.com', 'buy-or-rent-web.vercel.app']
export const POSTHOG_TOKEN = 'phc_nwgDhGb6PARdCoMRTvPdcAHsKPirhvDi9Xq386XZfvZC'
export const POSTHOG_SCRIPT = 'https://us-assets.i.posthog.com/static/array.js'

export function analyticsEnabled(hostname: string): boolean {
  return ANALYTICS_HOSTS.includes(hostname)
}

/** Drops the query string and fragment from any web address; other values pass through unchanged. */
export function stripUrl(value: unknown): unknown {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return value
  try {
    const url = new URL(value)
    return url.origin + url.pathname
  } catch {
    return value
  }
}

type PropertyBag = Record<string, unknown> | undefined
export type AnalyticsEvent = { properties?: PropertyBag; $set?: PropertyBag; $set_once?: PropertyBag }

/** PostHog's before_send hook: runs on every event just before it is sent. */
export function scrubEvent<T extends AnalyticsEvent | null>(event: T): T {
  if (!event) return event
  for (const bag of [event.properties, event.$set, event.$set_once]) {
    if (bag) for (const key of Object.keys(bag)) bag[key] = stripUrl(bag[key])
  }
  return event
}

export function posthogConfig() {
  return {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-08-30',
    cookieless_mode: 'always',
    person_profiles: 'never',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_performance: false,
    enable_heatmaps: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    disable_product_tours: true,
    disable_conversations: true,
    respect_dnt: true,
    before_send: scrubEvent,
  } as const
}
