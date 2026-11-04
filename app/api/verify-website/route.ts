import { NextResponse } from 'next/server'
import { validateWebsiteUrl, probeWebsiteUrl, classifyWebsiteStatus } from '@/lib/website-detection'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, providerStatus } = body

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({
        status: 'no_website',
        isValid: false,
        message: 'No official website found'
      })
    }

    const validation = validateWebsiteUrl(url)
    if (!validation.isValid) {
      return NextResponse.json({
        status: 'no_website',
        isValid: false,
        reason: validation.reason,
        message: 'Invalid or disallowed website URL'
      })
    }

    // Live reachability check
    const probe = await probeWebsiteUrl(validation.normalizedUrl!, 4000)

    const finalStatus = probe.reachable ? 'verified' : (probe.statusCode ? 'unknown' : 'unknown')

    return NextResponse.json({
      status: finalStatus,
      isValid: true,
      normalizedUrl: validation.normalizedUrl,
      domain: validation.domain,
      reachable: probe.reachable,
      statusCode: probe.statusCode,
      error: probe.error
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ status: 'no_website', isValid: false })
  }

  const validation = validateWebsiteUrl(url)
  if (!validation.isValid) {
    return NextResponse.json({ status: 'no_website', isValid: false, reason: validation.reason })
  }

  return NextResponse.json({
    status: 'verified',
    isValid: true,
    normalizedUrl: validation.normalizedUrl,
    domain: validation.domain
  })
}
