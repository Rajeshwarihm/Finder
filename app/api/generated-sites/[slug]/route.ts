import { NextResponse } from 'next/server'
import {
  getGeneratedSiteBySlug,
  updateGeneratedSite,
  publishGeneratedSite
} from '@/lib/storage'
import { getCategoryTheme } from '@/lib/theme-engine'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const site = getGeneratedSiteBySlug(slug)

  if (!site) {
    return NextResponse.json({ error: 'Generated website not found' }, { status: 404 })
  }

  return NextResponse.json({ site })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const body = await request.json()
    const { content, theme, phone, whatsappUrl, regenerateTheme } = body

    let updatedTheme = theme
    if (regenerateTheme) {
      // Regenerate theme with a randomized seed
      const site = getGeneratedSiteBySlug(slug)
      if (site) {
        updatedTheme = getCategoryTheme(site.category, `${site.businessName}-${Date.now()}`)
      }
    }

    const updated = updateGeneratedSite(slug, {
      ...(content ? { content } : {}),
      ...(updatedTheme ? { theme: updatedTheme } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(whatsappUrl !== undefined ? { whatsappUrl } : {})
    })

    if (!updated) {
      return NextResponse.json({ error: 'Site not found for update' }, { status: 404 })
    }

    return NextResponse.json({ success: true, site: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const site = publishGeneratedSite(slug)
    if (!site) {
      return NextResponse.json({ error: 'Site not found to publish' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      site,
      publishedUrl: `/generated-sites/${slug}`
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Publish failed' }, { status: 500 })
  }
}
