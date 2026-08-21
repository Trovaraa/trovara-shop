export const PHONE = '2348031350724'

export function buildWhatsAppLink(message?: string): string {
  const trimmedMessage = message?.trim()
  return trimmedMessage
    ? `https://wa.me/${PHONE}?text=${encodeURIComponent(trimmedMessage)}`
    : `https://wa.me/${PHONE}`
}
