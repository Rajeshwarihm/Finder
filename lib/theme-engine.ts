export type HospitalityCategory =
  | 'restaurant'
  | 'pg'
  | 'cafe'
  | 'hotel'
  | 'hostel'
  | 'resort'
  | 'lodge'
  | 'homestay'
  | 'guest_house'
  | 'other'

export interface ThemeColors {
  primary: string
  primaryHover: string
  secondary: string
  accent: string
  background: string
  surface: string
  textPrimary: string
  textSecondary: string
  border: string
  badgeBg: string
  badgeText: string
}

export interface CategoryTheme {
  category: HospitalityCategory
  name: string
  tagline: string
  colors: ThemeColors
  layoutStyle: 'hero-split' | 'hero-centered' | 'hero-fullbleed'
  fontFamily: string
  callToActionLabel: string
  secondaryActionLabel: string
  offeringsSectionTitle: string
  offeringsType: 'menu' | 'rooms' | 'amenities' | 'packages' | 'services'
}

export function detectHospitalityCategory(categoryStr: string): HospitalityCategory {
  const c = categoryStr.toLowerCase()
  if (c.includes('pg') || c.includes('paying guest')) return 'pg'
  if (c.includes('restaurant') || c.includes('dining') || c.includes('food')) return 'restaurant'
  if (c.includes('cafe') || c.includes('coffee') || c.includes('bakery')) return 'cafe'
  if (c.includes('resort')) return 'resort'
  if (c.includes('hostel')) return 'hostel'
  if (c.includes('homestay') || c.includes('estate stay')) return 'homestay'
  if (c.includes('lodge') || c.includes('lodging')) return 'lodge'
  if (c.includes('guest house') || c.includes('guest-house')) return 'guest_house'
  if (c.includes('hotel') || c.includes('inn') || c.includes('palace') || c.includes('suites')) return 'hotel'
  return 'other'
}

/**
 * Returns a customized, category-appropriate theme.
 * Uses a seed (e.g. business name) to introduce subtle unique color and layout variations
 * so two restaurants or two hotels do not look identical.
 */
