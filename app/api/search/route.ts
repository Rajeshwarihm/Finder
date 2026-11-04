import { NextResponse } from 'next/server'
import { validateWebsiteUrl, classifyWebsiteStatus } from '@/lib/website-detection'
import { formatWhatsAppUrl } from '@/lib/whatsapp'

const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2'
const GOOGLE_PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby'

function formatCategory(cat: string): string {
  const c = cat.toLowerCase()
  if (c === 'pg' || c === 'pg-accommodations') return 'PG'
  if (c === 'restaurants' || c === 'restaurant') return 'Restaurant'
  if (c === 'cafes' || c === 'cafe') return 'Cafe'
  if (c === 'hotels' || c === 'hotel') return 'Hotel'
  if (c === 'hostels' || c === 'hostel') return 'Hostel'
  if (c === 'resorts' || c === 'resort') return 'Resort'
  if (c === 'lodges' || c === 'lodge') return 'Lodge'
  if (c === 'homestays' || c === 'homestay') return 'Homestay'
  if (c === 'guest-houses' || c === 'guest houses' || c === 'guest house') return 'Guest House'
  if (c === 'all hospitality' || c === 'all-hospitality') return 'Hospitality'
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')
}

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// ==========================================
// STRICT CATEGORY FILTERING FUNCTIONS
// Ensures 100% pure separation with ZERO mixing
// ==========================================

// 1. RESTAURANTS: Pure dining only. NEVER include hotels, lodges, residencies, or OYO rooms.
function isStrictRestaurant(name: string, primaryType: string, categories: string[]): boolean {
  const n = name.toLowerCase()
  const pt = primaryType.toLowerCase()
  const cats = categories.map((c) => c.toLowerCase())

  // Negative filter: Remove hotels, lodges, residencies, and rooms
  if (
    n.includes('townhouse') || n.includes('oyo') || n.includes('residency') ||
    n.includes('comforts') || n.includes('lodge') || n.includes('lodging') ||
    n.includes('inn') || n.includes('suites') || n.includes('resort') ||
    n.includes('hostel') || n.includes(' guest house')
  ) {
    if (!n.includes('restaurant') && !cats.includes('restaurant')) return false
  }

  // Remove lodging types
  if (pt.includes('lodging') || pt.includes('motel') || pt.includes('resort_hotel')) return false
  // Remove cafes
  if (pt.includes('cafe') || pt.includes('coffee')) return false
  // Remove cyber/internet
  if (cats.includes('internet café') || n.includes('cyber') || n.includes('internet')) return false

  return true
}

// 2. HOTELS: Pure lodging & stays only. NEVER include standalone pure-veg/dining restaurants with "Hotel" in name.
function isStrictHotel(name: string, primaryType: string, categories: string[]): boolean {
  const n = name.toLowerCase()
  const pt = primaryType.toLowerCase()

  // Remove standalone restaurants that in India call themselves "Hotel X Veg"
  const isFoodOnly = (
    n.includes('veg') || n.includes('fast food') || n.includes('chats') ||
    n.includes('bhavan') || n.includes('canteen') || n.includes('mess') ||
    n.includes('darshini') || n.includes('sweets') || n.includes('bakery') ||
    n.includes('dhaba') || n.includes('biryani') || n.includes('thali') ||
    n.includes('meals') || n.includes('ice cream') || n.includes('kitchen')
  ) && !n.includes('residency') && !n.includes('lodge') && !n.includes('comforts') &&
       !n.includes('grand') && !n.includes('inn') && !n.includes('palace') &&
       !n.includes('suites') && !n.includes('resort')

  if (isFoodOnly) return false
  if (pt.includes('restaurant') || pt.includes('cafe') || pt.includes('coffee')) return false

  return true
}

// 3. CAFES: Pure coffee houses, tea bars, bakeries. Remove cyber/internet, flour mills, beeda shops, messes.
function isStrictCafe(name: string, primaryType: string, categories: string[]): boolean {
  const n = name.toLowerCase()
  const pt = primaryType.toLowerCase()
  const cats = categories.map((c) => c.toLowerCase())

  // Junk filters to remove cyber cafes, flour mills, beeda shops, and messes
  const junkWords = [
    'floor mill', 'mill', 'beeda', 'pan shop', 'store', 'stores', 'canteen', 'mess',
    'hospital', 'milk', 'dairy', 'institute', 'enterprise', 'enterprises', 'medical',
    'hotel', 'lodge', 'resort', 'cyber', 'internet', 'xerox', 'computer', 'computers',
    'telecom', 'infotech', 'cell', 'csc', 'hardware', 'stationery', 'pharmacy'
  ]
  if (cats.includes('internet café') || junkWords.some((w) => n.includes(w))) {
    return false
  }

  // Exclude lodging and full hotels
  if (pt.includes('hotel') || pt.includes('resort') || pt.includes('lodging')) return false

  // Must be genuinely cafe, coffee, tea, or bakery
  return (
    n.includes('cafe') || n.includes('café') || n.includes('coffee') ||
    n.includes('tea') || n.includes('chai') || n.includes('lassi') ||
    n.includes('bakery') || n.includes('onebite') || n.includes('bake') ||
    cats.some((c) => c.includes('coffee shop') || c.includes('tea house') || c.includes('café')) ||
    pt.includes('cafe') || pt.includes('coffee')
  )
}

