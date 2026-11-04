export interface WhatsAppLinkResult {
  isValid: boolean
  url?: string
  cleanNumber?: string
  displayNumber?: string
  reason?: string
}

/**
 * Validates and formats a phone number for WhatsApp Click-to-Chat.
 * Removes spaces, brackets, dashes, and normalizes Indian country code 91.
 */
export function formatWhatsAppUrl(
  phone?: string | null,
  businessName?: string,
  customMessage?: string
): WhatsAppLinkResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, reason: 'Phone number not provided' }
  }

  const trimmed = phone.trim()
  if (!trimmed || trimmed === 'Not available' || trimmed === '—') {
    return { isValid: false, reason: 'Phone number unavailable' }
  }

  // Strip all non-digit characters except leading plus
  let cleaned = trimmed.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  }

  // Pure digits only
  cleaned = cleaned.replace(/\D/g, '')

  if (!cleaned || cleaned.length < 8) {
    return { isValid: false, reason: 'Phone number too short' }
  }

  let finalNumber = cleaned

  // Handle Indian phone numbers (10 digits starting with 6, 7, 8, or 9)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    finalNumber = `91${cleaned}`
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // 0 followed by 10 digit Indian number (e.g. 08182403403 or 09845012345)
    finalNumber = `91${cleaned.slice(1)}`
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    finalNumber = cleaned
  }

  const defaultMsg = businessName
    ? `Hello, I found ${businessName} on NammaSpot. I would like to know more about your services and availability.`
    : 'Hello, I found your business on NammaSpot. I would like to know more about your services.'

  const messageText = customMessage || defaultMsg
  const encodedMsg = encodeURIComponent(messageText)

  const url = `https://wa.me/${finalNumber}?text=${encodedMsg}`

  return {
    isValid: true,
    url,
    cleanNumber: finalNumber,
    displayNumber: trimmed
  }
}
