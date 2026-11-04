'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Eye, Edit3, RefreshCw, Globe, Copy, Check,
  Smartphone, Tablet, Monitor, Sparkles, Loader2, Save, X, ExternalLink
} from 'lucide-react'
import GeneratedWebsiteRenderer from '@/components/GeneratedWebsiteRenderer'
import { GeneratedWebsiteRecord } from '@/lib/storage'

export default function WebsitePreviewPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug

  const [site, setSite] = useState<GeneratedWebsiteRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isEditing, setIsEditing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Edit Form State
  const [editHeadline, setEditHeadline] = useState('')
  const [editTagline, setEditTagline] = useState('')
  const [editSubheadline, setEditSubheadline] = useState('')
  const [editPrimaryColor, setEditPrimaryColor] = useState('')
  const [editPhone, setEditPhone] = useState('')

  useEffect(() => {
    fetchSite()
  }, [slug])

  async function fetchSite() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/generated-sites/${slug}`)
      const data = await res.json()
      if (!res.ok) {
        // Fallback to client-side localStorage backup if serverless instance rotated
        try {
          const cached = localStorage.getItem(`nammaspot_site_${slug}`)
          if (cached) {
            const parsed = JSON.parse(cached)
            setSite(parsed)
            setEditHeadline(parsed.content.heroHeadline)
            setEditTagline(parsed.content.tagline)
            setEditSubheadline(parsed.content.heroSubheadline)
            setEditPrimaryColor(parsed.theme?.colors?.primary || '#1677ff')
            setEditPhone(parsed.phone || '')
            // Background resync to warm up server cache
            fetch('/api/generated-sites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed)
            }).catch(() => {})
            return
          }
        } catch {}
        throw new Error(data.error || 'Failed to load website')
      }
      setSite(data.site)
      try {
        localStorage.setItem(`nammaspot_site_${slug}`, JSON.stringify(data.site))
      } catch {}
      setEditHeadline(data.site.content.heroHeadline)
      setEditTagline(data.site.content.tagline)
      setEditSubheadline(data.site.content.heroSubheadline)
      setEditPrimaryColor(data.site.theme?.colors?.primary || '#1677ff')
      setEditPhone(data.site.phone || '')
    } catch (err: any) {
      setError(err.message || 'Error loading website')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveEdit() {
    if (!site) return
    try {
      const updatedTheme = {
        ...site.theme,
        colors: {
          ...site.theme.colors,
          primary: editPrimaryColor,
          primaryHover: editPrimaryColor
        }
      }
      const updatedContent = {
        ...site.content,
        heroHeadline: editHeadline,
        tagline: editTagline,
        heroSubheadline: editSubheadline
      }

      const res = await fetch(`/api/generated-sites/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: updatedContent,
          theme: updatedTheme,
          phone: editPhone
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setSite(data.site)
      setIsEditing(false)
      showToast('Customizations saved successfully!')
    } catch (err: any) {
      showToast(err.message || 'Error saving changes')
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/generated-sites/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateTheme: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Regeneration failed')
      setSite(data.site)
      setEditPrimaryColor(data.site.theme?.colors?.primary || '#1677ff')
      showToast('Generated fresh design variation!')
    } catch (err: any) {
      showToast(err.message || 'Regeneration error')
    } finally {
      setRegenerating(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/generated-sites/${slug}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publishing failed')
      setSite(data.site)
      showToast('Website published successfully!')
    } catch (err: any) {
      showToast(err.message || 'Publishing error')
    } finally {
      setPublishing(false)
    }
  }

  function handleCopyLink() {
    const publishedUrl = `${window.location.origin}/generated-sites/${slug}`
    navigator.clipboard.writeText(publishedUrl)
    setCopied(true)
    showToast('Copied website link to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fd] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#1677ff] mb-3" />
        <p className="text-sm font-bold text-[#101b50]">Loading website workstation...</p>
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-[#f4f7fd] flex flex-col items-center justify-center p-4">
        <p className="text-base font-bold text-rose-600 mb-4">{error || 'Website not found'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1677ff] text-white rounded-lg text-sm font-bold"
        >
          <ArrowLeft size={16} /> Back to NammaSpot
        </Link>
      </div>
    )
  }

  const isPublished = site.status === 'published'
  const publishedUrl = typeof window !== 'undefined' ? `${window.location.origin}/generated-sites/${slug}` : `/generated-sites/${slug}`

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#101b50] shadow-2xl">
          <Check size={16} className="text-emerald-600" />
          {toast}
        </div>
      )}

      {/* Top Workstation Control Bar */}
      <header className="h-16 bg-[#1e293b] border-b border-slate-700/80 px-4 sm:px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to NammaSpot</span>
          </Link>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <div>
            <span className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs block leading-tight">
              {site.businessName}
            </span>
            <span className="text-[11px] text-slate-400">
              Theme: <span className="text-amber-400 font-bold">{site.theme?.name}</span>
            </span>
          </div>
        </div>

        {/* Device Viewport Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              device === 'desktop' ? 'bg-[#1677ff] text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              device === 'tablet' ? 'bg-[#1677ff] text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              device === 'mobile' ? 'bg-[#1677ff] text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone size={16} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isEditing ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">Edit Content</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold disabled:opacity-50"
            title="Generate alternative visual variation"
          >
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>

          {isPublished ? (
            <div className="flex items-center gap-1.5">
              <a
                href={`/generated-sites/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
              >
                <Globe size={14} />
                <span>Live Site</span>
                <ExternalLink size={12} />
              </a>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                title="Copy Published Link"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              <span>Publish Website</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Responsive Frame Container */}
        <div className="flex-1 overflow-y-auto bg-slate-900/60 p-4 sm:p-6 flex justify-center items-start">
          <div
            className={`transition-all duration-300 w-full shadow-2xl rounded-xl overflow-hidden border border-slate-700 bg-white ${
              device === 'mobile'
                ? 'max-w-[375px]'
                : device === 'tablet'
                ? 'max-w-[768px]'
                : 'max-w-6xl'
            }`}
          >
            <GeneratedWebsiteRenderer site={site} isPreview={true} />
          </div>
        </div>

        {/* Slide-out Edit Drawer */}
        {isEditing && (
          <aside className="w-80 md:w-96 bg-[#1e293b] border-l border-slate-700 p-5 overflow-y-auto z-30 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-amber-400" />
                  Customize Content
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tagline</label>
                <input
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Hero Headline</label>
                <input
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Introduction</label>
                <textarea
                  rows={3}
                  value={editSubheadline}
                  onChange={(e) => setEditSubheadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Primary Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editPrimaryColor}
                    onChange={(e) => setEditPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    value={editPrimaryColor}
                    onChange={(e) => setEditPrimaryColor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Contact Phone</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 081824 03403"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-[#1677ff]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 space-y-2">
              <button
                onClick={handleSaveEdit}
                className="w-full py-2.5 rounded-lg bg-[#1677ff] hover:bg-[#0d66e5] font-bold text-xs text-white flex items-center justify-center gap-2"
              >
                <Save size={14} />
                Save & Update Website
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300"
              >
                Cancel
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