export function getCategoryTheme(categoryStr: string, seed: string = ''): CategoryTheme {
  const category = detectHospitalityCategory(categoryStr)

  // Variation index based on seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 3
  }

  switch (category) {
    case 'restaurant': {
      const variations = [
        { primary: '#b91c1c', primaryHover: '#991b1b', accent: '#f59e0b', bg: '#fffdfa', layout: 'hero-split' as const },
        { primary: '#c2410c', primaryHover: '#9a3412', accent: '#d97706', bg: '#fefce8', layout: 'hero-centered' as const },
        { primary: '#881337', primaryHover: '#4c0519', accent: '#e11d48', bg: '#fffbfb', layout: 'hero-fullbleed' as const }
      ]
      const v = variations[hash]
      return {
        category: 'restaurant',
        name: 'Gourmet Dining Experience',
        tagline: 'Fresh Flavours & Authentic Hospitality',
        colors: {
          primary: v.primary,
          primaryHover: v.primaryHover,
          secondary: '#78350f',
          accent: v.accent,
          background: v.bg,
          surface: '#ffffff',
          textPrimary: '#1c1917',
          textSecondary: '#57534e',
          border: '#fed7aa',
          badgeBg: '#ffedd5',
          badgeText: '#9a3412'
        },
        layoutStyle: v.layout,
        fontFamily: 'serif',
        callToActionLabel: 'Book a Table / Inquire',
        secondaryActionLabel: 'Explore Menu',
        offeringsSectionTitle: 'Chef’s Specialities & Menu Highlights',
        offeringsType: 'menu'
      }
    }

    case 'pg': {
      const variations = [
        { primary: '#0284c7', primaryHover: '#0369a1', accent: '#0d9488', bg: '#f0f9ff', layout: 'hero-centered' as const },
        { primary: '#0d9488', primaryHover: '#0f766e', accent: '#0284c7', bg: '#f0fdfa', layout: 'hero-split' as const },
        { primary: '#2563eb', primaryHover: '#1d4ed8', accent: '#059669', bg: '#eff6ff', layout: 'hero-split' as const }
      ]
      const v = variations[hash]
      return {
        category: 'pg',
        name: 'Modern PG & Co-Living Residence',
        tagline: 'Comfortable, Secure & Homely Living for Students & Professionals',
        colors: {
          primary: v.primary,
          primaryHover: v.primaryHover,
          secondary: '#0f766e',
          accent: v.accent,
          background: v.bg,
          surface: '#ffffff',
          textPrimary: '#0f172a',
          textSecondary: '#475569',
          border: '#e2e8f0',
          badgeBg: '#e0f2fe',
          badgeText: '#0369a1'
        },
        layoutStyle: v.layout,
        fontFamily: 'sans-serif',
        callToActionLabel: 'Check Room Availability',
        secondaryActionLabel: 'View House Amenities',
        offeringsSectionTitle: 'Room Sharing Options & Amenities',
        offeringsType: 'rooms'
      }
    }

    case 'cafe': {
      const variations = [
        { primary: '#78350f', primaryHover: '#451a03', accent: '#d97706', bg: '#fefce8', layout: 'hero-split' as const },
        { primary: '#451a03', primaryHover: '#270e02', accent: '#65a30d', bg: '#fffbeb', layout: 'hero-centered' as const },
        { primary: '#854d0e', primaryHover: '#713f12', accent: '#b45309', bg: '#fefdfa', layout: 'hero-fullbleed' as const }
      ]
      const v = variations[hash]
      return {
        category: 'cafe',
        name: 'Artisan Cafe & Coffee Lounge',
        tagline: 'Brewed to Perfection, Crafted for Conversations',
        colors: {
          primary: v.primary,
          primaryHover: v.primaryHover,
          secondary: '#a16207',
          accent: v.accent,
          background: v.bg,
          surface: '#ffffff',
          textPrimary: '#292524',
          textSecondary: '#57534e',
          border: '#fde68a',
          badgeBg: '#fef3c7',
          badgeText: '#92400e'
        },
        layoutStyle: v.layout,
        fontFamily: 'sans-serif',
        callToActionLabel: 'Order / Reserve Seat',
        secondaryActionLabel: 'View Brews & Bites',
        offeringsSectionTitle: 'Artisan Brews, Bakes & Bites',
        offeringsType: 'menu'
      }
    }

    case 'hotel': {
      const variations = [
        { primary: '#0f172a', primaryHover: '#1e293b', accent: '#d97706', bg: '#f8fafc', layout: 'hero-fullbleed' as const },
        { primary: '#1e1b4b', primaryHover: '#312e81', accent: '#ca8a04', bg: '#fafaf9', layout: 'hero-split' as const },
        { primary: '#111827', primaryHover: '#1f2937', accent: '#eab308', bg: '#ffffff', layout: 'hero-centered' as const }
      ]
      const v = variations[hash]
      return {
        category: 'hotel',
        name: 'Luxury Stay & Suites',
        tagline: 'Exceptional Comfort, Flawless Service & Refined Elegance',
        colors: {
          primary: v.primary,
          primaryHover: v.primaryHover,
          secondary: '#334155',
          accent: v.accent,
          background: v.bg,
          surface: '#ffffff',
          textPrimary: '#0f172a',
          textSecondary: '#475569',
          border: '#e2e8f0',
          badgeBg: '#fef3c7',
          badgeText: '#854d0e'
        },
        layoutStyle: v.layout,
        fontFamily: 'serif',
        callToActionLabel: 'Inquire for Booking',
        secondaryActionLabel: 'Explore Suites & Rooms',
        offeringsSectionTitle: 'Accommodations & Guest Amenities',
        offeringsType: 'rooms'
      }
    }

    case 'hostel': {
      return {
        category: 'hostel',
        name: 'Vibrant Community Hostel',
        tagline: 'Meet Travellers, Explore the City & Stay on Budget',
        colors: {
          primary: '#ea580c',
          primaryHover: '#c2410c',
          secondary: '#0284c7',
          accent: '#10b981',
          background: '#fff7ed',
          surface: '#ffffff',
          textPrimary: '#1e293b',
          textSecondary: '#64748b',
          border: '#fed7aa',
          badgeBg: '#ffedd5',
          badgeText: '#c2410c'
        },
        layoutStyle: 'hero-split',
        fontFamily: 'sans-serif',
        callToActionLabel: 'Book a Bed / Inquire',
        secondaryActionLabel: 'Hostel Amenities',
        offeringsSectionTitle: 'Dorm & Private Room Options',
        offeringsType: 'rooms'
      }
    }

    case 'resort': {
      return {
        category: 'resort',
        name: 'Nature Retreat & Luxury Resort',
        tagline: 'Unwind in Nature, Rejuvenate Your Senses',
        colors: {
          primary: '#14532d',
          primaryHover: '#166534',
          secondary: '#15803d',
          accent: '#d97706',
          background: '#f0fdf4',
          surface: '#ffffff',
          textPrimary: '#052e16',
          textSecondary: '#166534',
          border: '#bbf7d0',
          badgeBg: '#dcfce7',
          badgeText: '#15803d'
        },
        layoutStyle: 'hero-fullbleed',
        fontFamily: 'serif',
        callToActionLabel: 'Plan Your Getaway',
        secondaryActionLabel: 'Resort Activities',
        offeringsSectionTitle: 'Villas, Cottages & Experiences',
        offeringsType: 'packages'
      }
    }

    case 'lodge':
    case 'homestay':
    case 'guest_house': {
      return {
        category,
        name: category === 'homestay' ? 'Cozy Heritage Homestay' : 'Comfortable Local Lodge',
        tagline: 'Warm Hospitality, Clean Comfort & Heartfelt Welcome',
        colors: {
          primary: '#78350f',
          primaryHover: '#451a03',
          secondary: '#b45309',
          accent: '#059669',
          background: '#fffbeb',
          surface: '#ffffff',
          textPrimary: '#292524',
          textSecondary: '#57534e',
          border: '#fde68a',
          badgeBg: '#fef3c7',
          badgeText: '#78350f'
        },
        layoutStyle: 'hero-split',
        fontFamily: 'serif',
        callToActionLabel: 'Check Room Rates & Availability',
        secondaryActionLabel: 'Explore Facilities',
        offeringsSectionTitle: 'Guest Rooms & Hospitality Services',
        offeringsType: 'rooms'
      }
    }

    default: {
      return {
        category: 'other',
        name: 'Premium Hospitality Establishment',
        tagline: 'Dedicated to Quality, Comfort & Memorable Experiences',
        colors: {
          primary: '#1e3a8a',
          primaryHover: '#1e40af',
          secondary: '#0369a1',
          accent: '#d97706',
          background: '#f8fafc',
          surface: '#ffffff',
          textPrimary: '#0f172a',
          textSecondary: '#475569',
          border: '#cbd5e1',
          badgeBg: '#e0f2fe',
          badgeText: '#0369a1'
        },
        layoutStyle: 'hero-split',
        fontFamily: 'sans-serif',
        callToActionLabel: 'Inquire Now',
        secondaryActionLabel: 'View Services',
        offeringsSectionTitle: 'Our Services & Facilities',
        offeringsType: 'services'
      }
    }
  }
}
