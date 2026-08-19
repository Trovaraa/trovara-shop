<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  shopApi,
  ShopApiError,
  formatShopPrice,
  type ShopAccount,
  type ShopOrder,
  type ShopProduct,
  type ShopCredits,
} from '@/lib/shop'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { TELEGRAM_ORDER_URL } from '@/lib/telegram'
import ShopHeroArt from '@/components/ShopHeroArt.vue'
import { FARM_PRODUCTS_URL, productImage } from '@/lib/farm'

type Tab = 'shop' | 'credits' | 'orders' | 'connect'
type AuthMode = 'login' | 'register' | 'forgot'

const loading = ref(true)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const authError = ref('')
const authNotice = ref('')
const catalogWarning = ref('')
const sessionWarning = ref('')
const activeTab = ref<Tab>('shop')
const authMode = ref<AuthMode>('register')
const account = ref<ShopAccount | null>(null)
const products = ref<ShopProduct[]>([])
const orders = ref<ShopOrder[]>([])
const credits = ref<ShopCredits | null>(null)
const channels = ref<{ channel: string; name: string | null }[]>([])
const linkCode = ref('')
const linkExpiry = ref('')
const showLinkForm = ref(false)
const cart = reactive<Record<string, number>>({})
const showCheckout = ref(false)
const needsVerification = ref(false)
const authForm = reactive({ name: '', email: '', phone: '', password: '' })
const checkoutForm = reactive({ address: '', phone: '' })

const telegramLinked = computed(() =>
  channels.value.some((channel) => channel.channel.toLowerCase() === 'telegram'),
)
const whatsappLinked = computed(() =>
  channels.value.some((channel) => channel.channel.toLowerCase() === 'whatsapp'),
)
const hasLinkedChannels = computed(() => channels.value.length > 0)
const cartLines = computed(() =>
  products.value
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({ product, quantity: cart[product.id] ?? 0 })),
)
const cartCount = computed(() => cartLines.value.reduce((sum, line) => sum + line.quantity, 0))
const cartTotalKobo = computed(() =>
  cartLines.value.reduce((sum, line) => sum + line.product.priceKobo * line.quantity, 0),
)

let linkPollTimer: ReturnType<typeof setInterval> | null = null

function stopLinkPoll() {
  if (linkPollTimer) {
    clearInterval(linkPollTimer)
    linkPollTimer = null
  }
}

function setQuantity(productId: string, quantity: number) {
  cart[productId] = Math.max(0, Math.min(100, quantity))
}

function clearMessages() {
  error.value = ''
  notice.value = ''
  authError.value = ''
  authNotice.value = ''
}

function clearAuthMessages() {
  authError.value = ''
  authNotice.value = ''
}

function setAuthMode(mode: AuthMode) {
  authMode.value = mode
  clearAuthMessages()
}

