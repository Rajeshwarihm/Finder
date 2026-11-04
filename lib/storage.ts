import fs from 'fs'
import path from 'path'
import { CategoryTheme } from './theme-engine'
import { BusinessImage } from './image-service'

export interface GeneratedWebsiteRecord {
  id: string
  slug: string
  businessName: string
  category: string
  location: string
  phone?: string
  whatsappUrl?: string
  mapsUrl?: string
  websiteUrl?: string
  rating?: string
  reviewsCount?: number
  provider?: string
  providerId?: string
  theme: CategoryTheme
  content: {
    heroHeadline: string
    heroSubheadline: string
    tagline: string
    aboutTitle: string
    aboutText: string[]
    features: Array<{ title: string; description: string; icon?: string }>
    offeringsTitle: string
    offerings: Array<{ name: string; description: string; tag?: string; badge?: string }>
    openingHours?: string
    contactNotes?: string
  }
  images: BusinessImage[]
  hasRealImages: boolean
  imageNotice?: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const SITES_FILE = path.join(DATA_DIR, 'generated-sites.json')

function ensureStorageFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(SITES_FILE)) {
      fs.writeFileSync(SITES_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
  } catch (err) {
    console.error('Error ensuring storage file:', err)
  }
}

export function getAllGeneratedSites(): GeneratedWebsiteRecord[] {
  ensureStorageFile()
  try {
    const raw = fs.readFileSync(SITES_FILE, 'utf-8')
    return JSON.parse(raw) as GeneratedWebsiteRecord[]
  } catch (err) {
    console.error('Failed reading generated sites:', err)
    return []
  }
}

export function getGeneratedSiteBySlug(slug: string): GeneratedWebsiteRecord | null {
  const sites = getAllGeneratedSites()
  return sites.find((s) => s.slug.toLowerCase() === slug.toLowerCase()) || null
}

export function getGeneratedSiteById(id: string): GeneratedWebsiteRecord | null {
  const sites = getAllGeneratedSites()
  return sites.find((s) => s.id === id) || null
}

export function saveGeneratedSite(record: GeneratedWebsiteRecord): GeneratedWebsiteRecord {
  ensureStorageFile()
  const sites = getAllGeneratedSites()
  const index = sites.findIndex((s) => s.id === record.id || s.slug === record.slug)

  if (index >= 0) {
    sites[index] = { ...record, updatedAt: new Date().toISOString() }
  } else {
    sites.unshift(record)
  }

  fs.writeFileSync(SITES_FILE, JSON.stringify(sites, null, 2), 'utf-8')
  return record
}

export function updateGeneratedSite(
  slug: string,
  partial: Partial<GeneratedWebsiteRecord>
): GeneratedWebsiteRecord | null {
  ensureStorageFile()
  const sites = getAllGeneratedSites()
  const index = sites.findIndex((s) => s.slug.toLowerCase() === slug.toLowerCase())

  if (index === -1) return null

  const existing = sites[index]
  const updated: GeneratedWebsiteRecord = {
    ...existing,
    ...partial,
    content: {
      ...existing.content,
      ...(partial.content || {})
    },
    theme: {
      ...existing.theme,
      ...(partial.theme || {})
    },
    updatedAt: new Date().toISOString()
  }

  sites[index] = updated
  fs.writeFileSync(SITES_FILE, JSON.stringify(sites, null, 2), 'utf-8')
  return updated
}

export function publishGeneratedSite(slug: string): GeneratedWebsiteRecord | null {
  return updateGeneratedSite(slug, {
    status: 'published',
    publishedAt: new Date().toISOString()
  })
}

/**
 * Creates a unique, URL-safe slug combining business name and a location/id hash
 * ensuring two businesses with the same name in different areas don't overwrite.
 */
export function generateUniqueSlug(businessName: string, location: string, providerId?: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30) || 'spot'

  // Hash location & providerId
  const rawHash = `${location}-${providerId || ''}`
  let hashVal = 0
  for (let i = 0; i < rawHash.length; i++) {
    hashVal = (hashVal * 31 + rawHash.charCodeAt(i)) >>> 0
  }
  const hashStr = hashVal.toString(36).slice(0, 5)

  return `${base}-${hashStr}`
}
