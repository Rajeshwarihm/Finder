import { detectHospitalityCategory, HospitalityCategory } from './theme-engine'

export interface WebsiteGeneratedContent {
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
  modelUsed?: string
  generationType: 'ai' | 'curated-fallback'
}

const SUPPORTED_GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
]

/**
 * Builds verified prompt instructions for Gemini AI.
 * Strict rules prevent fabricating facts.
 */
function buildGeminiPrompt(business: {
  name: string
  category: string
  location: string
  phone?: string
  rating?: string
  reviewsCount?: number
  businessStatus?: string
}) {
  const cat = detectHospitalityCategory(business.category)

  return `You are a professional website copywriter and hospitality brand consultant.
Generate engaging, authentic, and high-converting website content for the following business.

VERIFIED BUSINESS DETAILS:
- Business Name: "${business.name}"
- Category: "${business.category}" (Hospitality Category: ${cat})
- Address / Location: "${business.location}"
- Contact Phone: "${business.phone || 'Not available'}"
- Rating: "${business.rating || 'Not supplied'}" (${business.reviewsCount || 0} reviews)

CRITICAL INSTRUCTIONS & ACCURACY RULES:
1. ONLY use the verified information above.
2. DO NOT invent fake prices (e.g. ₹499, ₹12,000/month), fake room numbers, or fake star ratings.
3. DO NOT fabricate opening hours or fake customer reviews.
4. If category is "restaurant" or "cafe", highlight culinary hospitality, ambience, and fresh dining. Mention vegetarian options if appropriate for Indian dining context, but do not invent exact menu prices.
5. If category is "pg", write for students and working professionals looking for convenient, safe, and homely PG accommodation with verified location and owner contact.
6. If category is "hotel", write for travellers seeking comfortable, reliable stays with modern amenities and convenient location.
7. If category is "resort", highlight scenic relaxation, weekend getaways, and nature.
8. If category is "hostel", highlight community, backpacker friendliness, and budget convenience.
9. If category is "lodge" or "homestay", highlight local warmth, prime location, and comfortable rooms.

You MUST reply with ONLY a valid, raw JSON object (no markdown, no backticks, no code block) with the following structure:
{
  "tagline": "Short compelling 4-8 word tagline",
  "heroHeadline": "Impactful hero headline",
  "heroSubheadline": "2-sentence welcoming introduction featuring ${business.name} in ${business.location.split(',')[0]}",
  "aboutTitle": "About ${business.name}",
  "aboutText": [
    "First paragraph about the establishment and its presence in the locality.",
    "Second paragraph about guest experience, comfort, and service commitment."
  ],
  "features": [
    { "title": "Feature 1", "description": "Authentic description based on category" },
    { "title": "Feature 2", "description": "Authentic description based on category" },
    { "title": "Feature 3", "description": "Authentic description based on category" },
    { "title": "Feature 4", "description": "Authentic description based on category" }
  ],
  "offeringsTitle": "Section title (e.g. 'Featured Specialities' or 'Room Sharing Options' or 'Accommodations')",
  "offerings": [
    { "name": "Item/Room/Service 1", "description": "Description without fake prices", "tag": "Popular", "badge": "Verified" },
    { "name": "Item/Room/Service 2", "description": "Description without fake prices", "tag": "Recommended", "badge": "Verified" },
    { "name": "Item/Room/Service 3", "description": "Description without fake prices", "tag": "Available", "badge": "Verified" }
  ],
  "contactNotes": "Conveniently located at ${business.location}. Contact directly for bookings and enquiries."
}`
}

/**
 * Robust, category-specific curated fallback generator when Gemini API is unavailable,
 * unconfigured, or rate-limited. Ensures the app NEVER crashes or fails generation.
 */
