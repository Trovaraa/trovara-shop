/** Public customer order bot username (no @). Set via VITE_TELEGRAM_CUSTOMER_BOT. */
export const TELEGRAM_CUSTOMER_BOT = (import.meta.env.VITE_TELEGRAM_CUSTOMER_BOT ?? '')
  .trim()
  .replace(/^@/, '')

export const TELEGRAM_ORDER_URL = TELEGRAM_CUSTOMER_BOT
  ? `https://t.me/${TELEGRAM_CUSTOMER_BOT}`
  : ''
