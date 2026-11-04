'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, X, MapPin, Phone, Building2, ExternalLink,
  ShieldCheck, Loader2, CheckCircle2, AlertCircle, Palette
} from 'lucide-react'
import { detectHospitalityCategory, getCategoryTheme } from '@/lib/theme-engine'

export interface ModalBusinessData {
  name: string
  category: string
  location: string
  phone?: string
  mapsUrl?: string
  websiteUrl?: string
  rating?: string
  reviewsCount?: number
  provider?: string
  providerId?: string
  photoReferences?: Array<{ name: string; authorAttributions?: Array<{ displayName?: string }> }>
}

export default function GenerateWebsiteModal({
  business,
  isOpen,
  onClose
}: {
  business: ModalBusinessData | null
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !business) return null

  const catTheme = getCategoryTheme(business.category, business.name)
  const hasPhone = business.phone && business.phone !== 'Not available'
  const hasPhotos = business.photoReferences && business.photoReferences.length > 0

  async function handleConfirmGenerate() {
    if (!business) return
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate website')

      // Redirect to preview workstation
      router.push(data.previewUrl)
    } catch (err: any) {
      setError(err.message || 'Generation failed')
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-[#101b50] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1677ff] text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight">Generate Smart Website</h3>
              <p className="text-xs text-slate-500 font-semibold">Custom AI website for {business.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Information Preview */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Business Info Used</p>
            <div>
              <p className="text-base font-extrabold text-[#101b50]">{business.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {business.category}
                </span>
                {business.rating && business.rating !== '—' && (
                  <span className="text-xs font-bold text-amber-600">
                    ★ {business.rating} {business.reviewsCount ? `(${business.reviewsCount} reviews)` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600 pt-1">
              <p className="flex items-start gap-1.5">
                <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                <span>{business.location}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span>{hasPhone ? business.phone : 'No phone listed (enquiry form will be used)'}</span>
              </p>
            </div>
          </div>

          {/* Theme & Visual Engine Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                <Palette size={14} className="text-indigo-600" />
                <span>Theme Engine</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{catTheme.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Category-specific typography & layout</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Image Status</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                {hasPhotos ? 'Real Property Photos' : 'Neutral Category Visual'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Strict accuracy policy adhered</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1677ff] hover:bg-[#0d66e5] text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all"
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Generating Website...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Generate Website</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
