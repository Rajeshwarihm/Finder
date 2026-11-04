'use client'

import React from 'react'
import {
  MapPin, Phone, MessageCircle, ExternalLink, Star, CheckCircle,
  Clock, ShieldCheck, Compass, Sparkles, AlertCircle, Info, ChevronRight,
  Utensils, Coffee, BedDouble, Building2, Trees, Home
} from 'lucide-react'
import { GeneratedWebsiteRecord } from '@/lib/storage'

export default function GeneratedWebsiteRenderer({
  site,
  isPreview = false
}: {
  site: GeneratedWebsiteRecord
  isPreview?: boolean
}) {
  const { theme, content, images, hasRealImages, imageNotice } = site
  const primaryColor = theme?.colors?.primary || '#1677ff'
  const primaryHover = theme?.colors?.primaryHover || '#0d66e5'
  const accentColor = theme?.colors?.accent || '#f59e0b'
  const bgColor = theme?.colors?.background || '#f8fafc'
  const surfaceColor = theme?.colors?.surface || '#ffffff'
  const textPrimary = theme?.colors?.textPrimary || '#0f172a'
  const textSecondary = theme?.colors?.textSecondary || '#475569'
  const borderColor = theme?.colors?.border || '#e2e8f0'

  const heroImage = images?.[0]?.url || ''
  const isSerif = theme?.fontFamily === 'serif'

  return (
    <div
      className={`min-h-screen ${isSerif ? 'font-serif' : 'font-sans'}`}
      style={{ backgroundColor: bgColor, color: textPrimary }}
    >
      {/* Real Photos / Placeholder Transparency Banner */}
      {!hasRealImages && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-xs font-semibold text-amber-900 flex items-center justify-center gap-2">
          <Info size={14} className="shrink-0 text-amber-700" />
          <span>
            {imageNotice || 'Actual business photographs are currently unavailable. Illustrative category visuals are displayed.'}
          </span>
        </div>
      )}

      {/* Navigation Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: `${surfaceColor}ee`,
          borderColor: borderColor
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {site.businessName.charAt(0)}
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block leading-tight">
                {site.businessName}
              </span>
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5"
                style={{
                  backgroundColor: theme?.colors?.badgeBg || '#e0f2fe',
                  color: theme?.colors?.badgeText || '#0369a1'
                }}
              >
                {site.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {site.whatsappUrl && (
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-sm hover:opacity-95"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={16} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <Phone size={15} />
                <span className="hidden md:inline">{site.phone}</span>
                <span className="md:hidden">Call</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      {theme?.layoutStyle === 'hero-split' ? (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
                 style={{ borderColor: borderColor, backgroundColor: surfaceColor }}>
              <Sparkles size={14} style={{ color: accentColor }} />
              <span>{content.tagline}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15]">
              {content.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: textSecondary }}>
              {content.heroSubheadline}
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold" style={{ color: textSecondary }}>
              <span className="flex items-center gap-1.5">
                <MapPin size={16} style={{ color: primaryColor }} />
                {site.location.split(',')[0]}
              </span>
              {site.rating && (
                <span className="flex items-center gap-1.5">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  {site.rating} rating {site.reviewsCount ? `(${site.reviewsCount} reviews)` : ''}
                </span>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {site.whatsappUrl ? (
                <a
                  href={site.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-md hover:scale-[1.02] transition-all"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={18} />
                  Chat on WhatsApp
                </a>
              ) : (
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-md hover:scale-[1.02] transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  {theme?.callToActionLabel || 'Inquire Now'}
                </a>
              )}
              {site.mapsUrl && (
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border hover:bg-black/5 transition-all"
                  style={{ borderColor: borderColor }}
                >
                  <Compass size={18} style={{ color: primaryColor }} />
                  Directions
                </a>
              )}
            </div>
          </div>

          {/* Hero Media Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl border" style={{ borderColor: borderColor }}>
            <img
              src={heroImage}
              alt={site.businessName}
              className="w-full h-[320px] sm:h-[420px] object-cover"
            />
            {images?.[0]?.attribution && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs px-3 py-1.5 text-[11px] text-white/90">
                {images[0].attribution}
              </div>
            )}
          </div>
        </section>
      ) : theme?.layoutStyle === 'hero-centered' ? (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border mx-auto"
               style={{ borderColor: borderColor, backgroundColor: surfaceColor }}>
            <Sparkles size={14} style={{ color: accentColor }} />
            <span>{content.tagline}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {content.heroHeadline}
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: textSecondary }}>
            {content.heroSubheadline}
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-3">
            {site.whatsappUrl && (
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-md hover:scale-[1.02] transition-all"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            )}
            {site.mapsUrl && (
              <a
                href={site.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold border hover:bg-black/5 transition-all"
                style={{ borderColor: borderColor }}
              >
                <Compass size={18} style={{ color: primaryColor }} />
                Get Directions
              </a>
            )}
          </div>

          <div className="pt-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: borderColor }}>
              <img
                src={heroImage}
                alt={site.businessName}
                className="w-full h-[320px] sm:h-[460px] object-cover"
              />
              {images?.[0]?.attribution && (
                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs px-3 py-1.5 text-[11px] text-white/90 text-left">
                  {images[0].attribution}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        /* hero-fullbleed */
        <section className="relative py-20 sm:py-28 overflow-hidden text-white" style={{ backgroundColor: primaryColor }}>
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 space-y-6 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20">
              {content.tagline}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
              {content.heroHeadline}
            </h1>
            <p className="text-base sm:text-xl max-w-2xl mx-auto opacity-90 leading-relaxed">
              {content.heroSubheadline}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {site.whatsappUrl && (
                <a
                  href={site.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-all"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={18} />
                  Chat on WhatsApp
                </a>
              )}
              {site.mapsUrl && (
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all"
                >
                  <Compass size={18} />
                  Google Maps Directions
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT SECTION */}
      <section className="py-16 sm:py-20 border-t" style={{ borderColor: borderColor, backgroundColor: surfaceColor }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div className="md:col-span-1 space-y-3">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md inline-block"
                style={{
                  backgroundColor: theme?.colors?.badgeBg || '#e0f2fe',
                  color: theme?.colors?.badgeText || '#0369a1'
                }}
              >
                Verified Business
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">{content.aboutTitle}</h2>
              <div className="pt-2 text-sm space-y-2" style={{ color: textSecondary }}>
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <span>{site.location}</span>
                </p>
                {site.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={15} className="shrink-0" style={{ color: primaryColor }} />
                    <span>{site.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4 text-base sm:text-lg leading-relaxed" style={{ color: textSecondary }}>
              {content.aboutText.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KEY FEATURES / AMENITIES */}
      {content.features && content.features.length > 0 && (
        <section className="py-16 sm:py-20 border-t" style={{ borderColor: borderColor }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h3 className="text-2xl sm:text-3xl font-black">Why Choose {site.businessName}</h3>
              <p className="mt-2 text-sm sm:text-base" style={{ color: textSecondary }}>
                Verified conveniences and features tailored to your needs.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.features.map((feat, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border transition-all hover:shadow-md"
                  style={{
                    backgroundColor: surfaceColor,
                    borderColor: borderColor
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CheckCircle size={18} />
                  </div>
                  <h4 className="text-lg font-bold mb-2">{feat.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY OFFERINGS SECTION */}
      {content.offerings && content.offerings.length > 0 && (
        <section
          className="py-16 sm:py-20 border-t"
          style={{ borderColor: borderColor, backgroundColor: surfaceColor }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md inline-block mb-2"
                style={{
                  backgroundColor: theme?.colors?.badgeBg || '#e0f2fe',
                  color: theme?.colors?.badgeText || '#0369a1'
                }}
              >
                {theme?.name}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">{content.offeringsTitle}</h3>
              <p className="mt-2 text-sm sm:text-base" style={{ color: textSecondary }}>
                Real options and services offered at this establishment.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {content.offerings.map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {item.badge || 'Verified'}
                      </span>
                      {item.tag && (
                        <span className="text-xs font-semibold" style={{ color: accentColor }}>
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-black mb-2">{item.name}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t" style={{ borderColor: borderColor }}>
                    {site.whatsappUrl ? (
                      <a
                        href={site.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                        style={{ color: '#16a34a' }}
                      >
                        <MessageCircle size={14} /> Inquire via WhatsApp
                      </a>
                    ) : site.phone ? (
                      <a
                        href={`tel:${site.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                        style={{ color: primaryColor }}
                      >
                        <Phone size={14} /> Call for details
                      </a>
                    ) : (
                      <span className="text-xs font-bold" style={{ color: textSecondary }}>
                        Inquire at location
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AMBIENCE / PROPERTY PHOTOGRAPHS */}
      {images && images.length > 0 && (
        <section className="py-16 sm:py-20 border-t" style={{ borderColor: borderColor }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black">Property & Ambience Visuals</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {hasRealImages ? 'Verified photographs of this establishment.' : 'Neutral illustrative visual.'}
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${hasRealImages ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                {hasRealImages ? '✓ Real Business Photos' : 'Illustrative Category Graphic'}
              </span>
            </div>

            <div className={`grid gap-4 ${images.length > 1 ? 'sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
              {images.map((img, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: borderColor }}>
                  <img src={img.url} alt={img.caption} className="w-full h-64 object-cover" />
                  <div className="p-3 bg-white/95 border-t text-xs font-medium flex justify-between items-center" style={{ borderColor: borderColor }}>
                    <span className="truncate">{img.caption}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{img.isRealPhoto ? 'Real Photo' : 'Illustration'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LOCATION & CONTACT SECTION */}
      <section id="contact" className="py-16 sm:py-20 border-t" style={{ borderColor: borderColor, backgroundColor: surfaceColor }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-black">Location & Contact</h3>
            <p className="mt-2 text-sm sm:text-base" style={{ color: textSecondary }}>
              Reach out directly to connect with the management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5 p-6 rounded-2xl border" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</p>
                <p className="mt-1 text-base font-bold text-slate-800">{site.location}</p>
              </div>

              {site.phone && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="mt-1 text-base font-bold text-slate-800">{site.phone}</p>
                </div>
              )}

              {content.contactNotes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Visitor Notice</p>
                  <p className="mt-1 text-sm text-slate-600">{content.contactNotes}</p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-3">
                {site.whatsappUrl && (
                  <a
                    href={site.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white shadow-sm hover:opacity-95"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle size={16} />
                    Chat on WhatsApp
                  </a>
                )}
                {site.phone && (
                  <a
                    href={`tel:${site.phone}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone size={15} />
                    Call Directly
                  </a>
                )}
                {site.mapsUrl && (
                  <a
                    href={site.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold border hover:bg-black/5"
                    style={{ borderColor: borderColor }}
                  >
                    <Compass size={16} style={{ color: primaryColor }} />
                    Open Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Embedded Directions Card */}
            <div className="p-8 rounded-2xl border text-center space-y-4" style={{ borderColor: borderColor, backgroundColor: bgColor }}>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <MapPin size={28} />
              </div>
              <h4 className="text-xl font-black">Plan Your Visit</h4>
              <p className="text-sm" style={{ color: textSecondary }}>
                Direct GPS navigation with turn-by-turn directions via Google Maps.
              </p>
              {site.mapsUrl && (
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white shadow-md hover:scale-[1.01] transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Compass size={18} />
                  Start Navigation
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t text-center text-xs" style={{ borderColor: borderColor, color: textSecondary }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {site.businessName}. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="font-extrabold text-[#1677ff]">NammaSpot</span>
            <span>· Verified Hospitality Network</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
