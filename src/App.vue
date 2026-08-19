<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
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
        <a
          :href="FARM_ORIGIN"
          class="text-sm font-semibold text-slate-400 hover:text-white"
        >
          trovara.farm
        </a>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <RouterView />
    </main>
  </div>
</template>