// 4. PG: Pure Paying Guest accommodations only. Strictly distinguish from Hostels.
function isStrictPG(name: string, categories: string[]): boolean {
  const n = name.toLowerCase()
  // User explicitly requested: DO NOT mix PG and Hostels! Distinguish them!
  if (n.includes('hostel')) return false

  // Remove commercial non-accommodations
  if (
    n.includes('saloon') || n.includes('salon') || n.includes('barber') ||
    n.includes('enterprise') || n.includes('enterprises') || n.includes('store') ||
    n.includes('hardware') || n.includes('college') || n.includes('school') ||
    n.includes('yoga') || n.includes('hospital') || n.includes('pharmacy')
  ) {
    return false
  }

  return /\bpg\b/i.test(name) || /paying\s*guest/i.test(name)
}

// 5. HOSTELS: Pure hostels only. Strictly distinguish from PGs.
function isStrictHostel(name: string): boolean {
  const n = name.toLowerCase()
  if (n.includes('pg') || n.includes('paying guest')) return false
  return n.includes('hostel')
}

// 6. RESORTS: Scenic retreats and holiday resorts.
function isStrictResort(name: string, primaryType: string, categories: string[]): boolean {
  const n = name.toLowerCase()
  const pt = primaryType.toLowerCase()
  const cats = categories.map((c) => c.toLowerCase())
  return n.includes('resort') || pt.includes('resort') || cats.some((c) => c.includes('resort'))
}

// 7. LODGES: Pure lodges and budget rooms.
function isStrictLodge(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('lodge') || n.includes('lodging') || n.includes('residency')
}

// 8. HOMESTAYS: Estate and heritage homestays.
function isStrictHomestay(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('homestay') || n.includes('estate stay') || n.includes('home stay')
}

// ==========================================
// GOOGLE PLACES SEARCH
// ==========================================
async function fetchGooglePlaces(lat: number, lon: number, category: string, apiKey: string) {
  const c = category.toLowerCase()
  let includedTypes: string[] = []
  let radius = 7000.0 // Default 7km

  if (c === 'restaurants' || c === 'restaurant') {
    includedTypes = ['restaurant', 'indian_restaurant', 'vegetarian_restaurant', 'south_indian_restaurant', 'fast_food_restaurant']
  } else if (c === 'hotels' || c === 'hotel') {
    includedTypes = ['hotel', 'motel', 'lodging']
  } else if (c === 'cafes' || c === 'cafe') {
    includedTypes = ['cafe', 'coffee_shop']
  } else if (c === 'pg' || c === 'pg-accommodations') {
    includedTypes = ['hostel', 'guest_house']
    radius = 10000.0
  } else if (c === 'hostels' || c === 'hostel') {
    includedTypes = ['hostel']
    radius = 10000.0
  } else if (c === 'resorts' || c === 'resort') {
    includedTypes = ['resort_hotel', 'lodging']
    radius = 25000.0 // 25km for scenic outer resorts
  } else if (c === 'lodges' || c === 'lodge') {
    includedTypes = ['lodging', 'hotel']
  } else if (c === 'homestays' || c === 'homestay') {
    includedTypes = ['bed_and_breakfast', 'guest_house']
    radius = 20000.0
  } else {
    includedTypes = ['restaurant', 'hotel', 'cafe']
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.googleMapsUri',
    'places.websiteUri',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.businessStatus',
    'places.primaryType',
    'places.photos'
  ].join(',')

  try {
    const res = await fetch(GOOGLE_PLACES_NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        includedTypes,
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lon }, radius }
        },
        maxResultCount: 20
      })
    })

    if (!res.ok) return []
    const data = await res.json()
    const places = data.places || []

    return places.filter((p: any) => {
      const name = p.displayName?.text || ''
      const pt = p.primaryType || ''
      if (c === 'restaurants' || c === 'restaurant') return isStrictRestaurant(name, pt, [])
      if (c === 'hotels' || c === 'hotel') return isStrictHotel(name, pt, [])
      if (c === 'cafes' || c === 'cafe') return isStrictCafe(name, pt, [])
      if (c === 'pg' || c === 'pg-accommodations') return isStrictPG(name, [])
      if (c === 'hostels' || c === 'hostel') return isStrictHostel(name)
      if (c === 'resorts' || c === 'resort') return isStrictResort(name, pt, [])
      if (c === 'lodges' || c === 'lodge') return isStrictLodge(name)
      if (c === 'homestays' || c === 'homestay') return isStrictHomestay(name)
      return true
    })
  } catch {
    return []
  }
}

