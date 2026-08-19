<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { shopApi } from '@/lib/shop'

const route = useRoute()
const busy = ref(true)
const error = ref('')
const success = ref(false)

async function verifyEmail(token: string) {
  try {
    await shopApi.verifyEmail({ token })
    success.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to verify email. The link may be expired.'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  const tokenParam = route.query.token
  if (!tokenParam || typeof tokenParam !== 'string') {
    error.value = 'Invalid verification link. Please request a new one.'
    busy.value = false
    return
  }
  void verifyEmail(tokenParam)
})
</script>

<template>
  <div class="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl md:p-8">
    <p class="text-xs font-black uppercase tracking-[0.24em] text-farm-gold">Email verification</p>
    <div v-if="busy" class="mt-8 grid min-h-40 place-items-center text-slate-400">
      <p class="text-sm font-bold">Verifying your email…</p>
    </div>
    <div v-else-if="success" class="mt-6 text-center">
      <h1 class="text-2xl font-black text-os-fg">Email verified successfully</h1>
      <p class="mt-3 leading-7 text-slate-400">Your Trovara Farm Account is now active. You can sign in and start using it.</p>
      <RouterLink to="/" class="mt-6 inline-flex rounded-xl bg-farm-green px-6 py-3 text-sm font-bold text-white">Go to account</RouterLink>
    </div>
    <div v-else class="mt-6 text-center">
      <h1 class="text-2xl font-black text-os-fg">Verification failed</h1>
      <p class="mt-3 leading-7 text-slate-400">{{ error }}</p>
      <RouterLink to="/" class="mt-6 inline-flex rounded-xl bg-farm-green px-6 py-3 text-sm font-bold text-white">Go to account</RouterLink>
    </div>
  </div>
</template>
