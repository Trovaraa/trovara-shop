/**
 * Shop API on the Accounts host is same-origin `/shop`
 * (Vite/nginx proxy → trovara-api).
 */
const SHOP_API_BASE = (import.meta.env.VITE_SHOP_API_URL || '/shop').replace(/\/+$/, '')

export type ShopAccount = {
  id: string
  email: string
  name: string
  phone: string | null
}

export type ShopProduct = {
  id: string
  sku: string
  name: string
  unit: string
  priceKobo: number
  currency: string
  description: string | null
  category: string
  provenance: 'trovara_grown' | 'trovara_sourced'
  familyBasketQuantity: number
}

export type ShopDeliverySlot = {
  id: string
  label: string
  dayOfWeek: number
  startTime: string
  endTime: string
  cutoffHours: number
  active?: boolean
  sortOrder?: number
}

export type ShopRecurringOrder = {
  id: string
  frequency: 'weekly' | 'fortnightly' | 'monthly'
  items: { productId: string; quantity: number }[]
  deliverySlotId: string | null
  deliveryLabel: string | null
  deliveryDayOfWeek: number | null
  deliveryStartTime: string | null
  deliveryEndTime: string | null
  address: string
  phone: string | null
  nextCheckoutAt: string
  active: boolean
  createdAt?: string
}

export type ShopOrder = {
  id: string
  reference: string
  status: string
  paymentStatus: string
  totalAmount: number
  currency: string
  source: string
  createdAt: string
  lotCode: string | null
  traceabilityUrl: string | null
  deliveryDate: string | null
  deliverySlotId: string | null
  deliveryLabel: string | null
  deliveryStartTime: string | null
  deliveryEndTime: string | null
  items: {
    productId: string | null
    productName: string
    quantity: number
    unit: string
    provenance: 'trovara_grown' | 'trovara_sourced' | null
  }[]
}

export type ShopCredits = {
  balance: number
  referralCode: string
  referralUrl: string
  referralCount: number
  referralPendingCount: number
  referralActivatedCount: number
  welcomeCredits: number
  welcomeCreditAwarded: boolean
  referralCredits: number
  referralRefundWindowDays: number
  transactions: {
    id: string
    amount: number
    eventType: string
    description: string
    createdAt: string
  }[]
}

export type CreditInvitation = {
  name: string
  email: string
  expiresAt: string
}

let csrfToken = ''

export class ShopApiError extends Error {
  status: number
  needsVerification: boolean
  needsSignIn: boolean

  constructor(message: string, status: number, needsVerification = false, needsSignIn = false) {
    super(message)
    this.name = 'ShopApiError'
    this.status = status
    this.needsVerification = needsVerification
    this.needsSignIn = needsSignIn
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD'].includes(method) && csrfToken) headers.set('X-CSRF-Token', csrfToken)
  let response: Response
  try {
    response = await fetch(`${SHOP_API_BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ShopApiError(
      'Account services are temporarily offline. Your account and basket were not changed. Please try again.',
      0,
    )
  }
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string
    csrfToken?: string
    needsVerification?: boolean
    needsSignIn?: boolean
  }
  if (data.csrfToken) csrfToken = data.csrfToken
  if (!response.ok) {
    const rawError = data.error
    const message =
      typeof rawError === 'string' && rawError.trim()
        ? rawError
        : 'Something went wrong. Please try again.'
    throw new ShopApiError(
      message,
      response.status,
      data.needsVerification === true,
      data.needsSignIn === true,
    )
  }
  return data
}

export const shopApi = {
  session: () => request<{ csrfToken: string; account: ShopAccount | null }>('/session'),
  catalog: () =>
    request<{
      products: ShopProduct[]
      deliverySlots: ShopDeliverySlot[]
      farm: { name: string }
    }>('/catalog'),
  register: (body: { name: string; email: string; phone?: string; password: string }) =>
    request<{ message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ account: ShopAccount; csrfToken: string; needsVerification?: boolean }>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  logout: () => request<{ ok: boolean }>('/logout', { method: 'POST' }),
  me: () => request<{ account: ShopAccount; channels: { channel: string; name: string | null }[] }>('/me'),
  orders: () => request<{ orders: ShopOrder[] }>('/orders'),
  recurringOrders: () => request<{ recurringOrders: ShopRecurringOrder[] }>('/recurring-orders'),
  cancelRecurringOrder: (id: string) =>
    request<{ ok: boolean }>(`/recurring-orders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  linkCode: () =>
    request<{ code: string; expiresAt: string; instruction: string }>('/link-code', { method: 'POST' }),
  placeOrder: (body: {
    items: { productId: string; quantity: number }[]
    address: string
    phone?: string
    deliverySlotId?: string
    deliveryDate?: string
    recurrenceFrequency?: 'weekly' | 'fortnightly' | 'monthly'
    recurringOrderId?: string
  }) =>
    request<{ reference: string; payment?: { authorizationUrl: string; amountKobo: number } }>(
      '/orders',
      { method: 'POST', body: JSON.stringify(body) },
    ),
  forgotPassword: (body: { email: string }) =>
    request<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  resetPassword: (body: { token: string; newPassword: string }) =>
    request<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyEmail: (body: { token: string }) =>
    request<{ message: string }>('/verify-email', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  resendVerification: (body: { email: string }) =>
    request<{ message: string }>('/resend-verification', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  creditInvitation: (token: string) =>
    request<{ invitation: CreditInvitation }>(
      `/credits/invitation?token=${encodeURIComponent(token)}`,
    ),
  claimCredits: (body: { token: string; password: string }) =>
    request<{ account: ShopAccount; csrfToken: string; credits: ShopCredits }>(
      '/credits/claim',
      { method: 'POST', body: JSON.stringify(body) },
    ),
  credits: () => request<{ credits: ShopCredits }>('/credits'),
}

export function isAllowedPaystackCheckoutUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return host === 'checkout.paystack.com' || host.endsWith('.paystack.com')
  } catch {
    return false
  }
}

export function formatShopPrice(priceKobo: number, currency = 'NGN'): string {
  if (priceKobo <= 0) return 'Price on request'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    priceKobo / 100,
  )
}
