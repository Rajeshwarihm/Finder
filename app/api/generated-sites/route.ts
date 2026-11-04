import { NextResponse } from 'next/server'
import { getAllGeneratedSites } from '@/lib/storage'

export async function GET() {
  try {
    const sites = getAllGeneratedSites()
    return NextResponse.json({ sites, total: sites.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed fetching sites' }, { status: 500 })
  }
}
