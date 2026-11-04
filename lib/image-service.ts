export interface BusinessImage {
  url: string
  caption: string
  isRealPhoto: boolean
  attribution?: string
  source?: 'Google Places' | 'Wikimedia' | 'Verified Official' | 'Category Placeholder'
}

export interface ImageRetrievalResult {
  images: BusinessImage[]
  hasRealImages: boolean
  notice?: string
}

// Category-specific high-aesthetic SVG neutral placeholders
function getCategoryPlaceholderSvg(category: string, businessName: string): string {
  const c = category.toLowerCase()
  let iconPath = ''
  let bgGradient = ['#3b82f6', '#1d4ed8']
  let label = 'Hospitality'

  if (c.includes('restaurant')) {
    bgGradient = ['#e11d48', '#881337']
    label = 'Dining & Restaurant'
    iconPath = '<path d="M18 2v20M22 2v6a2 2 0 0 1-2 2v12M2 2l4 7v13M6 9l4-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  } else if (c.includes('cafe')) {
    bgGradient = ['#b45309', '#451a03']
    label = 'Cafe & Coffee'
    iconPath = '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z M6 2v2 M10 2v2 M14 2v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  } else if (c.includes('pg') || c.includes('paying guest')) {
    bgGradient = ['#0284c7', '#0369a1']
    label = 'PG Accommodation'
    iconPath = '<path d="M3 10V22h18V10M3 10l9-7 9 7M9 22v-6h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  } else if (c.includes('hotel')) {
    bgGradient = ['#0f172a', '#1e293b']
    label = 'Hotel & Suites'
    iconPath = '<path d="M10 22V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v15M14 22V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v19M3 22h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  } else if (c.includes('hostel')) {
    bgGradient = ['#ea580c', '#9a3412']
    label = 'Hostel & Co-living'
    iconPath = '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  } else if (c.includes('resort')) {
    bgGradient = ['#047857', '#064e3b']
    label = 'Resort & Nature Retreat'
    iconPath = '<path d="M8 14s1.5 2 4 2 4-2 4-2M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  } else if (c.includes('lodge') || c.includes('homestay') || c.includes('guest house')) {
    bgGradient = ['#78350f', '#451a03']
    label = 'Lodge & Homestay'
    iconPath = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}"/>
        <stop offset="100%" stop-color="${bgGradient[1]}"/>
      </linearGradient>
      <radialGradient id="r" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <rect width="1200" height="800" fill="url(#r)"/>
    <g transform="translate(560, 260) scale(3.5)" stroke="#ffffff" opacity="0.85">
      ${iconPath}
    </g>
    <text x="600" y="470" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="38" fill="#ffffff">${escapeXml(businessName)}</text>
    <text x="600" y="520" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="600" font-size="20" fill="#ffffff" opacity="0.85">${label}</text>
    <rect x="350" y="560" width="500" height="38" rx="19" fill="#000000" fill-opacity="0.25"/>
    <text x="600" y="585" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="500" font-size="14" fill="#ffffff" opacity="0.9">Verified Business Photo Unavailable · Neutral Category Visual</text>
  </svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

/**
 * Searches Wikimedia Commons for verified public media matching the business name and location.
 */
async function searchWikimediaImages(businessName: string, location: string): Promise<BusinessImage[]> {
  try {
    const city = location.split(',')[0].trim()
    const searchTerm = `${businessName} ${city}`
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=1&prop=pageimages|info&piprop=original|thumbnail&pithumbsize=1000`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok) return []
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return []

    const images: BusinessImage[] = []
    for (const key of Object.keys(pages)) {
      const p = pages[key]
      const title = (p.title || '').toLowerCase()
      const bName = businessName.toLowerCase()

      // Exact match verification to prevent mismatch with similar-named places
      if (title.includes(bName) || bName.includes(title)) {
        const imgUrl = p.original?.source || p.thumbnail?.source
        if (imgUrl) {
          images.push({
            url: imgUrl,
            caption: `${businessName} - Exterior & Ambience`,
            isRealPhoto: true,
            attribution: 'Wikimedia Commons / Wikipedia Verified Media',
            source: 'Wikimedia'
          })
        }
      }
    }
    return images
  } catch {
    return []
  }
}

/**
 * Retrieves real photographs for a business or provides neutral category placeholders.
 * Respects strict policy: never claims illustrative images are real photographs.
 */
export async function retrieveBusinessImages(business: {
  name: string
  category: string
  location: string
  photoReferences?: Array<{ name: string; authorAttributions?: Array<{ displayName?: string }> }>
}): Promise<ImageRetrievalResult> {
  const realImages: BusinessImage[] = []

  // 1. Google Places photo references if present
  if (business.photoReferences && business.photoReferences.length > 0) {
    for (const p of business.photoReferences.slice(0, 4)) {
      if (p.name) {
        const attribution = p.authorAttributions?.[0]?.displayName
          ? `Photo by ${p.authorAttributions[0].displayName} (Google Places)`
          : 'Google Places Verified Media'

        realImages.push({
          url: `/api/places-photo?name=${encodeURIComponent(p.name)}`,
          caption: `${business.name} - Verified Property Photo`,
          isRealPhoto: true,
          attribution,
          source: 'Google Places'
        })
      }
    }
  }

  // 2. Supplement with Wikimedia Commons if no Google Places photos
  if (realImages.length === 0) {
    const wikiImages = await searchWikimediaImages(business.name, business.location)
    realImages.push(...wikiImages)
  }

  // 3. Fallback to neutral category placeholder if no real photos found
  if (realImages.length > 0) {
    return {
      images: realImages,
      hasRealImages: true
    }
  }

  const placeholderUrl = getCategoryPlaceholderSvg(business.category, business.name)
  return {
    images: [
      {
        url: placeholderUrl,
        caption: `${business.name} (${business.category})`,
        isRealPhoto: false,
        attribution: 'Illustrative Category Visual (Actual photos unavailable)',
        source: 'Category Placeholder'
      }
    ],
    hasRealImages: false,
    notice: 'Actual photographs for this business are currently unavailable. Illustrative category placeholder shown.'
  }
}
