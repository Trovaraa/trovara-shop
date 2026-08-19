<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getActiveTheme, setTheme, type ThemeMode } from '@/lib/theme'

defineProps<{ compact?: boolean }>()

const mode = ref<ThemeMode>('dark')

onMounted(() => {
  mode.value = getActiveTheme()
})

function select(next: ThemeMode) {
  if (mode.value === next) return
  setTheme(next)
  mode.value = next
}
</script>

<template>
  <div
    class="inline-flex shrink-0 rounded-lg border p-0.5"
    :class="mode === 'light' ? 'border-slate-200 bg-slate-100' : 'border-slate-700 bg-slate-800/80'"
    role="group"
    aria-label="Theme"
  >
    <button
      type="button"
      class="grid place-items-center rounded-md transition-colors"
      :class="[
        compact ? 'h-7 w-7' : 'h-9 w-9',
        mode === 'dark' ? 'bg-farm-green text-white' : 'text-slate-500 hover:text-slate-800',
      ]"
      :aria-pressed="mode === 'dark'"
      aria-label="Dark mode"
      title="Dark mode"
      @click="select('dark')"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
    <button
      type="button"
      class="grid place-items-center rounded-md transition-colors"
      :class="[
        compact ? 'h-7 w-7' : 'h-9 w-9',
        mode === 'light' ? 'bg-farm-green text-white' : 'text-slate-400 hover:text-white',
      ]"
      :aria-pressed="mode === 'light'"
      aria-label="Light mode"
      title="Light mode"
      @click="select('light')"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    </button>
  </div>
</template>