function generateCuratedFallback(business: {
  name: string
  category: string
  location: string
  phone?: string
  rating?: string
}): WebsiteGeneratedContent {
  const cat = detectHospitalityCategory(business.category)
  const city = business.location.split(',')[0].trim() || 'the city'

  switch (cat) {
    case 'restaurant':
      return {
        tagline: `Authentic Flavours & Warm Dining in ${city}`,
        heroHeadline: `Welcome to ${business.name}`,
        heroSubheadline: `Experience fresh ingredients, masterfully crafted dishes, and genuine hospitality in the heart of ${city}.`,
        aboutTitle: `About ${business.name}`,
        aboutText: [
          `${business.name} is a premier dining destination in ${city}, dedicated to bringing delicious flavours and memorable meal experiences to food lovers.`,
          `Whether you are joining us for a family gathering, quick lunch, or evening dinner, our kitchen takes pride in wholesome preparations and attentive service.`
        ],
        features: [
          { title: 'Fresh Daily Preparation', description: 'Quality ingredients sourced fresh to craft authentic, flavourful dishes.' },
          { title: 'Family Friendly Ambience', description: 'Clean, comfortable, and inviting atmosphere for all occasions.' },
          { title: 'Convenient Location', description: `Easily accessible in ${business.location} with direct Google Maps navigation.` },
          { title: 'Direct WhatsApp Orders', description: 'Reach out directly for table reservations and takeaway inquiries.' }
        ],
        offeringsTitle: 'Dining Specialities & Food Highlights',
        offerings: [
          { name: 'Signature House Specialities', description: 'Handcrafted favourites prepared with our unique house recipes.', tag: 'Must Try', badge: 'Chef Special' },
          { name: 'Traditional Regional Delicacies', description: 'Classic regional recipes celebrated for authentic taste and aroma.', tag: 'Authentic', badge: 'Popular' },
          { name: 'Refreshing Beverages & Sides', description: 'Pair your meal with a range of refreshing drinks and accompaniments.', tag: 'Fresh', badge: 'Daily' }
        ],
        contactNotes: `Located at ${business.location}. Call or chat on WhatsApp for reservations and enquiries.`,
        generationType: 'curated-fallback'
      }

    case 'pg':
      return {
        tagline: `Safe, Comfortable & Homely PG Living in ${city}`,
        heroHeadline: `${business.name} PG Residence`,
        heroSubheadline: `Affordable and fully managed paying guest accommodation for students and working professionals in ${city}.`,
        aboutTitle: `About ${business.name}`,
        aboutText: [
          `${business.name} offers well-maintained accommodation in a prime location of ${city}. Designed to give residents a hassle-free and peaceful stay.`,
          `With essential amenities, hygienic surroundings, and proximity to key transit points, it is the ideal home away from home.`
        ],
        features: [
          { title: 'Prime Connectivity', description: `Situated at ${business.location} close to offices, colleges, and transit hubs.` },
          { title: 'Hygienic Living Spaces', description: 'Well-ventilated rooms with regular cleaning and maintenance.' },
          { title: 'Essential Amenities', description: 'High-speed Wi-Fi, 24/7 water supply, and security arrangements.' },
          { title: 'Direct Owner Contact', description: 'No broker fee. Inquire directly with the management over WhatsApp or phone.' }
        ],
        offeringsTitle: 'Available Sharing Configurations & Living Spaces',
        offerings: [
          { name: 'Single Occupancy Room', description: 'Private room with dedicated wardrobe, study space, and ventilation.', tag: 'Private', badge: 'Available' },
          { name: 'Double Sharing Room', description: 'Spacious shared room with separate beds and storage for both residents.', tag: 'Popular', badge: 'Available' },
          { name: 'Triple Sharing Room', description: 'Budget-friendly shared accommodation with all standard PG amenities included.', tag: 'Value', badge: 'Available' }
        ],
        contactNotes: `Located at ${business.location}. Check room availability and schedule a visit directly on WhatsApp.`,
        generationType: 'curated-fallback'
      }

    case 'cafe':
      return {
        tagline: `Artisan Coffee, Fresh Bakes & Chill Vibes in ${city}`,
        heroHeadline: `Your Favourite Neighbourhood Cafe – ${business.name}`,
        heroSubheadline: `A relaxed space in ${city} for handcrafted brews, delicious quick bites, and great conversations.`,
        aboutTitle: `Welcome to ${business.name}`,
        aboutText: [
          `${business.name} is designed as a welcoming sanctuary for coffee lovers, remote workers, and friends gathering for good times in ${city}.`,
          `From rich espresso blends to freshly prepared snacks, we craft every order with passion and quality in a cosy, aesthetic setting.`
        ],
        features: [
          { title: 'Speciality Brews', description: 'Carefully extracted coffees and signature iced beverages.' },
          { title: 'Cosy Ambience', description: 'Comfortable seating, pleasant lighting, and a relaxing vibe.' },
          { title: 'Quick Bites & Desserts', description: 'Fresh savouries and sweet treats to complement your drinks.' },
          { title: 'Centrally Located', description: `Conveniently situated at ${business.location}.` }
        ],
        offeringsTitle: 'Featured Brews & Cafe Delights',
        offerings: [
          { name: 'Espresso & Handcrafted Coffees', description: 'Rich, aromatic coffee brewed from premium beans.', tag: 'Bestseller', badge: 'Fresh' },
          { name: 'Coolers & Artisan Teas', description: 'Refreshing iced teas, mojitos, and comforting milk teas.', tag: 'Cool', badge: 'Popular' },
          { name: 'Cafe Bites & Desserts', description: 'Crisp snacks, grilled sandwiches, and sweet treats.', tag: 'Snacks', badge: 'Delicious' }
        ],
        contactNotes: `Visit us at ${business.location} or connect over WhatsApp for menu inquiries and takeaway.`,
        generationType: 'curated-fallback'
      }

    case 'hotel':
      return {
        tagline: `Refined Hospitality & Comfort in ${city}`,
        heroHeadline: `${business.name}`,
        heroSubheadline: `Enjoy superior comfort, attentive service, and well-appointed rooms in ${city}.`,
        aboutTitle: `About ${business.name}`,
        aboutText: [
          `${business.name} welcomes business and leisure travellers with modern amenities and warm Indian hospitality in ${city}.`,
          `Our dedicated team is committed to ensuring every guest experiences a peaceful, restful, and hassle-free stay.`
        ],
        features: [
          { title: 'Prime Location', description: `Conveniently located at ${business.location} with easy city transit access.` },
          { title: 'Well-Appointed Rooms', description: 'Comfortable bedding, air conditioning, and clean en-suite bathrooms.' },
          { title: 'Attentive Front Desk', description: 'Responsive staff to assist with your stay and local city guidance.' },
          { title: 'Verified Direct Inquiries', description: 'Book or inquire directly without intermediary markups.' }
        ],
        offeringsTitle: 'Guest Room Categories & Amenities',
        offerings: [
          { name: 'Deluxe Guest Room', description: 'Comfortable double bed with modern amenities for business and solo travellers.', tag: 'Standard', badge: 'Popular' },
          { name: 'Executive Suite', description: 'Spacious accommodation with seating area and premium hospitality perks.', tag: 'Premium', badge: 'Recommended' },
          { name: 'Family Room', description: 'Generously sized room suited for families and small groups visiting the city.', tag: 'Spacious', badge: 'Family Choice' }
        ],
        contactNotes: `Situated at ${business.location}. Reach out via phone or WhatsApp for corporate or group stay bookings.`,
        generationType: 'curated-fallback'
      }

    default:
      return {
        tagline: `Premium Hospitality Experience in ${city}`,
        heroHeadline: `Welcome to ${business.name}`,
        heroSubheadline: `Your trusted destination for warm hospitality, dependable quality, and comfortable service in ${city}.`,
        aboutTitle: `About ${business.name}`,
        aboutText: [
          `${business.name} proudly serves guests in ${city} with commitment to quality, comfort, and attentive service.`,
          `We strive to provide each guest with a memorable experience whether you are visiting for leisure, business, or everyday dining.`
        ],
        features: [
          { title: 'Prime City Location', description: `Easily accessible at ${business.location}.` },
          { title: 'Quality & Cleanliness', description: 'Maintained to high standards for guest satisfaction.' },
          { title: 'Responsive Support', description: 'Direct contact via WhatsApp and phone for bookings.' },
          { title: 'Verified Spot', description: 'Listed and verified on NammaSpot hospitality network.' }
        ],
        offeringsTitle: 'Services & Key Highlights',
        offerings: [
          { name: 'Standard Hospitality Package', description: 'Everything you need for a comfortable and pleasant experience.', tag: 'Featured', badge: 'Verified' },
          { name: 'Special Group Bookings', description: 'Accommodations and services tailored for group visits.', tag: 'Groups', badge: 'Available' }
        ],
        contactNotes: `Located at ${business.location}. Call or chat on WhatsApp for reservations and enquiries.`,
        generationType: 'curated-fallback'
      }
  }
}

