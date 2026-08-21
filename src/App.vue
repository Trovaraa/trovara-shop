<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HiringBanner from '@/components/HiringBanner.vue'
import ShopFooter from '@/components/ShopFooter.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import TrovaraLogo from '@/components/TrovaraLogo.vue'
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
    <HiringBanner />
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <RouterView />
    </main>
    <ShopFooter />
  </div>
</template>