function scrollToAccount() {
  document.getElementById('shop-account')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function goCreateAccount() {
  setAuthMode('register')
  scrollToAccount()
}

async function refreshChannels() {
  if (!account.value) return
  const me = await shopApi.me()
  channels.value = me.channels
}

async function loadAccountData() {
  if (!account.value) return
  const [orderData, me, creditData] = await Promise.all([
    shopApi.orders(),
    shopApi.me(),
    shopApi.credits(),
  ])
  orders.value = orderData.orders
  channels.value = me.channels
  credits.value = creditData.credits
}

async function submitAuth() {
  clearAuthMessages()
  busy.value = true
  try {
    if (authMode.value === 'register') {
      const result = await shopApi.register({
        name: authForm.name,
        email: authForm.email,
        phone: authForm.phone || undefined,
        password: authForm.password,
      })
      authForm.password = ''
      authNotice.value = result.message || 'Check your email to verify your account.'
      needsVerification.value = true
    } else {
      const result = await shopApi.login({ email: authForm.email, password: authForm.password })
      account.value = result.account
      checkoutForm.phone = result.account.phone ?? ''
      authForm.password = ''
      needsVerification.value = false
      authNotice.value = 'Welcome back.'
      await loadAccountData()
    }
  } catch (err) {
    if (err instanceof ShopApiError && err.needsVerification) {
      needsVerification.value = true
      authNotice.value = err.message || 'Please verify your email address before signing in.'
      authError.value = ''
    } else {
      authError.value = err instanceof Error ? err.message : 'Unable to sign in.'
    }
    scrollToAccount()
  } finally {
    busy.value = false
  }
}

async function submitForgotPassword() {
  clearAuthMessages()
  busy.value = true
  try {
    const result = await shopApi.forgotPassword({ email: authForm.email })
    authNotice.value = result.message || 'Check your email for a password reset link.'
    authForm.email = ''
  } catch (err) {
    authError.value = err instanceof Error ? err.message : 'Unable to send reset link.'
    scrollToAccount()
  } finally {
    busy.value = false
  }
}

async function resendVerification() {
  clearAuthMessages()
  busy.value = true
  try {
    const result = await shopApi.resendVerification({ email: authForm.email })
    authNotice.value = result.message || 'Verification email sent. Check your inbox.'
  } catch (err) {
    authError.value = err instanceof Error ? err.message : 'Unable to resend verification.'
    scrollToAccount()
  } finally {
    busy.value = false
  }
}

async function logout() {
  clearMessages()
  busy.value = true
  try {
    await shopApi.logout()
    account.value = null
    orders.value = []
    credits.value = null
    channels.value = []
    linkCode.value = ''
    showLinkForm.value = false
    stopLinkPoll()
    activeTab.value = 'shop'
  } finally {
    busy.value = false
  }
}

function beginCheckout() {
  clearMessages()
  if (!cartCount.value) return
  if (!account.value) {
    authMode.value = 'login'
    authError.value = 'Create an account or sign in before checkout so your order can be tracked.'
    authNotice.value = ''
    scrollToAccount()
    return
  }
  checkoutForm.phone = checkoutForm.phone || account.value.phone || ''
  showCheckout.value = true
}

async function placeOrder() {
  clearMessages()
  busy.value = true
  try {
    const result = await shopApi.placeOrder({
      items: cartLines.value.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
      })),
      address: checkoutForm.address,
      phone: checkoutForm.phone || undefined,
    })
    for (const key of Object.keys(cart)) delete cart[key]
    showCheckout.value = false
    notice.value = `Order ${result.reference} has been received.`
    await loadAccountData()
    activeTab.value = 'orders'
    if (result.payment?.authorizationUrl) window.location.assign(result.payment.authorizationUrl)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to place the order.'
  } finally {
    busy.value = false
  }
}

async function createLinkCode() {
  clearMessages()
  busy.value = true
  try {
    const result = await shopApi.linkCode()
    linkCode.value = result.code
    linkExpiry.value = result.expiresAt
    showLinkForm.value = true
    startLinkPoll()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to create a link code.'
  } finally {
    busy.value = false
  }
}

function startLinkPoll() {
  stopLinkPoll()
  const linkedBefore = new Set(channels.value.map((c) => c.channel.toLowerCase()))
  linkPollTimer = setInterval(async () => {
    try {
      if (linkExpiry.value && Date.now() > new Date(linkExpiry.value).getTime()) {
        stopLinkPoll()
        return
      }
      await refreshChannels()
      const newlyLinked = channels.value.find((c) => !linkedBefore.has(c.channel.toLowerCase()))
      if (newlyLinked) {
        linkCode.value = ''
        showLinkForm.value = false
        notice.value = `${newlyLinked.channel.charAt(0).toUpperCase()}${newlyLinked.channel.slice(1)} is linked to your shop account.`
        stopLinkPoll()
      }
    } catch {
      // Keep polling through transient network blips while the code is live.
    }
  }, 3000)
}

