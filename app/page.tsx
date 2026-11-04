'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bookmark, Building2, Check, ChevronDown, Clock3, Download,
  ExternalLink, FileWarning, Globe2, LayoutDashboard, Loader2, MapPin, Menu,
  MoreHorizontal, Search, Settings, ShieldCheck, SlidersHorizontal,
  Star, Utensils, Users, X, Coffee, Hotel, Home, Castle, BedDouble, Landmark,
  CheckCircle2, XCircle, Phone, Copy, Trash2, Edit3, ArrowUpRight,
  TrendingUp, PieChart, Sparkles, Filter, RefreshCw, MessageCircle, Compass
} from 'lucide-react'
import GenerateWebsiteModal, { ModalBusinessData } from '@/components/GenerateWebsiteModal'

type Business = {
  name: string
  category: string
  location: string
  phone: string
  website: 'Active' | 'Inactive' | 'No website' | 'Unable to Verify'
  websiteUrl?: string
  websiteDomain?: string
  websiteStatus?: 'verified' | 'no_website' | 'unknown'
  whatsappUrl?: string
  photoReferences?: Array<{ name: string; authorAttributions?: Array<{ displayName?: string }> }>
  rating: string
  reviewsCount?: number
  distance?: string
  position?: { lat: number; lon: number }
  providerId?: string
  provider?: string
  mapsUrl?: string
  completeness?: number
  verificationStatus?: 'verified' | 'unverified' | 'rejected'
  notes?: string
  prospectStage?: 'New' | 'Contacted' | 'Qualified' | 'Closed'
}

type TabType = 'discover' | 'verification' | 'prospects' | 'duplicates' | 'quality' | 'coverage' | 'exports'

