import { NextResponse } from 'next/server'
import { getAllGeneratedSites, saveGeneratedSite } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sites = getAllGeneratedSites()
    return NextResponse.json({ sites, total: sites.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed fetching sites' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const record = await request.json()
    if (!record || !record.slug) {
      return NextResponse.json({ error: 'Valid site record required' }, { status: 400 })
    }
    const saved = saveGeneratedSite(record)
    return NextResponse.json({ success: true, site: saved })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed saving site' }, { status: 500 })
  }
}
