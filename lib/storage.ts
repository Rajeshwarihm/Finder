import fs from 'fs'
import path from 'path'
import os from 'os'
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

// 1. Static seed file included in the repository / deployment
const SEED_DATA_DIR = path.join(process.cwd(), 'data')
const SEED_SITES_FILE = path.join(SEED_DATA_DIR, 'generated-sites.json')

// 2. Writable temporary storage path for serverless (Vercel / AWS Lambda)
const TMP_DATA_DIR = path.join(os.tmpdir(), 'nammaspot-data')
const TMP_SITES_FILE = path.join(TMP_DATA_DIR, 'generated-sites.json')

// Detect if running on Vercel or similar read-only serverless environment
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  (process.env.NODE_ENV === 'production' && !process.env.LOCAL_DEV)
)

// Global in-memory cache to guarantee sites persist during warm lambda container lifecycles
declare global {
  var __nammaspot_sites_cache__: GeneratedWebsiteRecord[] | undefined
}

/**
 * Initializes and retrieves generated sites from:
 * 1. Global in-memory cache
 * 2. Writable /tmp storage (for sites generated during serverless sessions)
 * 3. Seed repository data/generated-sites.json
 */
export function getAllGeneratedSites(): GeneratedWebsiteRecord[] {
  // If memory cache exists and has data, return it
  if (globalThis.__nammaspot_sites_cache__ && Array.isArray(globalThis.__nammaspot_sites_cache__)) {
    if (globalThis.__nammaspot_sites_cache__.length > 0) {
      return globalThis.__nammaspot_sites_cache__
    }
  }

  let sites: GeneratedWebsiteRecord[] = []

  // Check /tmp first (contains any runtime writes in serverless)
  if (fs.existsSync(TMP_SITES_FILE)) {
    try {
      const raw = fs.readFileSync(TMP_SITES_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        sites = parsed
      }
    } catch (err) {
      console.warn('[storage] Could not read from TMP_SITES_FILE:', err)
    }
  }

  // If nothing from TMP, read from bundled SEED file
  if (sites.length === 0 && fs.existsSync(SEED_SITES_FILE)) {
    try {
      const raw = fs.readFileSync(SEED_SITES_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        sites = parsed
      }
    } catch (err) {
      console.warn('[storage] Could not read from SEED_SITES_FILE:', err)
    }
  }

  globalThis.__nammaspot_sites_cache__ = sites
  return sites
}

/**
 * Persists the sites array to:
 * 1. Global in-memory cache (instant & guaranteed non-throwing)
 * 2. Serverless /tmp writable directory (on Vercel/Lambda)
 * 3. Local data/ directory (when running locally)
 * Never throws EROFS or filesystem exceptions.
 */
function persistSites(sites: GeneratedWebsiteRecord[]): void {
  // 1. Update memory cache immediately
  globalThis.__nammaspot_sites_cache__ = sites

  // 2. Decide write targets
  // On serverless, always write to TMP first to prevent EROFS
  const targets = IS_SERVERLESS
    ? [
        { dir: TMP_DATA_DIR, file: TMP_SITES_FILE }
      ]
    : [
        { dir: SEED_DATA_DIR, file: SEED_SITES_FILE },
        { dir: TMP_DATA_DIR, file: TMP_SITES_FILE }
      ]

  for (const { dir, file } of targets) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(file, JSON.stringify(sites, null, 2), 'utf-8')
      return // Success!
    } catch (err: any) {
      console.warn(`[storage] Write to ${file} failed: ${err.message}. Trying next fallback.`)
    }
  }

  // Fallback: If not in serverless mode but writing to SEED failed (e.g. permission issues), write to TMP
  if (!IS_SERVERLESS) {
    try {
      if (!fs.existsSync(TMP_DATA_DIR)) {
        fs.mkdirSync(TMP_DATA_DIR, { recursive: true })
      }
      fs.writeFileSync(TMP_SITES_FILE, JSON.stringify(sites, null, 2), 'utf-8')
    } catch (fallbackErr: any) {
      console.warn('[storage] Fallback TMP write also failed, record preserved safely in memory:', fallbackErr.message)
    }
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
  const sites = [...getAllGeneratedSites()]
  const index = sites.findIndex((s) => s.id === record.id || s.slug === record.slug)

  if (index >= 0) {
    sites[index] = { ...record, updatedAt: new Date().toISOString() }
  } else {
    sites.unshift(record)
  }

  persistSites(sites)
  return record
}

export function updateGeneratedSite(
  slug: string,
  partial: Partial<GeneratedWebsiteRecord>
): GeneratedWebsiteRecord | null {
  const sites = [...getAllGeneratedSites()]
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
  persistSites(sites)
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
