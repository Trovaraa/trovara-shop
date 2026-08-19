export const PHONE = '2348103693426'

export function buildWhatsAppLink(message?: string): string {
  const trimmedMessage = message?.trim()
  return trimmedMessage
    ? `https://wa.me/${PHONE}?text=${encodeURIComponent(trimmedMessage)}`
    : `https://wa.me/${PHONE}`
}