/**
 * Main AI Generation function using Gemini with intelligent cascading models and fallback.
 */
export async function generateWebsiteContentWithGemini(business: {
  name: string
  category: string
  location: string
  phone?: string
  rating?: string
  reviewsCount?: number
  businessStatus?: string
}): Promise<WebsiteGeneratedContent> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured in .env.local; using high-quality curated generator')
    return generateCuratedFallback(business)
  }

  const prompt = buildGeminiPrompt(business)

  // Try supported models in sequence
  for (const model of SUPPORTED_GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      })
      clearTimeout(timer)

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          try {
            const parsed = JSON.parse(text)
            return {
              heroHeadline: parsed.heroHeadline || `Welcome to ${business.name}`,
              heroSubheadline: parsed.heroSubheadline || `Serving quality experiences in ${business.location}.`,
              tagline: parsed.tagline || 'Your Place, Your Spot',
              aboutTitle: parsed.aboutTitle || `About ${business.name}`,
              aboutText: Array.isArray(parsed.aboutText) ? parsed.aboutText : [parsed.aboutText || ''],
              features: Array.isArray(parsed.features) ? parsed.features : [],
              offeringsTitle: parsed.offeringsTitle || 'Key Highlights',
              offerings: Array.isArray(parsed.offerings) ? parsed.offerings : [],
              contactNotes: parsed.contactNotes || `Visit us at ${business.location}.`,
              modelUsed: model,
              generationType: 'ai'
            }
          } catch (parseErr) {
            console.warn(`JSON parse error on ${model} output:`, parseErr)
          }
        }
      } else {
        const errBody = await response.text()
        console.warn(`Gemini model ${model} returned ${response.status}:`, errBody.slice(0, 150))
      }
    } catch (modelErr: any) {
      console.warn(`Gemini attempt on ${model} failed:`, modelErr.message)
    }
  }

  // Graceful fallback if Gemini API is disabled, unavailable, or rate limited
  return generateCuratedFallback(business)
}
