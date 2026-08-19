<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { shopApi } from '@/lib/shop'

const route = useRoute()
const busy = ref(false)
const error = ref('')
const success = ref(false)
const token = ref('')
const form = reactive({ password: '', confirmPassword: '' })

async function submitReset() {
  error.value = ''
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.'
    return
  }
  busy.value = true
  try {
    await shopApi.resetPassword({ token: token.value, newPassword: form.password })
    success.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to reset password. The link may be expired.'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  const tokenParam = route.query.token
  if (!tokenParam || typeof tokenParam !== 'string') {
    error.value = 'Invalid reset link. Please request a new one.'
    return
  }
  token.value = tokenParam
})
</script>

<template>
  <div class="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl md:p-8">
    <p class="text-xs font-black uppercase tracking-[0.24em] text-farm-gold">Password reset</p>
    <div v-if="success" class="mt-6 text-center">
      <h1 class="text-2xl font-black text-os-fg">Password reset successfully</h1>
      <p class="mt-3 leading-7 text-slate-400">You can now sign in to your Trovara account with your new password.</p>
      <RouterLink to="/" class="mt-6 inline-flex rounded-xl bg-farm-green px-6 py-3 text-sm font-bold text-white">Go to account</RouterLink>
    </div>
    <div v-else class="mt-6">
      <h1 class="text-2xl font-black text-os-fg">Set your new password</h1>
      <div v-if="error" class="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
        {{ error }}
      </div>
      <form v-if="token" class="mt-6 grid gap-4" @submit.prevent="submitReset">
        <label class="text-sm font-bold text-os-fg">
          New password
          <input
            v-model="form.password"
            required
            type="password"
            minlength="8"
            autocomplete="new-password"
            class="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 font-normal text-white outline-none focus:border-farm-green"
          />
        </label>
        <label class="text-sm font-bold text-os-fg">
          Confirm new password
          <input
            v-model="form.confirmPassword"
            required
            type="password"
            minlength="8"
            autocomplete="new-password"
            class="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 font-normal text-white outline-none focus:border-farm-green"
          />
        </label>
        <button type="submit" class="rounded-xl bg-farm-green py-3 text-sm font-bold text-white" :disabled="busy">
          {{ busy ? 'Resetting password…' : 'Reset password' }}
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-slate-500">
        <RouterLink to="/" class="font-bold text-farm-green hover:underline">Back to account</RouterLink>
      </p>
    </div>
  </div>
</template>
