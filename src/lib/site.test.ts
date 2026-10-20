import { describe, expect, it } from 'vitest'
import { getSiteUrl } from './site'

describe('deployment URL', () => {
  it.each(['', 'invalid', 'javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com'])('does not index an unsafe or unconfigured origin: %s', (value) => expect(getSiteUrl(value)).toBeUndefined())
  it('uses only the HTTPS origin', () => expect(getSiteUrl('https://example.com/path?key=value#fragment')).toBe('https://example.com'))
})
