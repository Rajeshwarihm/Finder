import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const photoName = searchParams.get('name')

  if (!photoName) {
    return NextResponse.json({ error: 'Missing photo name parameter' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Places API key is not configured' }, { status: 500 })
  }

  try {
    // In Google Places API v1 (New), photos are fetched from:
    // https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=1200&key={apiKey}
    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${apiKey}`

    const upstreamRes = await fetch(mediaUrl, {
      redirect: 'follow',
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    })

    if (!upstreamRes.ok) {
      return NextResponse.json({ error: 'Failed to retrieve photo from provider' }, { status: upstreamRes.status })
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg'
    const buffer = await upstreamRes.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error proxying photo' }, { status: 500 })
  }
}
