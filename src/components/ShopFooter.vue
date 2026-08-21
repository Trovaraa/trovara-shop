<script setup lang="ts">
import TrovaraLogo from '@/components/TrovaraLogo.vue'
import {
  TROVARA_CAREERS_URL,
  TROVARA_SOCIAL_LINKS,
  TROVARA_WEBSITE_URL,
} from '@/lib/public-links'
</script>

<template>
  <footer class="border-t border-slate-800 bg-[#10221a]/95">
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div>
        <a :href="TROVARA_WEBSITE_URL" class="inline-flex min-h-11 items-center" aria-label="Visit Trovara Farm">
          <TrovaraLogo />
        </a>
        <p class="mt-3 max-w-md text-sm leading-6 text-slate-400">
          Follow the farm for harvest updates, food stories, and new product announcements.
        </p>
        <nav class="mt-5 flex flex-wrap gap-2" aria-label="Trovara Farm social media">
          <a
            v-for="social in TROVARA_SOCIAL_LINKS"
            :key="social.label"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-os-fg transition-colors hover:border-farm-green hover:bg-farm-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-green"
          >
            {{ social.label }}
          </a>
        </nav>
      </div>

      <div class="md:text-right">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-farm-gold">Grow with Trovara</p>
        <a
          :href="TROVARA_CAREERS_URL"
          class="mt-3 inline-flex min-h-11 items-center rounded-xl bg-farm-green px-5 py-3 text-sm font-black text-white hover:bg-farm-green-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-green"
        >
          View open roles <span class="ml-2" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </footer>
</template>