async function checkLinkStatus() {
  clearMessages()
  busy.value = true
  try {
    const before = channels.value.length
    await refreshChannels()
    if (channels.value.length > before || hasLinkedChannels.value) {
      if (hasLinkedChannels.value) {
        linkCode.value = ''
        showLinkForm.value = false
        notice.value = telegramLinked.value
          ? 'Telegram is linked to your shop account.'
          : 'Your chat channel is linked.'
        stopLinkPoll()
      } else {
        notice.value = 'Not linked yet. Send the link message in Telegram, then check again.'
      }
    } else {
      notice.value = 'Not linked yet. Send the link message in Telegram, then check again.'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to check link status.'
  } finally {
    busy.value = false
  }
}

async function copyLinkCommand() {
  if (!linkCode.value) return
  await navigator.clipboard.writeText(`link ${linkCode.value}`)
  notice.value = 'Link command copied.'
}

async function copyReferralLink() {
  if (!credits.value?.referralUrl) return
  try {
    await navigator.clipboard.writeText(credits.value.referralUrl)
    notice.value = 'Referral link copied.'
  } catch {
    error.value = 'Your browser could not copy the link. Press and hold the link to copy it.'
  }
}

watch(activeTab, (tab) => {
  if (tab === 'connect' && account.value) {
    void refreshChannels().catch(() => {
      /* ignore — page still usable */
    })
  }
})

onUnmounted(stopLinkPoll)

async function loadShop() {
  loading.value = true
  error.value = ''
  catalogWarning.value = ''
  sessionWarning.value = ''
  const [sessionResult, catalogResult] = await Promise.allSettled([
    shopApi.session(),
    shopApi.catalog(),
  ])
  if (catalogResult.status === 'fulfilled') {
    products.value = catalogResult.value.products ?? []
  } else {
    products.value = []
    catalogWarning.value = 'Live checkout is unavailable right now. Product forecasts and waitlists are still available.'
  }
  if (sessionResult.status === 'fulfilled') {
    account.value = sessionResult.value.account
    checkoutForm.phone = account.value?.phone ?? ''
    if (account.value) {
      try {
        await loadAccountData()
      } catch {
        sessionWarning.value = 'We could not refresh your orders or chat links. Your signed-in account is still available.'
      }
    }
  } else {
    sessionWarning.value = 'Account services are temporarily unavailable. You can still browse product forecasts and try again shortly.'
  }
  loading.value = false
}

onMounted(loadShop)

const fieldClass =
  'mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 font-normal text-white outline-none focus:border-farm-green'
const cardClass = 'rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl'
const tabClass = (on: boolean) =>
  on
    ? 'min-h-11 shrink-0 rounded-xl bg-farm-green px-5 text-sm font-bold text-white'
    : 'min-h-11 shrink-0 rounded-xl px-5 text-sm font-bold capitalize text-slate-400 hover:bg-slate-800'
</script>

<template>
  <div>
    <section class="mb-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,420px)]">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.24em] text-farm-gold">Trovara Farm Account</p>
        <h1 class="mt-3 text-3xl font-black text-os-fg sm:text-4xl">One account for every Trovara order.</h1>
        <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          Create an account before harvest opens. It keeps website orders, chat updates, and traceability links together when products become available.
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <a href="#shop-account" class="rounded-xl bg-farm-green px-5 py-3 text-sm font-bold text-white hover:bg-farm-green-dark" @click.prevent="goCreateAccount">Create account</a>
          <a :href="FARM_PRODUCTS_URL" class="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">Join product waitlists</a>
        </div>
      </div>
      <ShopHeroArt class="mx-auto w-full max-w-md" />
    </section>

    <div
      v-if="catalogWarning || sessionWarning"
      class="mb-6 rounded-2xl border border-farm-gold/35 bg-farm-gold/10 px-5 py-4 text-sm text-os-fg"
      role="status"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-black">Some live shop services are taking a break.</p>
          <p class="mt-1 leading-6 text-slate-400">{{ [catalogWarning, sessionWarning].filter(Boolean).join(' ') }}</p>
        </div>
        <button type="button" class="min-h-11 shrink-0 rounded-xl border border-slate-600 px-4 py-2 font-bold" :disabled="loading" @click="loadShop">
          {{ loading ? 'Checking…' : 'Check again' }}
        </button>
      </div>
    </div>

    <div
      v-if="error || notice"
      class="mb-6 flex flex-col gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between"
      :class="error ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-farm-green/30 bg-farm-green/10 text-farm-green'"
      role="status"
    >
      <span>{{ error || notice }}</span>
      <button
        v-if="error"
        type="button"
        class="min-h-11 shrink-0 rounded-xl border border-current px-4 py-2 font-bold"
        :disabled="loading"
        @click="loadShop"
      >
        {{ loading ? 'Checking…' : 'Try again' }}
      </button>
    </div>

    <div class="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-2" aria-label="Account sections">
      <button v-for="tab in (['shop', 'credits', 'orders', 'connect'] as Tab[])" :key="tab" type="button" :class="tabClass(activeTab === tab)" @click="activeTab = tab">
        {{
          tab === 'credits'
            ? credits
              ? `Trovara Farm Credits · ${credits.balance.toLocaleString('en-NG')}`
              : 'Trovara Farm Credits'
            : tab === 'orders'
            ? `My orders${orders.length ? ` (${orders.length})` : ''}`
            : tab === 'connect'
              ? hasLinkedChannels
                ? 'Connect chat · Linked'
                : 'Connect chat'
              : `Shop${cartCount ? ` (${cartCount})` : ''}`
        }}
      </button>
    </div>

    <div v-if="loading" class="grid min-h-64 place-items-center text-slate-500">Loading your account…</div>

    <div v-else-if="activeTab === 'shop'" class="grid gap-8" :class="products.length ? 'lg:grid-cols-[minmax(0,1fr)_23rem]' : 'grid-cols-1'">
      <section>
        <div class="mb-6">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-farm-green">{{ products.length ? 'Open SKUs' : 'Harvest catalogue' }}</p>
          <h2 class="mt-2 text-2xl font-black text-os-fg">Farm shop</h2>
        </div>
        <div v-if="products.length" class="grid gap-5 sm:grid-cols-2">
          <article v-for="product in products" :key="product.id" class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <div class="relative h-44 bg-slate-950">
              <img v-if="productImage(product.name)" :src="productImage(product.name)!" :alt="product.name" class="h-full w-full object-cover" />
              <span class="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-farm-green">{{ product.sku }}</span>
            </div>
            <div class="p-4 sm:p-5">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg font-black text-os-fg">{{ product.name }}</h3>
                  <p class="mt-1 text-xs text-slate-500">Sold per {{ product.unit }}</p>
                </div>
                <p class="shrink-0 font-black text-farm-green">{{ formatShopPrice(product.priceKobo, product.currency) }}</p>
              </div>
              <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div class="inline-flex items-center rounded-xl border border-slate-700">
                  <button type="button" class="h-11 w-11 text-xl" :aria-label="`Remove one ${product.name}`" @click="setQuantity(product.id, (cart[product.id] ?? 0) - 1)">−</button>
                  <span class="min-w-9 text-center font-black">{{ cart[product.id] ?? 0 }}</span>
                  <button type="button" class="h-11 w-11 text-xl" :aria-label="`Add one ${product.name}`" @click="setQuantity(product.id, (cart[product.id] ?? 0) + 1)">+</button>
                </div>
                <button type="button" class="rounded-xl bg-farm-green px-4 py-3 text-sm font-bold text-white" @click="setQuantity(product.id, Math.max(1, cart[product.id] ?? 0))">Add to basket</button>
              </div>
            </div>
          </article>
        </div>
        <div v-else :class="cardClass" class="text-center">
          <p class="text-lg font-black text-os-fg">Checkout opens with each harvest</p>
          <p class="mt-3 text-sm leading-6 text-slate-400">
            Nothing is on sale yet. Join product waitlists, then create your account so orders and chat updates stay linked when supply starts.
          </p>
          <a :href="FARM_PRODUCTS_URL" class="mt-6 inline-flex rounded-xl bg-farm-green px-6 py-3 text-sm font-bold text-white">View products & waitlists</a>
        </div>
      </section>

      <aside v-if="products.length" :class="cardClass" class="h-fit lg:sticky lg:top-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-black text-os-fg">Your basket</h2>
          <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-black text-farm-green">{{ cartCount }} items</span>
        </div>
        <div v-if="cartLines.length" class="mt-5 divide-y divide-slate-800">
          <div v-for="line in cartLines" :key="line.product.id" class="flex justify-between gap-4 py-4 text-sm">
            <div>
              <p class="font-bold text-os-fg">{{ line.product.name }}</p>
              <p class="text-slate-500">{{ line.quantity }} × {{ line.product.unit }}</p>
            </div>
            <p class="font-bold">{{ formatShopPrice(line.product.priceKobo * line.quantity, line.product.currency) }}</p>
          </div>
        </div>
        <p v-else class="mt-5 rounded-2xl bg-slate-950 p-5 text-sm leading-6 text-slate-500">
          Add a product when SKUs are live. Your basket stays on this device until checkout.
        </p>
        <div class="mt-5 flex justify-between border-t border-slate-800 pt-5">
          <span class="font-bold">Estimated total</span>
          <strong class="text-xl text-farm-green">{{ formatShopPrice(cartTotalKobo) }}</strong>
        </div>
        <button type="button" class="mt-5 w-full rounded-xl bg-farm-green py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="!cartCount" @click="beginCheckout">Continue to checkout</button>
        <div class="mt-5 border-t border-slate-800 pt-5">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Or continue with a chat assistant</p>
          <div class="mt-3 grid gap-2" :class="TELEGRAM_ORDER_URL ? 'grid-cols-2' : 'grid-cols-1'">
            <a :href="buildWhatsAppLink(products.length ? 'Hi Trovara Farm, I would like help with products currently in the farm shop.' : 'Hi Trovara Farm, I would like waitlist updates and to prepare a shop account before harvest checkout opens.')" target="_blank" rel="noopener" class="rounded-xl bg-[#25D366] px-3 py-3 text-center text-xs font-bold text-white">WhatsApp</a>
            <a v-if="TELEGRAM_ORDER_URL" :href="TELEGRAM_ORDER_URL" target="_blank" rel="noopener" class="rounded-xl bg-[#229ED9] px-3 py-3 text-center text-xs font-bold text-white">Telegram</a>
          </div>
        </div>
      </aside>
    </div>

    <section v-else-if="activeTab === 'credits'" class="mx-auto max-w-4xl">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-farm-green">Trovara Farm Credits</p>
          <h2 class="mt-2 text-2xl font-black text-os-fg">Your rewards</h2>
        </div>
        <p class="text-xs text-slate-500">For eligible Trovara Farm products only · Promotional credits, not cash</p>
      </div>

      <div v-if="!account" :class="cardClass" class="mt-6 text-center">
        <p class="text-lg font-black text-os-fg">Sign in to view your Trovara Farm Credits</p>
        <p class="mt-2 text-sm leading-6 text-slate-400">Your balance and personal referral link belong to your shop account.</p>
        <button type="button" class="mt-5 rounded-xl bg-farm-green px-5 py-3 text-sm font-bold text-white" @click="setAuthMode('login'); scrollToAccount()">Sign in</button>
      </div>

      <template v-else-if="credits">
        <div class="mt-6 grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <article class="overflow-hidden rounded-3xl border border-[#889058]/40 bg-[#18311f] p-6 shadow-xl sm:p-8">
            <div class="flex items-start justify-between gap-5">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.22em] text-[#c5ce82]">Available balance</p>
                <p class="mt-4 text-5xl font-black text-white">{{ credits.balance.toLocaleString('en-NG') }}</p>
                <p class="mt-2 text-sm font-bold text-slate-300">Trovara Farm Credits</p>
              </div>
              <img src="/brand/trovara-credits-symbol.svg" alt="" class="h-20 w-20 shrink-0" />
            </div>
          </article>

          <article :class="cardClass">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-farm-green">Invite someone</p>
            <h3 class="mt-2 text-xl font-black text-os-fg">Earn {{ credits.referralCredits.toLocaleString('en-NG') }} more Trovara Farm Credits</h3>
            <p class="mt-3 text-sm leading-6 text-slate-400">
              Share your link. Your reward stays pending until your referred friend makes their first eligible Trovara Farm purchase and its {{ credits.referralRefundWindowDays }}-day refund period ends without a refund.
            </p>
            <div class="mt-5 rounded-2xl bg-slate-950 p-4">
              <p class="break-all text-sm font-semibold text-farm-green">{{ credits.referralUrl }}</p>
            </div>
            <div class="mt-4 flex flex-wrap gap-3">
              <button type="button" class="min-h-11 rounded-xl bg-farm-green px-5 text-sm font-bold text-white" @click="copyReferralLink">Copy referral link</button>
              <a :href="`https://wa.me/?text=${encodeURIComponent(`Complete Trovara Farm's food survey with my link: ${credits.referralUrl}`)}`" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center rounded-xl border border-slate-700 px-5 text-sm font-bold text-os-fg">Share on WhatsApp</a>
            </div>
          </article>
        </div>

        <article :class="cardClass" class="mt-5">
          <h3 class="text-xl font-black text-os-fg">How referrals work</h3>
          <div class="mt-4 grid gap-3 md:grid-cols-3">
            <div class="rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-400">
              <span class="font-black text-farm-green">1. Refer</span>
              <p class="mt-1">Your friend completes the Trovara Farm survey using your personal link and activates their account.</p>
            </div>
            <div class="rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-400">
              <span class="font-black text-farm-green">2. First purchase</span>
              <p class="mt-1">They buy an eligible product sold by Trovara Farm. Your 1,000-credit reward remains pending.</p>
            </div>
            <div class="rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-400">
              <span class="font-black text-farm-green">3. Reward activates</span>
              <p class="mt-1">After the {{ credits.referralRefundWindowDays }}-day refund period passes without a refund, the credits move into your available balance.</p>
            </div>
          </div>
          <p class="mt-4 text-xs leading-5 text-slate-500">
            Trovara Farm Credits can only be used to buy eligible products sold by Trovara Farm. They cannot be withdrawn, transferred, or exchanged for cash.
          </p>
        </article>

        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div :class="cardClass">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Referred surveys</p>
            <p class="mt-2 text-3xl font-black text-os-fg">{{ credits.referralCount }}</p>
          </div>
          <div :class="cardClass">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Rewards pending</p>
            <p class="mt-2 text-3xl font-black text-farm-gold">{{ credits.referralPendingCount }}</p>
          </div>
          <div :class="cardClass">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Rewards activated</p>
            <p class="mt-2 text-3xl font-black text-farm-green">{{ credits.referralActivatedCount }}</p>
          </div>
          <div :class="cardClass">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Welcome award</p>
            <p class="mt-2 text-3xl font-black text-os-fg">{{ credits.welcomeCredits.toLocaleString('en-NG') }}</p>
          </div>
        </div>

        <div :class="cardClass" class="mt-4">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Your referral code</p>
          <p class="mt-2 break-all text-xl font-black text-farm-gold">{{ credits.referralCode }}</p>
        </div>

        <article :class="cardClass" class="mt-5">
          <h3 class="text-xl font-black text-os-fg">Trovara Farm Credits activity</h3>
          <div v-if="credits.transactions.length" class="mt-4 divide-y divide-slate-800">
            <div v-for="entry in credits.transactions" :key="entry.id" class="flex items-center justify-between gap-4 py-4">
              <div>
                <p class="font-bold text-os-fg">{{ entry.description }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ new Date(entry.createdAt).toLocaleDateString('en-NG') }}</p>
              </div>
              <p class="shrink-0 text-lg font-black" :class="entry.amount > 0 ? 'text-farm-green' : 'text-red-300'">
                {{ entry.amount > 0 ? '+' : '' }}{{ entry.amount.toLocaleString('en-NG') }}
              </p>
            </div>
          </div>
          <p v-else class="mt-4 text-sm text-slate-500">No Trovara Farm Credits activity yet.</p>
        </article>
      </template>
    </section>

    <section v-else-if="activeTab === 'orders'" class="mx-auto max-w-4xl">
      <h2 class="text-2xl font-black text-os-fg">Your orders</h2>
      <div v-if="!account" :class="cardClass" class="mt-6 text-slate-400">Sign in below to see orders placed on the website, WhatsApp, or Telegram.</div>
      <div v-else-if="orders.length" class="mt-6 space-y-4">
        <article v-for="order in orders" :key="order.id" :class="cardClass">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-wider text-farm-green">{{ order.reference }}</p>
              <h3 class="mt-1 text-xl font-black capitalize text-os-fg">{{ order.status.replace('_', ' ') }}</h3>
              <p class="mt-1 text-xs text-slate-500">Ordered {{ new Date(order.createdAt).toLocaleDateString('en-NG') }} via {{ order.source }}</p>
            </div>
            <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold capitalize">{{ order.paymentStatus.replace('_', ' ') }}</span>
          </div>
          <ul class="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm">
            <li v-for="item in order.items" :key="`${order.id}-${item.productName}`" class="flex justify-between gap-4">
              <span>{{ item.productName }}</span>
              <span class="text-slate-500">{{ item.quantity }} {{ item.unit }}</span>
            </li>
          </ul>
          <a
            v-if="order.traceabilityUrl"
            :href="order.traceabilityUrl"
            target="_blank"
            rel="noopener"
            class="mt-5 inline-flex items-center gap-2 rounded-xl border border-farm-green px-4 py-3 text-sm font-bold text-farm-green"
          >
            Open traceability record →
          </a>
          <p v-else class="mt-5 text-xs text-slate-500">Your traceability link will appear here when the lot is verified.</p>
        </article>
      </div>
      <div v-else-if="account" :class="cardClass" class="mt-6 text-center text-slate-500">No orders yet. Your first order will appear here.</div>
    </section>

    <section v-else class="mx-auto max-w-3xl">
      <h2 class="text-2xl font-black text-os-fg">
        {{ telegramLinked ? 'Telegram linked' : 'Connect Telegram (or WhatsApp later)' }}
      </h2>
      <p class="mt-3 leading-7 text-slate-400">
        Website orders only appear in chat after you link. Create a code, open the Telegram customer bot, and send
        <code class="rounded bg-slate-800 px-1.5 py-0.5 text-sm font-semibold text-os-fg">link YOURCODE</code>.
      </p>
      <div v-if="account" :class="cardClass" class="mt-6">
        <div v-if="hasLinkedChannels" class="rounded-2xl border border-farm-green/30 bg-farm-green/10 p-5" role="status">
          <p class="text-lg font-black text-os-fg">
            <template v-if="telegramLinked && whatsappLinked">Telegram and WhatsApp are linked to this shop account.</template>
            <template v-else-if="telegramLinked">Telegram is linked to this shop account.</template>
            <template v-else-if="whatsappLinked">WhatsApp is linked to this shop account.</template>
            <template v-else>A chat channel is linked to this shop account.</template>
          </p>
        </div>
        <div v-if="!hasLinkedChannels || showLinkForm || linkCode" class="mt-6">
          <button v-if="!linkCode" type="button" class="rounded-xl bg-farm-green px-5 py-3 text-sm font-bold text-white" :disabled="busy" @click="createLinkCode">
            {{ busy ? 'Creating…' : 'Create a secure link code' }}
          </button>
          <div v-else class="rounded-2xl bg-slate-950 p-6">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Send this exact message to the Telegram customer bot</p>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-4">
              <code class="text-xl font-black text-farm-gold">link {{ linkCode }}</code>
              <button type="button" class="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold" @click="copyLinkCommand">Copy</button>
            </div>
            <p class="mt-3 text-xs text-slate-500">Expires {{ new Date(linkExpiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} and works once.</p>
            <div class="mt-5 flex flex-wrap gap-3">
              <a v-if="TELEGRAM_ORDER_URL" :href="TELEGRAM_ORDER_URL" target="_blank" rel="noopener" class="rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white">Open Telegram</a>
              <button type="button" class="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold" :disabled="busy" @click="checkLinkStatus">
                {{ busy ? 'Checking…' : "I've sent it. Check status" }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else :class="cardClass" class="mt-6 text-slate-400">Create an account or sign in below before linking a chat.</div>
    </section>

    <section id="shop-account" :class="cardClass" class="mx-auto mt-12 max-w-3xl">
      <div
        v-if="authError || authNotice"
        class="mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold"
        :class="authError ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-farm-green/30 bg-farm-green/10 text-farm-green'"
        role="alert"
      >
        {{ authError || authNotice }}
      </div>
      <template v-if="account">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-farm-green">Signed in</p>
            <h2 class="mt-1 text-2xl font-black text-os-fg">{{ account.name }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ account.email }}</p>
          </div>
          <button type="button" class="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold" :disabled="busy" @click="logout">Sign out</button>
        </div>
      </template>
      <template v-else-if="authMode === 'forgot'">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-farm-green">Reset password</p>
            <h2 class="mt-1 text-2xl font-black text-os-fg">Forgot your password?</h2>
          </div>
          <button type="button" class="text-sm font-bold text-farm-green" @click="setAuthMode('login')">Back to sign in</button>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitForgotPassword">
          <label class="text-sm font-bold text-os-fg">Email<input v-model="authForm.email" required type="email" autocomplete="email" :class="fieldClass" /></label>
          <button type="submit" class="rounded-xl bg-farm-green py-3 text-sm font-bold text-white" :disabled="busy">{{ busy ? 'Sending…' : 'Send reset link' }}</button>
        </form>
      </template>
      <template v-else>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-farm-green">Customer account</p>
            <h2 class="mt-1 text-2xl font-black text-os-fg">{{ authMode === 'login' ? 'Welcome back' : 'Create your account' }}</h2>
          </div>
          <button type="button" class="text-sm font-bold text-farm-green" @click="setAuthMode(authMode === 'login' ? 'register' : 'login')">
            {{ authMode === 'login' ? 'Create account' : 'I have an account' }}
          </button>
        </div>
        <div v-if="needsVerification" class="mt-5 rounded-2xl border border-farm-green/30 bg-farm-green/10 p-5">
          <p class="text-sm font-bold text-farm-green">Email verification required</p>
          <p class="mt-2 text-sm leading-6 text-slate-400">Check your inbox for a verification link. If you didn't receive it, enter your email and we'll send it again.</p>
          <button type="button" class="mt-4 rounded-xl bg-farm-green px-4 py-2 text-sm font-bold text-white" :disabled="busy || !authForm.email" @click="resendVerification">
            {{ busy ? 'Sending…' : 'Resend verification' }}
          </button>
        </div>
        <form class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="submitAuth">
          <label v-if="authMode === 'register'" class="text-sm font-bold text-os-fg">Name<input v-model="authForm.name" required minlength="2" autocomplete="name" :class="fieldClass" /></label>
          <label class="text-sm font-bold text-os-fg">Email<input v-model="authForm.email" required type="email" autocomplete="email" :class="fieldClass" /></label>
          <label v-if="authMode === 'register'" class="text-sm font-bold text-os-fg">Phone <span class="font-normal text-slate-500">(optional)</span><input v-model="authForm.phone" type="tel" autocomplete="tel" :class="fieldClass" /></label>
          <label class="text-sm font-bold text-os-fg">Password<input v-model="authForm.password" required type="password" minlength="8" :autocomplete="authMode === 'register' ? 'new-password' : 'current-password'" :class="fieldClass" /></label>
          <button type="submit" class="rounded-xl bg-farm-green py-3 text-sm font-bold text-white sm:col-span-2" :disabled="busy">
            {{ busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account' }}
          </button>
        </form>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button type="button" class="font-bold text-farm-green hover:underline" @click="setAuthMode('forgot')">Forgot password?</button>
          <p class="text-slate-500">
            <button type="button" class="font-bold text-farm-green hover:underline" @click="setAuthMode(authMode === 'login' ? 'register' : 'login')">
              {{ authMode === 'login' ? 'Create an account' : 'Sign in' }}
            </button>
          </p>
        </div>
      </template>
    </section>

    <div v-if="showCheckout" class="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/70 p-4" @click.self="showCheckout = false">
      <form class="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-8" @submit.prevent="placeOrder">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-farm-green">Delivery details</p>
            <h2 class="mt-1 text-2xl font-black text-os-fg">Complete your order</h2>
          </div>
          <button type="button" class="grid h-11 w-11 place-items-center rounded-xl border border-slate-700" aria-label="Close checkout" @click="showCheckout = false">×</button>
        </div>
        <label class="mt-6 block text-sm font-bold text-os-fg">Delivery address<textarea v-model="checkoutForm.address" required minlength="5" rows="4" :class="fieldClass" class="py-3" /></label>
        <label class="mt-4 block text-sm font-bold text-os-fg">Delivery phone<input v-model="checkoutForm.phone" type="tel" :class="fieldClass" /></label>
        <div class="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
          <span class="font-bold">Estimated total</span>
          <strong class="text-xl text-farm-green">{{ formatShopPrice(cartTotalKobo) }}</strong>
        </div>
        <button type="submit" class="mt-5 w-full rounded-xl bg-farm-green py-3 text-sm font-bold text-white" :disabled="busy">{{ busy ? 'Placing order…' : 'Place order' }}</button>
      </form>
    </div>
  </div>
</template>
