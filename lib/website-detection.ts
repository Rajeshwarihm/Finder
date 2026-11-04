export interface WebsiteValidationResult {
  isValid: boolean
  normalizedUrl?: string
  domain?: string
  reason?: string
}

export type WebsiteStatus = 'verified' | 'no_website' | 'unknown'

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'example.com',
  'test.com',
  'placeholder.com'
])

/**
 * Validates whether a given URL is a legitimate official business website URL.
 * Strictly prevents Google Maps URLs from being treated as business websites.
 */
export function validateWebsiteUrl(rawUrl?: string | null): WebsiteValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, reason: 'URL is empty' }
  }

  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return { isValid: false, reason: 'URL is whitespace' }
  }

  // Ensure protocol
  let urlCandidate = trimmed
  if (!urlCandidate.startsWith('http://') && !urlCandidate.startsWith('https://')) {
    urlCandidate = `https://${urlCandidate}`
  }

  try {
    const parsed = new URL(urlCandidate)

    // Allowed protocols only
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, reason: 'Unsafe protocol' }
    }

    const hostname = parsed.hostname.toLowerCase()

    // Host checks
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { isValid: false, reason: 'Disallowed host' }
    }

    // Must have at least one dot in domain (e.g. example.com)
    if (!hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) {
      return { isValid: false, reason: 'Invalid domain structure' }
    }

    // CRITICAL: Google Maps directions / places URLs are NOT business websites!
    if (
      hostname.includes('google.') &&
      (parsed.pathname.includes('/maps') || parsed.searchParams.has('q') || hostname.startsWith('maps.'))
    ) {
      return { isValid: false, reason: 'Google Maps link, not an official business website' }
    }
    if (hostname === 'goo.gl' || hostname === 'maps.app.goo.gl') {
      return { isValid: false, reason: 'Google Maps shortlink, not an official website' }
    }

    // Clean domain for display (strip www.)
    const displayDomain = hostname.startsWith('www.') ? hostname.slice(4) : hostname

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      domain: displayDomain
    }
  } catch {
    return { isValid: false, reason: 'Malformed URL' }
  }
}

/**
 * Classifies website availability status for a business record.
 */
export function classifyWebsiteStatus(
  rawUrl?: string | null,
  providerReportedActive?: boolean | string
): WebsiteStatus {
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
    const validation = validateWebsiteUrl(rawUrl)
    if (validation.isValid) {
      return 'verified'
    }
  }

  if (providerReportedActive === 'No website' || providerReportedActive === false) {
    return 'no_website'
  }

  if (providerReportedActive === 'Active' && !rawUrl) {
    // Reported active by provider but missing actual URL: mark unknown so user can verify
    return 'unknown'
  }

  if (providerReportedActive === 'Unable to Verify' || providerReportedActive === 'Inactive') {
    return 'unknown'
  }

  // Default when no URL is returned by APIs
  return 'no_website'
}

/**
 * Server-side probe to check if a website responds to HTTP requests.
 */
export async function probeWebsiteUrl(url: string, timeoutMs = 5000): Promise<{ reachable: boolean; statusCode?: number; error?: string }> {
  const validation = validateWebsiteUrl(url)
  if (!validation.isValid || !validation.normalizedUrl) {
    return { reachable: false, error: validation.reason || 'Invalid URL' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(validation.normalizedUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NammaSpot/1.0 (+https://nammaspot.local)'
      },
      signal: controller.signal,
      redirect: 'follow'
    })
    clearTimeout(timer)
    return {
      reachable: res.status >= 200 && res.status < 400,
      statusCode: res.status
    }
  } catch (err: any) {
    clearTimeout(timer)
    // If HEAD is blocked by server (405 or 403), try quick GET
    try {
      const getController = new AbortController()
      const getTimer = setTimeout(() => getController.abort(), timeoutMs)
      const getRes = await fetch(validation.normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NammaSpot/1.0'
        },
        signal: getController.signal,
        redirect: 'follow'
      })
      clearTimeout(getTimer)
      return {
        reachable: getRes.status >= 200 && getRes.status < 500,
        statusCode: getRes.status
      }
    } catch (getErr: any) {
      return {
        reachable: false,
        error: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Network unreachable')
      }
    }
  }
}