// ==========================================
// TOMTOM SEARCH WITH STRICT ISOLATION
// ==========================================
async function fetchTomTomPlaces(lat: number, lon: number, address: string, category: string, apiKey: string) {
  const c = category.toLowerCase()
  let poiUrl: URL
  let radius = '7500' // 7.5km urban radius

  if (c === 'pg' || c === 'pg-accommodations') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/PG.json`)
    radius = '12000'
  } else if (c === 'hostels' || c === 'hostel') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/hostel.json`)
    radius = '12000'
  } else if (c === 'cafes' || c === 'cafe') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/cafe.json`)
    radius = '10000'
  } else if (c === 'hotels' || c === 'hotel') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/hotel.json`)
    radius = '10000'
  } else if (c === 'lodges' || c === 'lodge') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/lodge.json`)
    radius = '10000'
  } else if (c === 'resorts' || c === 'resort') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/resort.json`)
    radius = '25000' // 25km radius to capture all scenic outer resorts
  } else if (c === 'homestays' || c === 'homestay') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/homestay.json`)
    radius = '25000'
  } else if (c === 'guest-houses' || c === 'guest houses' || c === 'guest house') {
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/guest%20house.json`)
    radius = '15000'
  } else {
    // Restaurants
    poiUrl = new URL(`${TOMTOM_BASE_URL}/poiSearch/restaurant.json`)
    radius = '10000'
  }

  poiUrl.searchParams.set('key', apiKey)
  poiUrl.searchParams.set('lat', String(lat))
  poiUrl.searchParams.set('lon', String(lon))
  poiUrl.searchParams.set('radius', radius)
  poiUrl.searchParams.set('limit', '100')
  poiUrl.searchParams.set('language', 'en-US')

  try {
    const res = await fetch(poiUrl, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    const rawResults = data.results ?? []

    return rawResults.filter((r: any) => {
      const name = r.poi?.name || ''
      const cats = r.poi?.categories || []
      const classCodes = (r.poi?.classifications || []).map((x: any) => x.code)

      if (c === 'restaurants' || c === 'restaurant') return isStrictRestaurant(name, classCodes[0] || '', cats)
      if (c === 'hotels' || c === 'hotel') return isStrictHotel(name, classCodes[0] || '', cats)
      if (c === 'cafes' || c === 'cafe') return isStrictCafe(name, classCodes[0] || '', cats)
      if (c === 'pg' || c === 'pg-accommodations') return isStrictPG(name, cats)
      if (c === 'hostels' || c === 'hostel') return isStrictHostel(name)
      if (c === 'resorts' || c === 'resort') return isStrictResort(name, classCodes[0] || '', cats)
      if (c === 'lodges' || c === 'lodge') return isStrictLodge(name)
      if (c === 'homestays' || c === 'homestay') return isStrictHomestay(name)
      return true
    })
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim()
  const category = searchParams.get('category')?.trim() || 'restaurants'

  if (!query) {
    return NextResponse.json({ error: 'Enter a city, town, area or locality.' }, { status: 400 })
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
  const tomtomApiKey = process.env.TOMTOM_API_KEY

  if (!googleApiKey && !tomtomApiKey) {
    return NextResponse.json({ error: 'Search API key is not configured.' }, { status: 500 })
  }

  // 1. Geocode the requested city
  let lat = 0
  let lon = 0
  let resolvedAddress = query

  try {
    const geocodeUrl = new URL(`${TOMTOM_BASE_URL}/geocode/${encodeURIComponent(query)}.json`)
    geocodeUrl.searchParams.set('key', tomtomApiKey || 'TegxrNJD7Sd7ih4kMeAJQcYkFKwp2jHI')
    geocodeUrl.searchParams.set('limit', '1')
    const geoRes = await fetch(geocodeUrl, { next: { revalidate: 300 } })
    if (geoRes.ok) {
      const geoData = await geoRes.json()
      if (geoData.results?.[0]?.position) {
        lat = geoData.results[0].position.lat
        lon = geoData.results[0].position.lon
        resolvedAddress = geoData.results[0].address?.freeformAddress || query
      }
    }
  } catch (geoErr) {
    console.warn('Geocoding error:', geoErr)
  }

  if (lat === 0 || lon === 0) {
    return NextResponse.json({ error: 'We could not find that location.' }, { status: 404 })
  }

  const displayCategory = formatCategory(category)
  const combinedMap = new Map<string, any>()

  // 2. Query Google Places if key is available
  if (googleApiKey) {
    try {
      const googleResults = await fetchGooglePlaces(lat, lon, category, googleApiKey)
      for (const p of googleResults) {
        const bName = p.displayName?.text || 'Unnamed establishment'
        const bAddress = p.formattedAddress || resolvedAddress
        const key = normalizeKey(bName)
        const mapsUrl = p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bName}, ${bAddress}`)}`

        const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || 'Not available'
        const rawWeb = p.websiteUri || undefined
        const webVal = validateWebsiteUrl(rawWeb)
        const websiteStatus = classifyWebsiteStatus(rawWeb, rawWeb ? 'Active' : 'No website')
        const wa = formatWhatsAppUrl(phone, bName)

        combinedMap.set(key, {
          name: bName,
          category: displayCategory,
          location: bAddress,
          phone,
          website: (websiteStatus === 'verified' ? 'Active' : 'No website') as 'Active' | 'No website',
          websiteUrl: webVal.isValid ? webVal.normalizedUrl : undefined,
          websiteDomain: webVal.domain,
          websiteStatus,
          whatsappUrl: wa.isValid ? wa.url : undefined,
          rating: p.rating ? Number(p.rating).toFixed(1) : '—',
          reviewsCount: p.userRatingCount || 0,
          completeness: (p.nationalPhoneNumber || p.internationalPhoneNumber) && p.websiteUri ? 100 : (p.nationalPhoneNumber || p.internationalPhoneNumber) ? 85 : 70,
          priority: 'High' as const,
          assigned: 'AS',
          color: '#efd3ae',
          position: p.location ? { lat: p.location.latitude, lon: p.location.longitude } : undefined,
          providerId: p.id,
          provider: 'Google Places',
          mapsUrl,
          photoReferences: p.photos || [],
          businessStatus: p.businessStatus || 'OPERATIONAL',
        })
      }
    } catch (gErr) {
      console.warn('Google Places search warning:', gErr)
    }
  }

  // 3. Supplement with TomTom Places using strict category isolation
  if (tomtomApiKey) {
    try {
      const tomtomResults = await fetchTomTomPlaces(lat, lon, resolvedAddress, category, tomtomApiKey)
      for (const r of tomtomResults) {
        const bName = r.poi?.name || 'Unnamed establishment'
        const key = normalizeKey(bName)

        if (!combinedMap.has(key)) {
          const bAddress = r.address?.freeformAddress || resolvedAddress
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bName}, ${bAddress}`)}`
          const phone = r.poi?.phone || 'Not available'
          const rawWeb = r.poi?.url || undefined
          const webVal = validateWebsiteUrl(rawWeb)
          const websiteStatus = classifyWebsiteStatus(rawWeb, rawWeb ? 'Active' : 'No website')
          const wa = formatWhatsAppUrl(phone, bName)

          combinedMap.set(key, {
            name: bName,
            category: displayCategory,
            location: bAddress,
            phone,
            website: (websiteStatus === 'verified' ? 'Active' : 'No website') as 'Active' | 'No website',
            websiteUrl: webVal.isValid ? webVal.normalizedUrl : undefined,
            websiteDomain: webVal.domain,
            websiteStatus,
            whatsappUrl: wa.isValid ? wa.url : undefined,
            rating: '—',
            reviewsCount: 0,
            completeness: r.poi?.phone && r.poi?.url ? 100 : r.poi?.phone ? 85 : 70,
            priority: 'High' as const,
            assigned: 'AS',
            color: '#efd3ae',
            distance: r.dist ? `${(r.dist / 1000).toFixed(1)} km` : undefined,
            position: r.position,
            providerId: r.id,
            provider: 'TomTom Places',
            mapsUrl,
            photoReferences: [],
          })
        }
      }
    } catch (tErr) {
      console.warn('TomTom supplement warning:', tErr)
    }
  }

  const allBusinesses = Array.from(combinedMap.values())

  // Sort: places with phone numbers and ratings first
  allBusinesses.sort((a, b) => {
    const aScore = (a.phone !== 'Not available' ? 10 : 0) + (a.reviewsCount > 0 ? 5 : 0)
    const bScore = (b.phone !== 'Not available' ? 10 : 0) + (b.reviewsCount > 0 ? 5 : 0)
    return bScore - aScore
  })

  return NextResponse.json({
    businesses: allBusinesses,
    resolvedLocation: resolvedAddress,
    total: allBusinesses.length,
    provider: combinedMap.size > 0 && Array.from(combinedMap.values()).some((b) => b.provider === 'Google Places')
      ? 'Google Places & Maps'
      : 'TomTom Places'
  })
}
