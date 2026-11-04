import { NextResponse } from 'next/server'
import { generateWebsiteContentWithGemini } from '@/lib/gemini'
import { getCategoryTheme } from '@/lib/theme-engine'
import { retrieveBusinessImages } from '@/lib/image-service'
import { formatWhatsAppUrl } from '@/lib/whatsapp'
import { saveGeneratedSite, generateUniqueSlug, GeneratedWebsiteRecord } from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      category,
      location,
      phone,
      mapsUrl,
      websiteUrl,
      rating,
      reviewsCount,
      provider,
      providerId,
      photoReferences
    } = body

    if (!name || !category || !location) {
      return NextResponse.json({ error: 'Business name, category, and location are required' }, { status: 400 })
    }

    // 1. Generate category theme with seed variation
    const theme = getCategoryTheme(category, name)

    // 2. Fetch or retrieve verified images (real vs placeholder)
    const imageResult = await retrieveBusinessImages({
      name,
      category,
      location,
      photoReferences
    })

    // 3. Generate AI content using Gemini (with robust fallback)
    const content = await generateWebsiteContentWithGemini({
      name,
      category,
      location,
      phone,
      rating,
      reviewsCount
    })

    // 4. Format WhatsApp link if verified phone exists
    const waResult = formatWhatsAppUrl(phone, name)
    const whatsappUrl = waResult.isValid ? waResult.url : undefined

    // 5. Generate unique slug
    const slug = generateUniqueSlug(name, location, providerId)
    const id = `site_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const record: GeneratedWebsiteRecord = {
      id,
      slug,
      businessName: name,
      category,
      location,
      phone: phone && phone !== 'Not available' ? phone : undefined,
      whatsappUrl,
      mapsUrl: mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${location}`)}`,
      websiteUrl: websiteUrl || undefined,
      rating: rating && rating !== '—' ? rating : undefined,
      reviewsCount: reviewsCount || 0,
      provider: provider || 'NammaSpot',
      providerId,
      theme,
      content,
      images: imageResult.images,
      hasRealImages: imageResult.hasRealImages,
      imageNotice: imageResult.notice,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 6. Persist to storage
    saveGeneratedSite(record)

    return NextResponse.json({
      success: true,
      site: record,
      previewUrl: `/generated-sites/${slug}/preview`,
      publishedUrl: `/generated-sites/${slug}`
    })
  } catch (err: any) {
    console.error('Error generating website:', err)
    return NextResponse.json({ error: err.message || 'Website generation failed' }, { status: 500 })
  }
}
