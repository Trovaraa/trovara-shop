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
  items: { productName: string; quantity: number; unit: string }[]
}

export type ShopCredits = {
  balance: number
  referralCode: string
  referralUrl: string
  referralCount: number
  referralPendingCount: number
  referralActivatedCount: number
  welcomeCredits: number
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

  constructor(message: string, status: number, needsVerification = false) {
    super(message)
    this.name = 'ShopApiError'
    this.status = status
    this.needsVerification = needsVerification
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
  }
  if (data.csrfToken) csrfToken = data.csrfToken
  if (!response.ok) {
    const rawError = data.error
    const message =
      typeof rawError === 'string' && rawError.trim()
        ? rawError
        : 'Something went wrong. Please try again.'
    throw new ShopApiError(message, response.status, data.needsVerification === true)
  }
  return data
}

export const shopApi = {
  session: () => request<{ csrfToken: string; account: ShopAccount | null }>('/session'),
  catalog: () => request<{ products: ShopProduct[]; farm: { name: string } }>('/catalog'),
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
  linkCode: () =>
    request<{ code: string; expiresAt: string; instruction: string }>('/link-code', { method: 'POST' }),
  placeOrder: (body: {
    items: { productId: string; quantity: number }[]
    address: string
    phone?: string
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

export function formatShopPrice(priceKobo: number, currency = 'NGN'): string {
  if (priceKobo <= 0) return 'Price on request'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    priceKobo / 100,
  )
}
