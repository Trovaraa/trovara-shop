<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import TrovaraLogo from '@/components/TrovaraLogo.vue'
import { FARM_ORIGIN } from '@/lib/farm'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-[#07140f] to-farm-green-dark/20">
    <header class="border-b border-slate-800 bg-[#10221a]/95">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <RouterLink to="/" class="min-h-11">
          <TrovaraLogo />
        </RouterLink>
        <ThemeSwitcher compact />
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <RouterView />
    </main>
    <footer class="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      <a
        :href="FARM_ORIGIN"
        class="text-xs font-semibold text-os-fg-muted hover:text-os-fg"
      >
        Farm website
      </a>
    </footer>
  </div>
</template>
