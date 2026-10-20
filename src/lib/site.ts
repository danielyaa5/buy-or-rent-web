/** Set only for a deployment intended to be indexed. Local previews default to noindex. */
export function getSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return undefined
    return url.origin
  } catch { return undefined }
}
