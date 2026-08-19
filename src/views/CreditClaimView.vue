<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { shopApi, ShopApiError, type CreditInvitation, type ShopCredits } from '@/lib/shop'

const route = useRoute()
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const token = ref('')
const invitation = ref<CreditInvitation | null>(null)
const credits = ref<ShopCredits | null>(null)
const needsSignIn = ref(false)
const form = reactive({ password: '', confirmPassword: '' })

async function claim() {
  error.value = ''
  needsSignIn.value = false
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.'
    return
  }
  busy.value = true
  try {
    const result = await shopApi.claimCredits({ token: token.value, password: form.password })
    credits.value = result.credits
    form.password = ''
    form.confirmPassword = ''
  } catch (err) {
    if (err instanceof ShopApiError && err.needsSignIn) {
      needsSignIn.value = true
    }
    error.value = err instanceof Error ? err.message : 'Unable to claim these Trovara Farm Credits.'
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  const tokenParam = route.query.token
  if (!tokenParam || typeof tokenParam !== 'string') {
    error.value = 'This invitation link is invalid.'
    loading.value = false
    return
  }
  token.value = tokenParam
  try {
    invitation.value = (await shopApi.creditInvitation(tokenParam)).invitation
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'This invitation is invalid or has expired.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/85 shadow-2xl">
    <div class="bg-[#18311f] px-6 py-8 text-center sm:px-10">
      <img src="/brand/trovara-credits-symbol.svg" alt="Trovara Farm Credits" class="mx-auto h-24 w-24" />
      <p class="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#c5ce82]">Trovara Farm Credits</p>
      <h1 class="mt-3 text-3xl font-black text-white">Your 2,000 Trovara Farm Credits are ready.</h1>
    </div>

    <div class="p-6 sm:p-10">
      <div v-if="loading" class="grid min-h-40 place-items-center text-slate-400">
        Checking your invitation…
      </div>

      <div v-else-if="credits" class="text-center">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-farm-green">Account activated</p>
        <p class="mt-4 text-5xl font-black text-os-fg">{{ credits.balance.toLocaleString('en-NG') }}</p>
        <p class="mt-2 font-bold text-slate-400">Trovara Farm Credits</p>
        <p class="mt-6 text-sm leading-6 text-slate-400">
          Your balance and personal referral link are now in your Trovara Farm account.
        </p>
        <div class="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-5 text-left">
          <p class="text-sm font-black text-os-fg">How your referral reward works</p>
          <ol class="mt-3 space-y-3 text-sm leading-6 text-slate-400">
            <li><strong class="text-farm-green">1.</strong> Share your personal survey link.</li>
            <li><strong class="text-farm-green">2.</strong> Your friend completes the survey, activates their account, and makes their first eligible Trovara Farm purchase.</li>
            <li><strong class="text-farm-green">3.</strong> Your 1,000 Trovara Farm Credits become available after that purchase passes its {{ credits.referralRefundWindowDays }}-day refund period without a refund.</li>
          </ol>
        </div>
        <p class="mt-5 text-xs leading-5 text-slate-500">
          Trovara Farm Credits can only be used to buy eligible products sold by Trovara Farm. They are promotional credits, not cash, and cannot be withdrawn or transferred.
        </p>
        <RouterLink to="/" class="mt-7 inline-flex min-h-12 items-center rounded-xl bg-farm-green px-6 font-bold text-white">
          Open my account
        </RouterLink>
      </div>

      <template v-else-if="invitation">
        <p class="text-lg font-black text-os-fg">Hi {{ invitation.name.split(' ')[0] }},</p>
        <p class="mt-3 text-sm leading-6 text-slate-400">
          Create a password to activate the Trovara Farm account reserved for
          <strong class="text-os-fg">{{ invitation.email }}</strong>.
        </p>
        <div v-if="error" class="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300" role="alert">
          {{ error }}
          <RouterLink v-if="needsSignIn" to="/" class="mt-3 block font-bold text-farm-green">
            Sign in to your account
          </RouterLink>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="claim">
          <label class="text-sm font-bold text-os-fg">
            Create password
            <input v-model="form.password" required type="password" minlength="8" maxlength="128" autocomplete="new-password" class="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 font-normal text-white outline-none focus:border-farm-green" />
          </label>
          <label class="text-sm font-bold text-os-fg">
            Confirm password
            <input v-model="form.confirmPassword" required type="password" minlength="8" maxlength="128" autocomplete="new-password" class="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 font-normal text-white outline-none focus:border-farm-green" />
          </label>
          <button type="submit" class="min-h-12 rounded-xl bg-farm-green px-5 font-bold text-white disabled:opacity-60" :disabled="busy">
            {{ busy ? 'Activating…' : 'Activate account and claim 2,000 Trovara Farm Credits' }}
          </button>
        </form>
        <p class="mt-6 text-xs leading-5 text-slate-500">
          Trovara Farm Credits can only be used to buy eligible products sold by Trovara Farm. They are promotional credits, not cash. Referral credits become available only after the referred friend's first eligible purchase passes its refund period. This invitation expires
          {{ new Date(invitation.expiresAt).toLocaleDateString('en-NG') }}.
        </p>
      </template>

      <div v-else class="text-center">
        <h2 class="text-2xl font-black text-os-fg">Invitation unavailable</h2>
        <p class="mt-3 text-sm leading-6 text-slate-400">{{ error }}</p>
        <RouterLink to="/" class="mt-6 inline-flex rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-os-fg">Go to shop</RouterLink>
      </div>
    </div>
  </div>
</template>
