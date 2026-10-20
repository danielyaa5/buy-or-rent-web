import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  return {
    rules: siteUrl ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' },
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  }
}