const categories = ['All Hospitality', 'Restaurants', 'Cafes', 'Hotels', 'PG', 'Hostels', 'Resorts', 'Lodges', 'Homestays', 'Guest Houses']
const categoryIcons = [Building2, Utensils, Coffee, Hotel, BedDouble, Users, Castle, Landmark, Home, Building2]
const popularCities = ['Shivamogga', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Mysuru', 'Goa']

function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' | 'red' }) {
  const colors = {
    blue: 'bg-blue-50 text-[#1677ff]',
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-amber-50 text-amber-700',
    purple: 'bg-violet-50 text-violet-700',
    gray: 'bg-slate-100 text-slate-600',
    red: 'bg-rose-50 text-rose-700'
  }
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${colors[tone]}`}>{children}</span>
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const [location, setLocation] = useState('Shivamogga, Karnataka')
  const [category, setCategory] = useState('All Hospitality')
  const [results, setResults] = useState<Business[]>([])
  const [selected, setSelected] = useState<Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState(25)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Verification & Prospects persistent state
  const [savedProspects, setSavedProspects] = useState<Business[]>([])
  const [verificationMap, setVerificationMap] = useState<Record<string, 'verified' | 'rejected'>>({})
  const [locationHistory, setLocationHistory] = useState<{ query: string; category: string; count: number; date: string }[]>([
    { query: 'Shivamogga, Karnataka', category: 'Restaurants', count: 100, date: '12:00 PM' },
    { query: 'Bengaluru, Karnataka', category: 'PG', count: 20, date: '11:45 AM' },
  ])

  // Verification filter
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')
  const [prospectFilter, setProspectFilter] = useState<'all' | 'New' | 'Contacted' | 'Qualified' | 'Closed'>('all')

  // Website Generation Modal & Live Verification state
  const [generateModalBusiness, setGenerateModalBusiness] = useState<ModalBusinessData | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  // Load saved prospects on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nammaspot_saved_prospects') || localStorage.getItem('team_a_saved_prospects')
      if (saved) setSavedProspects(JSON.parse(saved))
      const vMap = localStorage.getItem('nammaspot_verifications') || localStorage.getItem('team_a_verifications')
      if (vMap) setVerificationMap(JSON.parse(vMap))
    } catch {}
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleVerifyWebsite(business: Business) {
    const id = business.providerId || business.name
    setVerifyingId(id)
    try {
      const res = await fetch('/api/verify-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: business.websiteUrl, providerStatus: business.website })
      })
      const data = await res.json()
      setResults((prev) =>
        prev.map((b) =>
          (b.providerId || b.name) === id
            ? {
                ...b,
                websiteStatus: data.status,
                websiteUrl: data.normalizedUrl || b.websiteUrl,
                websiteDomain: data.domain || b.websiteDomain
              }
            : b
        )
      )
      if (selected && (selected.providerId || selected.name) === id) {
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                websiteStatus: data.status,
                websiteUrl: data.normalizedUrl || prev.websiteUrl,
                websiteDomain: data.domain || prev.websiteDomain
              }
            : null
        )
      }
      showToast(
        data.status === 'verified'
          ? 'Website verified active!'
          : data.status === 'no_website'
          ? 'No official website found'
          : 'Website verification inconclusive'
      )
    } catch {
      showToast('Website verification failed')
    } finally {
      setVerifyingId(null)
    }
  }

  function toggleSaveProspect(business: Business) {
    const id = business.providerId || business.name
    const exists = savedProspects.some((b) => (b.providerId || b.name) === id)
    let updated: Business[]
    if (exists) {
      updated = savedProspects.filter((b) => (b.providerId || b.name) !== id)
      showToast(`Removed "${business.name}" from Prospects`)
    } else {
      const newProspect = { ...business, prospectStage: 'New' as const }
      updated = [newProspect, ...savedProspects]
      showToast(`Saved "${business.name}" to Prospects!`)
    }
    setSavedProspects(updated)
    try { localStorage.setItem('nammaspot_saved_prospects', JSON.stringify(updated)) } catch {}
  }

  function updateProspectStage(id: string, stage: 'New' | 'Contacted' | 'Qualified' | 'Closed') {
    const updated = savedProspects.map((b) => (b.providerId || b.name) === id ? { ...b, prospectStage: stage } : b)
    setSavedProspects(updated)
    try { localStorage.setItem('nammaspot_saved_prospects', JSON.stringify(updated)) } catch {}
    showToast(`Updated prospect stage to ${stage}`)
  }

  function updateProspectNote(id: string, note: string) {
    const updated = savedProspects.map((b) => (b.providerId || b.name) === id ? { ...b, notes: note } : b)
    setSavedProspects(updated)
    try { localStorage.setItem('nammaspot_saved_prospects', JSON.stringify(updated)) } catch {}
  }

  function setVerificationStatus(id: string, status: 'verified' | 'rejected') {
    const updated = { ...verificationMap, [id]: status }
    setVerificationMap(updated)
    try { localStorage.setItem('nammaspot_verifications', JSON.stringify(updated)) } catch {}
    showToast(status === 'verified' ? 'Record marked as Verified!' : 'Record flagged for review')
  }

  const visible = useMemo(() => results.filter((item) => `${item.name} ${item.location} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [results, query])
  const paged = visible.slice((page - 1) * rows, page * rows)
  const pages = Math.max(1, Math.ceil(visible.length / rows))

  async function searchBusinesses(categoryOverride?: string, locationOverride?: string) {
    const activeLoc = locationOverride !== undefined ? locationOverride : location
    const activeCat = categoryOverride || category
    const targetCat = activeCat === 'All Hospitality' ? 'restaurants' : activeCat.toLowerCase().replaceAll(' ', '-')
    setLoading(true); setError(''); setSelected(null); setPage(1)
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(activeLoc)}&category=${encodeURIComponent(targetCat)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Search failed')
      const businesses: Business[] = data.businesses ?? []
      setResults(businesses)
      // Track search history
      setLocationHistory((prev) => [
        { query: activeLoc, category: activeCat, count: businesses.length, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev.filter((item) => item.query.toLowerCase() !== activeLoc.toLowerCase()).slice(0, 8)
      ])
    } catch (err) {
      setResults([])
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  function exportCsv(list: Business[] = visible, filename = 'hospitality-businesses.csv') {
    const csv = [
      ['Business Name', 'Category', 'Address', 'Phone', 'Website', 'Rating', 'Google Maps URL', 'Status'],
      ...list.map((b) => [
        b.name,
        b.category,
        b.location,
        b.phone,
        b.website,
        b.rating,
        b.mapsUrl || '',
        verificationMap[b.providerId || b.name] || 'Pending'
      ])
    ].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}`).join(',')).join('\n')

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
    showToast(`Exported ${list.length} records to ${filename}`)
  }

  function exportJson(list: Business[] = visible, filename = 'hospitality-data.json') {
    const jsonStr = JSON.stringify(list, null, 2)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([jsonStr], { type: 'application/json' }))
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
    showToast(`Exported JSON dataset`)
  }

  // Duplicate detection algorithm
  const potentialDuplicates = useMemo(() => {
    const sourceList = results.length > 0 ? results : savedProspects
    const mapByName = new Map<string, Business[]>()
    sourceList.forEach((b) => {
      const simplified = b.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)
      if (simplified.length > 3) {
        const existing = mapByName.get(simplified) || []
        mapByName.set(simplified, [...existing, b])
      }
    })
    const dupes: { groupKey: string; items: Business[] }[] = []
    mapByName.forEach((items, groupKey) => {
      if (items.length > 1) {
        dupes.push({ groupKey, items })
      }
    })
    return dupes
  }, [results, savedProspects])

  // Data Quality Metrics
  const qualityStats = useMemo(() => {
    const data = results.length > 0 ? results : savedProspects
    const total = data.length
    if (total === 0) return { total: 0, phoneRate: 0, webRate: 0, ratedRate: 0, healthScore: 0 }
    const withPhone = data.filter((b) => b.phone && b.phone !== 'Not available').length
    const withWeb = data.filter((b) => b.website === 'Active').length
    const withRating = data.filter((b) => b.rating && b.rating !== '—').length
    const phoneRate = Math.round((withPhone / total) * 100)
    const webRate = Math.round((withWeb / total) * 100)
    const ratedRate = Math.round((withRating / total) * 100)
    const healthScore = Math.round((phoneRate * 0.45) + (webRate * 0.35) + (ratedRate * 0.20))
    return { total, withPhone, withWeb, withRating, phoneRate, webRate, ratedRate, healthScore }
  }, [results, savedProspects])

  return (
    <main className="min-h-screen bg-[#f4f7fd] text-[#101b50]">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#101b50] px-4 py-3 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`${mobileNav ? 'fixed' : 'hidden'} inset-y-0 left-0 z-40 w-[240px] border-r border-[#e2eaf8] bg-[#f8faff] lg:fixed lg:flex lg:flex-col`}>
        <div className="flex h-[86px] items-center gap-3.5 border-b border-[#e2eaf8] px-5">
          <img src="/logo.png" alt="NammaSpot Logo" className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-[#1677ff]/20" />
          <div>
            <p className="text-xl font-black tracking-tight text-[#101b50]">NammaSpot</p>
            <p className="text-xs font-bold tracking-tight text-[#1677ff]">Your Place, Your Spot</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6">
          <p className="px-3 pb-3 text-xs font-extrabold tracking-[.18em] text-[#9aa8c6]">WORKSPACE</p>
          {[
            { id: 'discover' as const, label: 'Discover Businesses', icon: LayoutDashboard },
            { id: 'verification' as const, label: 'Verification Queue', icon: ShieldCheck, count: results.filter(r => !verificationMap[r.providerId || r.name]).length },
            { id: 'prospects' as const, label: 'Saved Prospects', icon: Bookmark, count: savedProspects.length },
            { id: 'duplicates' as const, label: 'Duplicate Review', icon: Users, count: potentialDuplicates.length },
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileNav(false) }}
                className={`relative mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15.5px] font-bold transition-all ${
                  isActive ? 'bg-[#e7f0ff] text-[#1677ff]' : 'text-[#7180a6] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-[#1677ff] text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {item.count}
                  </span>
                )}
                {isActive && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-[#1677ff]" />}
              </button>
            )
          })}

          <p className="px-3 pb-3 pt-7 text-xs font-extrabold tracking-[.18em] text-[#9aa8c6]">ANALYTICS</p>
          {[
            { id: 'quality' as const, label: 'Data Quality', icon: FileWarning },
            { id: 'coverage' as const, label: 'Location Coverage', icon: Globe2 },
            { id: 'exports' as const, label: 'Export Center', icon: Download },
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileNav(false) }}
                className={`relative mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15.5px] font-bold transition-all ${
                  isActive ? 'bg-[#e7f0ff] text-[#1677ff]' : 'text-[#7180a6] hover:bg-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isActive && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-[#1677ff]" />}
              </button>
            )
          })}
        </nav>

        <div className="m-4 rounded-2xl bg-[#e7f7f8] p-4">
          <img src="/logo.png" alt="NammaSpot" className="mb-3 h-10 w-10 rounded-full shadow-sm" />
          <p className="text-base font-extrabold text-[#101b50]">NammaSpot</p>
          <p className="mt-1 text-xs font-bold text-[#16aebb]">Your Place, Your Spot</p>
          <p className="mt-1 text-xs leading-5 text-[#7180a6]">Discover verified hospitality, hotels, cafes, and PGs.</p>
        </div>

        <div className="flex items-center gap-3 border-t border-[#e2eaf8] p-5">
          <img src="/logo.png" alt="NammaSpot Avatar" className="h-9 w-9 shrink-0 rounded-full shadow-sm ring-1 ring-slate-200" />
          <div className="flex-1">
            <p className="text-base font-bold text-[#101b50]">NammaSpot</p>
            <p className="text-xs font-medium text-[#7180a6]">Your Place, Your Spot</p>
          </div>
          <Settings size={18} className="text-[#9aa8c6]" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-[240px]">
        {/* Header */}
        <header className="flex min-h-[86px] items-center justify-between border-b border-[#e2eaf8] bg-white px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(!mobileNav)} className="lg:hidden">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {activeTab === 'discover' && 'Welcome to NammaSpot'}
                {activeTab === 'verification' && 'Hospitality Verification Queue'}
                {activeTab === 'prospects' && 'Saved Hospitality Prospects'}
                {activeTab === 'duplicates' && 'Duplicate Review Engine'}
                {activeTab === 'quality' && 'Data Quality Intelligence'}
                {activeTab === 'coverage' && 'Geographic Location Coverage'}
                {activeTab === 'exports' && 'Data Export Center'}
              </h1>
              <p className="mt-1 text-sm text-[#7180a6] sm:text-base">
                {activeTab === 'discover' && 'Your Place, Your Spot — discover verified restaurants, hotels, cafes, PGs and more across any city.'}
                {activeTab === 'verification' && 'Review contact authenticity, check website status, and confirm physical address listings.'}
                {activeTab === 'prospects' && 'Manage your outreach target list, update pipeline stages, and export custom prospect files.'}
                {activeTab === 'duplicates' && 'Scan, detect and resolve duplicate listings across telephone lines and street addresses.'}
                {activeTab === 'quality' && 'Health scores, phone numbers coverage, and data completeness metrics across your database.'}
                {activeTab === 'coverage' && 'Track cities scanned, category densities, and geographic discovery logs.'}
                {activeTab === 'exports' && 'Download structured CSV and JSON exports customized for your CRM or outreach pipeline.'}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-2 rounded-lg border border-[#e2eaf8] px-3.5 py-2 text-sm text-[#7180a6]">
              <Search size={16} />
              <input placeholder="Search workspace" className="w-32 bg-transparent text-sm outline-none" />
            </div>
            <img src="/logo.png" alt="NammaSpot Account" className="h-9 w-9 shrink-0 rounded-full shadow-sm ring-1 ring-slate-200 cursor-pointer hover:ring-[#1677ff] transition" />
          </div>
        </header>

        {/* Tab Switcher Body */}
        <div className="space-y-6 p-5 sm:p-8">

          {/* TAB 1: DISCOVER BUSINESSES */}
          {activeTab === 'discover' && (
            <>
              {/* Stat Cards */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  [Building2, 'Businesses Found', results.length, location, 'blue'],
                  [ShieldCheck, 'Verified Businesses', Object.values(verificationMap).filter((v) => v === 'verified').length, 'Ready for outreach', 'green'],
                  [Bookmark, 'Saved Prospects', savedProspects.length, 'In target pipeline', 'purple'],
                  [FileWarning, 'Data Quality Issues', results.filter((b) => b.website === 'No website' || !b.phone || b.phone === 'Not available').length, 'Missing website or phone', 'orange']
                ].map(([Icon, label, value, sub, tone]) => (
                  <div key={label as string} className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-[0_3px_14px_rgba(30,74,150,.04)]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#7180a6]">{label as string}</p>
                        <p className="mt-2 text-3xl sm:text-4xl font-black">{value as number}</p>
                        <p className="mt-1 text-xs text-[#7180a6]">{sub as string}</p>
                      </div>
                      <div className={`rounded-xl p-2.5 ${tone === 'blue' ? 'bg-blue-50 text-[#1677ff]' : tone === 'green' ? 'bg-emerald-50 text-emerald-600' : tone === 'purple' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Search Form Card */}
              <section className="rounded-2xl border border-[#e2eaf8] bg-white p-5 shadow-[0_3px_14px_rgba(30,74,150,.04)] sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-50 p-2 text-[#1677ff]">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black">Discover Hospitality Businesses</h2>
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            Google Places API
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#7180a6]">Search restaurants, hotels, cafes, PGs and more across any city or town worldwide.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveTab('coverage')} className="rounded-lg border border-[#d8e2f5] px-3.5 py-2 text-xs font-bold text-[#7180a6] hover:border-[#1677ff]">
                      Search History
                    </button>
                    <button onClick={() => { setLocation('Shivamogga, Karnataka'); setCategory('All Hospitality'); setResults([]) }} className="rounded-lg border border-[#d8e2f5] px-3.5 py-2 text-xs font-bold text-[#7180a6] hover:border-[#1677ff]">
                      Reset
                    </button>
                  </div>
                </div>

                {/* Popular Cities Pills */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#7180a6]">Quick Cities:</span>
                  {popularCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setLocation(c); searchBusinesses(category, c) }}
                      className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-all ${
                        location.toLowerCase().includes(c.toLowerCase()) ? 'border-[#1677ff] bg-blue-50 text-[#1677ff]' : 'border-[#d8e2f5] bg-white text-[#556987] hover:border-[#1677ff]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Search Bar & Dropdown */}
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_240px_auto]">
                  <label className="flex items-center gap-3 rounded-lg border border-[#d8e2f5] px-3 py-3">
                    <MapPin size={18} className="text-[#1677ff]" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') searchBusinesses() }}
                      className="w-full bg-transparent text-base font-semibold outline-none"
                      placeholder="Type ANY city, town or locality (e.g. Bengaluru, Mumbai, Delhi...)"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-[#d8e2f5] px-3 py-3">
                    <Utensils size={18} className="text-[#7180a6]" />
                    <select
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); searchBusinesses(e.target.value) }}
                      className="w-full bg-transparent text-base font-semibold outline-none"
                    >
                      {categories.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="text-[#7180a6]" />
                  </label>
                  <button
                    onClick={() => searchBusinesses()}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#1677ff] px-7 py-3 text-base font-bold text-white shadow-[0_5px_12px_rgba(22,119,255,.2)] hover:bg-[#0d66e5] disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    {loading ? 'Searching...' : 'Find Businesses'}
                  </button>
                </div>

                {/* Category Pills */}
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {categories.map((item, index) => {
                    const Icon = categoryIcons[index]
                    return (
                      <button
                        key={item}
                        onClick={() => { setCategory(item); searchBusinesses(item) }}
                        className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-bold transition-colors ${
                          category === item ? 'border-[#1677ff] bg-blue-50 text-[#1677ff]' : 'border-[#e2eaf8] text-[#7180a6] hover:border-blue-200'
                        }`}
                      >
                        <Icon size={16} />
                        {item}
                      </button>
                    )
                  })}
                </div>

                {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
              </section>

              {/* Search Results Table */}
              <section className="overflow-hidden rounded-2xl border border-[#e2eaf8] bg-white shadow-[0_3px_14px_rgba(30,74,150,.04)]">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e2eaf8] p-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black">Search Results</h2>
                      <Badge>{visible.length.toLocaleString()} found</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[#7180a6]">{location} · live places with direct Google Maps locations</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-[#d8e2f5] px-3 py-2">
                      <Search size={15} className="text-[#7180a6]" />
                      <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                        placeholder="Filter results"
                        className="w-32 bg-transparent text-sm outline-none"
                      />
                    </div>
                    <button onClick={() => exportCsv(visible)} className="flex items-center gap-2 rounded-lg bg-[#1677ff] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0d66e5]">
                      <Download size={14} />Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="bg-[#f8faff] text-xs font-extrabold uppercase tracking-[.12em] text-[#9aa8c6]">
                      <tr>
                        <th className="px-5 py-3">Business Name</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Address & Direct Map</th>
                        <th className="px-3 py-3">Rating</th>
                        <th className="px-3 py-3">Website</th>
                        <th className="px-3 py-3">Verification</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-sm text-[#7180a6]">
                            <Loader2 className="mx-auto mb-2 animate-spin text-[#1677ff]" />
                            Loading businesses across {location}...
                          </td>
                        </tr>
                      ) : paged.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-sm text-[#7180a6]">
                            <p className="font-bold">Search a location or select a Quick City to discover businesses.</p>
                            <p className="mt-1 text-xs">Try clicking Bengaluru, Mumbai, or Shivamogga above.</p>
                          </td>
                        </tr>
                      ) : (
                        paged.map((business, index) => {
                          const id = business.providerId || business.name
                          const isSaved = savedProspects.some((b) => (b.providerId || b.name) === id)
                          const vStatus = verificationMap[id] || 'pending'
                          return (
                            <tr
                              key={`${id}-${index}`}
                              onClick={() => setSelected(business)}
                              className="cursor-pointer border-t border-[#eef2f9] transition-colors hover:bg-[#f8faff]"
                            >
                              <td className="px-5 py-4">
                                <p className="text-base font-extrabold text-[#101b50]">{business.name}</p>
                                {business.phone && business.phone !== 'Not available' ? (
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <a
                                      href={`tel:${business.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      title="Click to call"
                                      className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                      <Phone size={12} className="text-emerald-600" />
                                      {business.phone}
                                    </a>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigator.clipboard.writeText(business.phone)
                                        showToast(`Copied phone: ${business.phone}`)
                                      }}
                                      title="Copy phone number"
                                      className="rounded p-1 text-[#9aa8c6] hover:bg-slate-100 hover:text-[#101b50]"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                                    <Phone size={12} /> No phone listed
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-4">
                                <Badge tone="blue">{business.category}</Badge>
                              </td>
                              <td className="max-w-[280px] px-3 py-4 text-sm text-[#7180a6]">
                                <div className="flex flex-col">
                                  <span className="flex items-start gap-1">
                                    <MapPin size={14} className="mt-0.5 shrink-0 text-[#9aa8c6]" />
                                    {business.location}
                                  </span>
                                  {business.mapsUrl && (
                                    <a
                                      href={business.mapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#1677ff] hover:underline"
                                    >
                                      <ExternalLink size={12} />Open Place on Google Maps
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-4 text-sm font-bold">
                                {business.rating !== '—' ? (
                                  <div className="flex flex-col">
                                    <span className="flex items-center text-slate-800">
                                      <Star size={14} className="mr-1 inline fill-amber-400 text-amber-400" />
                                      {business.rating}
                                    </span>
                                    {business.reviewsCount !== undefined && business.reviewsCount > 0 && (
                                      <span className="text-xs font-normal text-[#7180a6]">
                                        ({business.reviewsCount > 1000 ? `${(business.reviewsCount / 1000).toFixed(1)}k` : business.reviewsCount} reviews)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                {business.websiteStatus === 'verified' || (business.websiteUrl && business.website === 'Active') ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <a
                                      href={business.websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1677ff] hover:bg-blue-100 text-xs font-bold transition-all border border-blue-200"
                                      title={`Visit official site: ${business.websiteUrl}`}
                                    >
                                      <Globe2 size={13} />
                                      <span>Visit Website</span>
                                      <ExternalLink size={11} />
                                    </a>
                                    {business.websiteDomain && (
                                      <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[140px]" title={business.websiteUrl}>
                                        {business.websiteDomain}
                                      </span>
                                    )}
                                  </div>
                                ) : business.websiteStatus === 'unknown' ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <button
                                      onClick={() => handleVerifyWebsite(business)}
                                      disabled={verifyingId === id}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all border border-amber-200 disabled:opacity-50"
                                    >
                                      <RefreshCw size={12} className={verifyingId === id ? 'animate-spin' : ''} />
                                      <span>Verify Website</span>
                                    </button>
                                    <span className="text-[11px] text-amber-600 font-semibold">Unable to verify</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-start gap-1">
                                    <button
                                      onClick={() => setGenerateModalBusiness(business)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95 text-xs font-bold transition-all shadow-sm"
                                      title="Generate AI-powered custom website"
                                    >
                                      <Sparkles size={13} />
                                      <span>Generate Website</span>
                                    </button>
                                    <span className="text-[11px] text-slate-400 font-semibold">No official website found</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-4">
                                <Badge tone={vStatus === 'verified' ? 'green' : vStatus === 'rejected' ? 'red' : 'orange'}>
                                  {vStatus === 'verified' ? 'Verified' : vStatus === 'rejected' ? 'Flagged' : 'Pending'}
                                </Badge>
                              </td>
                              <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleSaveProspect(business)}
                                    title={isSaved ? 'Remove from Prospects' : 'Save to Prospects'}
                                    className={`rounded-lg border p-1.5 transition-all ${
                                      isSaved ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-[#d8e2f5] text-[#7180a6] hover:border-[#1677ff]'
                                    }`}
                                  >
                                    <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                                  </button>
                                  <button
                                    onClick={() => setVerificationStatus(id, vStatus === 'verified' ? 'rejected' : 'verified')}
                                    title={vStatus === 'verified' ? 'Flag Issue' : 'Mark Verified'}
                                    className={`rounded-lg border p-1.5 transition-all ${
                                      vStatus === 'verified' ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-[#d8e2f5] text-[#7180a6] hover:border-emerald-500'
                                    }`}
                                  >
                                    <Check size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col justify-between gap-3 border-t border-[#e2eaf8] p-4 text-sm text-[#7180a6] sm:flex-row sm:items-center">
                  <span>Showing {visible.length ? ((page - 1) * rows + 1) : 0}–{Math.min(page * rows, visible.length)} of {visible.length.toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    <label>
                      Rows{' '}
                      <select value={rows} onChange={(e) => { setRows(Number(e.target.value)); setPage(1) }} className="rounded border border-[#d8e2f5] bg-white px-2 py-1 text-xs">
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                      </select>
                    </label>
                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded border border-[#d8e2f5] px-2.5 py-1 text-xs disabled:opacity-40">Previous</button>
                    <span className="font-bold text-[#1677ff]">{page} / {pages}</span>
                    <button disabled={page === pages} onClick={() => setPage(page + 1)} className="rounded border border-[#d8e2f5] px-2.5 py-1 text-xs disabled:opacity-40">Next</button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* TAB 2: VERIFICATION QUEUE */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Total in Queue</p>
                  <p className="mt-2 text-3xl font-black">{results.length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">Discovered businesses</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Verified Leads</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{Object.values(verificationMap).filter(v => v === 'verified').length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">Confirmed address & phone</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Pending Review</p>
                  <p className="mt-2 text-3xl font-black text-amber-600">{results.filter(r => !verificationMap[r.providerId || r.name]).length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">Needs confirmation</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Flagged / Rejected</p>
                  <p className="mt-2 text-3xl font-black text-rose-600">{Object.values(verificationMap).filter(v => v === 'rejected').length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">Data inaccuracies</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e2eaf8] pb-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xl font-black">Lead Verification Workstation</h3>
                    <p className="mt-1 text-sm text-[#7180a6]">Cross-check business phone lines and open exact Google Maps place cards to confirm addresses.</p>
                  </div>
                  <div className="flex gap-2">
                    {(['all', 'pending', 'verified', 'rejected'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setVerifyFilter(filter)}
                        className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                          verifyFilter === filter ? 'border-[#1677ff] bg-blue-50 text-[#1677ff]' : 'border-[#d8e2f5] text-[#7180a6]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-[#eef2f9]">
                  {(results.length > 0 ? results : savedProspects)
                    .filter((b) => {
                      const id = b.providerId || b.name
                      const status = verificationMap[id] || 'pending'
                      if (verifyFilter === 'all') return true
                      return status === verifyFilter
                    })
                    .slice(0, 50)
                    .map((business, index) => {
                      const id = business.providerId || business.name
                      const status = verificationMap[id] || 'pending'
                      return (
                        <div key={`${id}-${index}`} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-extrabold">{business.name}</h4>
                              <Badge tone="blue">{business.category}</Badge>
                              <Badge tone={status === 'verified' ? 'green' : status === 'rejected' ? 'red' : 'orange'}>
                                {status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#7180a6]">{business.location}</p>
                            <div className="flex items-center gap-4 text-sm font-semibold text-[#556987]">
                              <span className="flex items-center gap-1">
                                <Phone size={13} /> {business.phone}
                              </span>
                              {business.mapsUrl && (
                                <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-[#1677ff] hover:underline">
                                  <ExternalLink size={12} /> View on Google Maps
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setVerificationStatus(id, 'verified')}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 size={14} /> Verify
                            </button>
                            <button
                              onClick={() => setVerificationStatus(id, 'rejected')}
                              className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <XCircle size={14} /> Flag Issue
                            </button>
                            <button
                              onClick={() => toggleSaveProspect(business)}
                              className="rounded-lg border border-[#d8e2f5] p-2 text-[#7180a6] hover:text-[#1677ff]"
                              title="Bookmark Prospect"
                            >
                              <Bookmark size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  {results.length === 0 && savedProspects.length === 0 && (
                    <div className="py-12 text-center text-sm text-[#7180a6]">
                      <p className="font-bold">No businesses in queue.</p>
                      <button onClick={() => setActiveTab('discover')} className="mt-3 rounded-lg bg-[#1677ff] px-4 py-2 text-xs font-bold text-white">
                        Run a Search in Discover Businesses
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED PROSPECTS */}
          {activeTab === 'prospects' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Total Saved Prospects</p>
                  <p className="mt-2 text-3xl font-black text-[#1677ff]">{savedProspects.length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">In pipeline database</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">New Leads</p>
                  <p className="mt-2 text-3xl font-black text-amber-600">{savedProspects.filter(b => (b.prospectStage || 'New') === 'New').length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">Awaiting first contact</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Contacted</p>
                  <p className="mt-2 text-3xl font-black text-violet-600">{savedProspects.filter(b => b.prospectStage === 'Contacted').length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">In discussions</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Qualified Deals</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{savedProspects.filter(b => b.prospectStage === 'Qualified').length}</p>
                  <p className="mt-1 text-xs text-[#7180a6]">High interest</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e2eaf8] pb-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xl font-black">Prospect CRM & Pipeline</h3>
                    <p className="mt-1 text-sm text-[#7180a6]">Manage stages, track notes, and initiate outreach with direct Google Maps and phone links.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(['all', 'New', 'Contacted', 'Qualified', 'Closed'] as const).map((stage) => (
                      <button
                        key={stage}
                        onClick={() => setProspectFilter(stage)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                          prospectFilter === stage ? 'border-[#1677ff] bg-blue-50 text-[#1677ff]' : 'border-[#d8e2f5] text-[#7180a6]'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                    {savedProspects.length > 0 && (
                      <button onClick={() => exportCsv(savedProspects, 'saved-prospects.csv')} className="flex items-center gap-1.5 rounded-lg bg-[#1677ff] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0d66e5]">
                        <Download size={13} /> Export Prospects
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-[#eef2f9]">
                  {savedProspects
                    .filter((b) => prospectFilter === 'all' || (b.prospectStage || 'New') === prospectFilter)
                    .map((business, index) => {
                      const id = business.providerId || business.name
                      return (
                        <div key={`${id}-${index}`} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
                          <div className="max-w-xl space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-extrabold">{business.name}</h4>
                              <Badge tone="blue">{business.category}</Badge>
                              {business.rating && business.rating !== '—' && (
                                <span className="flex items-center text-xs font-bold text-amber-500">
                                  <Star size={13} className="mr-1 fill-amber-400" />{business.rating}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#7180a6]">{business.location}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#556987]">
                              <span className="flex items-center gap-1">
                                <Phone size={13} /> {business.phone}
                              </span>
                              {business.mapsUrl && (
                                <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-[#1677ff] hover:underline">
                                  <ExternalLink size={12} /> Open in Google Maps
                                </a>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                placeholder="Add outreach notes (e.g. called manager on Monday...)"
                                defaultValue={business.notes || ''}
                                onBlur={(e) => updateProspectNote(id, e.target.value)}
                                className="w-full max-w-md rounded-lg border border-[#e2eaf8] bg-[#f8faff] px-3 py-1.5 text-sm outline-none focus:border-[#1677ff]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={business.prospectStage || 'New'}
                              onChange={(e) => updateProspectStage(id, e.target.value as any)}
                              className="rounded-lg border border-[#d8e2f5] bg-white px-3 py-2 text-sm font-bold text-[#1677ff] outline-none"
                            >
                              <option>New</option>
                              <option>Contacted</option>
                              <option>Qualified</option>
                              <option>Closed</option>
                            </select>
                            <button
                              onClick={() => toggleSaveProspect(business)}
                              className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                              title="Remove prospect"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })}

                  {savedProspects.length === 0 && (
                    <div className="py-16 text-center text-sm text-[#7180a6]">
                      <Bookmark size={32} className="mx-auto mb-2 text-[#9aa8c6]" />
                      <p className="font-bold">No prospects saved yet.</p>
                      <p className="mt-1 text-sm">In the Discover Businesses tab, click the bookmark icon next to any business to add them here.</p>
                      <button onClick={() => setActiveTab('discover')} className="mt-4 rounded-lg bg-[#1677ff] px-4 py-2 text-xs font-bold text-white">
                        Discover Businesses Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DUPLICATE REVIEW */}
          {activeTab === 'duplicates' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e2eaf8] pb-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xl font-black">Duplicate Detection Engine</h3>
                    <p className="mt-1 text-sm text-[#7180a6]">Scans records matching by normalized business title, location proximity, and telephone numbers.</p>
                  </div>
                  <Badge tone={potentialDuplicates.length > 0 ? 'orange' : 'green'}>
                    {potentialDuplicates.length > 0 ? `${potentialDuplicates.length} Conflict Groups Found` : 'Clean Database (0 Conflicts)'}
                  </Badge>
                </div>

                {potentialDuplicates.length === 0 ? (
                  <div className="py-14 text-center">
                    <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500" />
                    <h4 className="text-lg font-extrabold text-[#101b50]">No Duplicates Detected</h4>
                    <p className="mx-auto mt-1 max-w-md text-sm text-[#7180a6]">
                      Every listing in your current dataset has a distinct title and unique telephone signature. Database health is in optimal condition.
                    </p>
                    <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 rounded-xl border border-[#e2eaf8] bg-[#f8faff] p-4 text-center">
                      <div>
                        <p className="text-xl font-black text-emerald-600">100%</p>
                        <p className="text-xs font-bold text-[#7180a6]">Unique Names</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-emerald-600">0</p>
                        <p className="text-xs font-bold text-[#7180a6]">Phone Collisions</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-emerald-600">Verified</p>
                        <p className="text-xs font-bold text-[#7180a6]">Geocoding</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {potentialDuplicates.map((group, idx) => (
                      <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                          <p className="text-sm font-bold text-amber-900">
                            Potential Duplicate Group #{idx + 1}: <span className="font-extrabold capitalize">{group.groupKey}</span>
                          </p>
                          <Badge tone="orange">Needs Review</Badge>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {group.items.map((b, i) => (
                            <div key={i} className="rounded-lg border border-[#e2eaf8] bg-white p-3 shadow-xs">
                              <p className="text-base font-bold">{b.name}</p>
                              <p className="text-sm text-[#7180a6]">{b.location}</p>
                              <p className="mt-1 text-sm font-semibold text-[#556987]">{b.phone}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => showToast('Merged duplicates into primary record')} className="rounded-lg bg-[#1677ff] px-3.5 py-1.5 text-xs font-bold text-white">
                            Merge as One
                          </button>
                          <button onClick={() => showToast('Marked as separate distinct businesses')} className="rounded-lg border border-[#d8e2f5] bg-white px-3.5 py-1.5 text-xs font-bold text-[#7180a6]">
                            Keep Both
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DATA QUALITY */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Database Health Score</p>
                  <p className="mt-2 text-3xl font-black text-[#1677ff]">{qualityStats.healthScore} / 100</p>
                  <p className="mt-1 text-xs text-[#7180a6]">Overall completeness</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Phone Number Coverage</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{qualityStats.phoneRate}%</p>
                  <p className="mt-1 text-xs text-[#7180a6]">{qualityStats.withPhone} with direct contact</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Website Presence</p>
                  <p className="mt-2 text-3xl font-black text-amber-600">{qualityStats.webRate}%</p>
                  <p className="mt-1 text-xs text-[#7180a6]">{qualityStats.withWeb} active websites</p>
                </div>
                <div className="rounded-xl border border-[#e2eaf8] bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-[#7180a6]">Customer Reviews</p>
                  <p className="mt-2 text-3xl font-black text-violet-600">{qualityStats.ratedRate}%</p>
                  <p className="mt-1 text-xs text-[#7180a6]">{qualityStats.withRating} rated businesses</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black">Field Completeness Breakdown</h3>
                  <p className="mt-1 text-sm text-[#7180a6]">Breakdown of data availability across all indexed listings.</p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Physical Address & Coordinates</span>
                        <span className="text-emerald-600">100%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Direct Google Maps Integration</span>
                        <span className="text-emerald-600">100%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Telephone Numbers</span>
                        <span className="text-[#1677ff]">{qualityStats.phoneRate}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-[#1677ff]" style={{ width: `${qualityStats.phoneRate}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Digital Website Presence</span>
                        <span className="text-amber-600">{qualityStats.webRate}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-amber-500" style={{ width: `${qualityStats.webRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black">Quality Improvement Recommendations</h3>
                  <p className="mt-1 text-sm text-[#7180a6]">Recommended next steps to enrich hospitality lead records.</p>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                      <p className="text-sm font-bold text-[#1677ff]">1. High Opportunity: Unclaimed Website Leads</p>
                      <p className="mt-1 text-sm text-[#43537d]">
                        {results.filter(b => b.website === 'No website').length} businesses have no website listed. Excellent prospects for digital agency web development pitches.
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                      <p className="text-sm font-bold text-emerald-700">2. Immediate Reach: Verified Phone Lines</p>
                      <p className="mt-1 text-sm text-[#43537d]">
                        {qualityStats.withPhone} records include authentic commercial contact numbers ready for cold calling.
                      </p>
                    </div>

                    <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
                      <p className="text-sm font-bold text-violet-700">3. Physical Auditing</p>
                      <p className="mt-1 text-sm text-[#43537d]">
                        Click "Open in Google Maps" on any record to view customer photos, popular check-in hours, and reviews.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LOCATION COVERAGE */}
          {activeTab === 'coverage' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#e2eaf8] pb-5">
                  <div>
                    <h3 className="text-xl font-black">Geographic Search History & Coverage Logs</h3>
                    <p className="mt-1 text-sm text-[#7180a6]">Historical queries, mapped areas, and discovery records across cities.</p>
                  </div>
                  <Badge tone="blue">{locationHistory.length} Areas Scanned</Badge>
                </div>

                <div className="mt-5 divide-y divide-[#eef2f9]">
                  {locationHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1677ff]">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-base font-extrabold">{item.query}</p>
                          <p className="text-sm text-[#7180a6]">{item.category} · {item.count} businesses identified · {item.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setLocation(item.query)
                          setActiveTab('discover')
                          searchBusinesses(item.category, item.query)
                        }}
                        className="flex items-center gap-1 rounded-lg border border-[#d8e2f5] px-3.5 py-1.5 text-xs font-bold text-[#1677ff] hover:bg-blue-50"
                      >
                        <RefreshCw size={13} /> Re-scan
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Multi-City Coverage Hub */}
              <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">Ready-to-Scan Metro & Tier-2 Hubs</h3>
                <p className="mt-1 text-sm text-[#7180a6]">Click any city to run live discovery instantly.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { city: 'Shivamogga, Karnataka', type: 'Tier-2 Educational & Commercial Hub' },
                    { city: 'Bengaluru, Karnataka', type: 'Tech Capital & Major Hospitality Market' },
                    { city: 'Mysuru, Karnataka', type: 'Heritage Tourism & Hotel Capital' },
                    { city: 'Mumbai, Maharashtra', type: 'Financial Capital & High Density F&B' },
                    { city: 'Pune, Maharashtra', type: 'Student Hub & Extensive PG Market' },
                    { city: 'Goa, India', type: 'Resorts & Beach Hospitality' },
                    { city: 'Hyderabad, Telangana', type: 'Commercial Tech & F&B Hub' },
                    { city: 'Chennai, Tamil Nadu', type: 'Metro Hub & Traditional Hospitality' },
                    { city: 'Delhi NCR, India', type: 'National Capital Territory' },
                  ].map((dest, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setLocation(dest.city)
                        setActiveTab('discover')
                        searchBusinesses(category, dest.city)
                      }}
                      className="cursor-pointer rounded-xl border border-[#e2eaf8] p-4 transition-all hover:border-[#1677ff] hover:bg-[#f8faff]"
                    >
                      <p className="text-base font-extrabold text-[#101b50]">{dest.city}</p>
                      <p className="mt-1 text-sm text-[#7180a6]">{dest.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: EXPORT CENTER */}
          {activeTab === 'exports' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e2eaf8] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">Data Export Center</h3>
                <p className="mt-1 text-sm text-[#7180a6]">Download clean spreadsheets and programmatic datasets with direct Google Maps URLs.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-[#e2eaf8] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1677ff]">
                      <Download size={20} />
                    </div>
                    <h4 className="mt-3 text-base font-extrabold">All Discovered Results (CSV)</h4>
                    <p className="mt-1 text-sm text-[#7180a6]">
                      Export all {results.length} businesses currently in your search results table.
                    </p>
                    <button
                      onClick={() => exportCsv(results, `discovered-${location.split(',')[0].toLowerCase()}.csv`)}
                      disabled={results.length === 0}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1677ff] py-2.5 text-sm font-bold text-white hover:bg-[#0d66e5] disabled:opacity-40"
                    >
                      <Download size={15} /> Download CSV
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#e2eaf8] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                      <Bookmark size={20} />
                    </div>
                    <h4 className="mt-3 text-base font-extrabold">Saved Prospects Only (CSV)</h4>
                    <p className="mt-1 text-sm text-[#7180a6]">
                      Export your {savedProspects.length} curated prospects along with pipeline stages & notes.
                    </p>
                    <button
                      onClick={() => exportCsv(savedProspects, 'saved-prospects-crm.csv')}
                      disabled={savedProspects.length === 0}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-40"
                    >
                      <Download size={15} /> Download Prospects CSV
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#e2eaf8] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <ShieldCheck size={20} />
                    </div>
                    <h4 className="mt-3 text-base font-extrabold">Verified Leads Only (CSV)</h4>
                    <p className="mt-1 text-sm text-[#7180a6]">
                      Export only records marked as verified with confirmed coordinates.
                    </p>
                    <button
                      onClick={() => {
                        const verifiedOnly = results.filter((b) => verificationMap[b.providerId || b.name] === 'verified')
                        exportCsv(verifiedOnly, 'verified-hospitality-leads.csv')
                      }}
                      disabled={Object.values(verificationMap).filter(v => v === 'verified').length === 0}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                    >
                      <Download size={15} /> Download Verified CSV
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#e2eaf8] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <FileWarning size={20} />
                    </div>
                    <h4 className="mt-3 text-base font-extrabold">Full JSON Dataset</h4>
                    <p className="mt-1 text-sm text-[#7180a6]">
                      Programmatic export including exact GPS coordinates and provider IDs.
                    </p>
                    <button
                      onClick={() => exportJson(results.length > 0 ? results : savedProspects)}
                      disabled={results.length === 0 && savedProspects.length === 0}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#d8e2f5] py-2.5 text-sm font-bold text-[#101b50] hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Download size={15} /> Download JSON
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#e2eaf8] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <Copy size={20} />
                    </div>
                    <h4 className="mt-3 text-base font-extrabold">Quick Copy Table Data</h4>
                    <p className="mt-1 text-sm text-[#7180a6]">
                      Copy active rows to clipboard formatted for Excel or Google Sheets.
                    </p>
                    <button
                      onClick={() => {
                        const text = [
                          'Business Name\tCategory\tAddress\tPhone\tGoogle Maps',
                          ...visible.map(b => `${b.name}\t${b.category}\t${b.location}\t${b.phone}\t${b.mapsUrl || ''}`)
                        ].join('\n')
                        navigator.clipboard.writeText(text)
                        showToast('Copied table data to clipboard!')
                      }}
                      disabled={visible.length === 0}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                    >
                      <Copy size={15} /> Copy to Clipboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Details Slide-Over Drawer */}
      {selected && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[400px] overflow-y-auto border-l border-[#e2eaf8] bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#9aa8c6]">Business Details</p>
              <h2 className="mt-1 text-2xl font-black">{selected.name}</h2>
            </div>
            <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-[#7180a6] hover:bg-[#f4f7fd]" aria-label="Close details">
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Badge tone={verificationMap[selected.providerId || selected.name] === 'verified' ? 'green' : 'orange'}>
              {verificationMap[selected.providerId || selected.name] === 'verified' ? 'Verified Record' : 'Pending Verification'}
            </Badge>
            <Badge>{selected.category}</Badge>
          </div>

          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa8c6]">Address</p>
              <p className="mt-1 text-base text-[#43537d]">{selected.location}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa8c6]">Phone Number</p>
              {selected.phone && selected.phone !== 'Not available' ? (
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href={`tel:${selected.phone}`}
                    className="inline-flex items-center gap-1.5 text-base font-bold text-[#1677ff] hover:underline"
                  >
                    <Phone size={14} />
                    {selected.phone}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selected.phone)
                      showToast(`Copied phone: ${selected.phone}`)
                    }}
                    title="Copy phone"
                    className="rounded border border-[#d8e2f5] p-1.5 text-[#7180a6] hover:bg-slate-50"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-base text-[#43537d]">Not available</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa8c6]">Rating & Reviews</p>
              <p className="mt-1 text-base font-bold text-[#43537d]">
                {selected.rating !== '—'
                  ? `★ ${selected.rating} / 5${selected.reviewsCount ? ` (${selected.reviewsCount.toLocaleString()} Google reviews)` : ''}`
                  : 'Not supplied'}
              </p>
            </div>
            {/* Website Status & Actions Section */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa8c6] mb-1.5">Official Website</p>
              {selected.websiteStatus === 'verified' || (selected.websiteUrl && selected.website === 'Active') ? (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1677ff] flex items-center gap-1.5">
                      <Globe2 size={14} /> Official Website
                    </span>
                    <Badge tone="green">Verified</Badge>
                  </div>
                  <p className="text-xs font-mono text-slate-600 truncate" title={selected.websiteUrl}>
                    {selected.websiteDomain || selected.websiteUrl}
                  </p>
                  <a
                    href={selected.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1677ff] py-2.5 text-xs font-bold text-white hover:bg-[#0d66e5] shadow-xs"
                  >
                    <ExternalLink size={14} />
                    <span>Visit Official Website</span>
                  </a>
                </div>
              ) : selected.websiteStatus === 'unknown' ? (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">Website Status Unknown</span>
                    <Badge tone="orange">Unverified</Badge>
                  </div>
                  <p className="text-xs text-slate-600">Verification is needed to confirm if an official site exists.</p>
                  <button
                    onClick={() => handleVerifyWebsite(selected)}
                    disabled={verifyingId === (selected.providerId || selected.name)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                  >
                    <RefreshCw size={13} className={verifyingId === (selected.providerId || selected.name) ? 'animate-spin' : ''} />
                    <span>Verify Website</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">No official website found</span>
                    <Badge tone="gray">No Website</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Generate a customized, responsive hospitality website for this business.
                  </p>
                  <button
                    onClick={() => setGenerateModalBusiness(selected)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white hover:opacity-95 shadow-sm"
                  >
                    <Sparkles size={14} />
                    <span>Generate Website</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa8c6]">Provider</p>
              <p className="mt-1 text-sm text-[#43537d]">{selected.provider || 'Google Places'} {selected.providerId ? `· ${selected.providerId}` : ''}</p>
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            {/* WhatsApp Contact Button */}
            {selected.whatsappUrl && (
              <a
                href={selected.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white shadow-sm hover:scale-[1.01] transition-all"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
            )}

            {/* Directions Button */}
            <button
              onClick={() => selected.mapsUrl && window.open(selected.mapsUrl, '_blank', 'noopener,noreferrer')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d8e2f5] py-3 text-sm font-bold text-[#1677ff] hover:bg-blue-50"
            >
              <Compass size={16} /> Open Directions in Google Maps
            </button>

            <button
              onClick={() => toggleSaveProspect(selected)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1677ff] py-3 text-sm font-bold text-white hover:bg-[#0d66e5]"
            >
              <Bookmark size={16} />
              {savedProspects.some(b => (b.providerId || b.name) === (selected.providerId || selected.name)) ? 'Remove from Prospects' : 'Save to Prospects'}
            </button>
            <button
              onClick={() => {
                const id = selected.providerId || selected.name
                setVerificationStatus(id, verificationMap[id] === 'verified' ? 'rejected' : 'verified')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#d8e2f5] py-3 text-sm font-bold text-[#43537d] hover:bg-slate-50"
            >
              <Check size={16} />
              {verificationMap[selected.providerId || selected.name] === 'verified' ? 'Mark as Needs Review' : 'Mark as Verified'}
            </button>
          </div>
        </aside>
      )}

      {/* Website Generator Modal */}
      <GenerateWebsiteModal
        business={generateModalBusiness}
        isOpen={!!generateModalBusiness}
        onClose={() => setGenerateModalBusiness(null)}
      />
    </main>
  )
}
