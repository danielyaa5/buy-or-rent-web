import { describe, expect, it } from 'vitest'
import { ANALYTICS_HOSTS, POSTHOG_TOKEN, analyticsEnabled, posthogConfig, scrubEvent, stripUrl } from './analytics'

const shared = 'https://buy-or-rent-web.vercel.app/#scenario=eyJob21lUHJpY2UiOjc1MDAwMCwiaW5jb21lIjoxNTAwMDB9'
const legacy = 'https://buy-or-rent-web.vercel.app/?homePrice=750000&income=150000&zip=94110'

describe('analytics', () => {
  it('runs only on the production host', () => {
    expect(ANALYTICS_HOSTS).toEqual(['thebuyorrentcalculator.com', 'buy-or-rent-web.vercel.app'])
    for (const host of ANALYTICS_HOSTS) expect(analyticsEnabled(host)).toBe(true)
    for (const host of ['localhost', '127.0.0.1', 'www.thebuyorrentcalculator.com', 'buy-or-rent-web-git-main-example.vercel.app', 'example.com', '']) expect(analyticsEnabled(host)).toBe(false)
  })

  it('removes scenario fragments and legacy query inputs from addresses', () => {
    expect(stripUrl(shared)).toBe('https://buy-or-rent-web.vercel.app/')
    expect(stripUrl(legacy)).toBe('https://buy-or-rent-web.vercel.app/')
    expect(stripUrl('https://news.example/item?id=1#top')).toBe('https://news.example/item')
  })

  it('leaves values that are not web addresses unchanged', () => {
    for (const value of ['$direct', 'buy-or-rent-web.vercel.app', '/?income=1', 42, null, undefined, true]) expect(stripUrl(value)).toBe(value)
    expect(stripUrl('https://[invalid')).toBe('https://[invalid')
  })

  it('scrubs every property bag of an event before it is sent', () => {
    const event = {
      event: '$pageview',
      properties: { $current_url: shared, $referrer: legacy, $pathname: '/', title: 'Buy or Rent', $screen_width: 390 },
      $set: { $current_url: legacy },
      $set_once: { $initial_current_url: shared },
    }
    const result = scrubEvent(event)
    expect(result).toBe(event)
    expect(result.properties).toEqual({ $current_url: 'https://buy-or-rent-web.vercel.app/', $referrer: 'https://buy-or-rent-web.vercel.app/', $pathname: '/', title: 'Buy or Rent', $screen_width: 390 })
    expect(result.$set).toEqual({ $current_url: 'https://buy-or-rent-web.vercel.app/' })
    expect(result.$set_once).toEqual({ $initial_current_url: 'https://buy-or-rent-web.vercel.app/' })
    expect(JSON.stringify(result)).not.toMatch(/scenario=|income|homePrice|zip/)
    expect(scrubEvent(null)).toBeNull()
    expect(scrubEvent({})).toEqual({})
  })

  it('counts page views without cookies, profiles, recordings or interaction capture', () => {
    const config = posthogConfig()
    expect(POSTHOG_TOKEN).toMatch(/^phc_\w+$/)
    expect(config).toMatchObject({
      api_host: 'https://us.i.posthog.com',
      cookieless_mode: 'always',
      person_profiles: 'never',
      capture_pageview: true,
      autocapture: false,
      rageclick: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      enable_heatmaps: false,
      disable_session_recording: true,
      disable_surveys: true,
    })
    expect(config.before_send).toBe(scrubEvent)
  })
})
