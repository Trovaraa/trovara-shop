<script setup lang="ts">
import { TROVARA_CAREERS_URL } from '@/lib/public-links'
</script>

<template>
  <aside class="hiring-banner overflow-hidden bg-farm-gold text-slate-950" aria-label="Trovara Farm careers">
    <a
      :href="TROVARA_CAREERS_URL"
      class="group block min-h-11 py-3 font-black uppercase tracking-[0.16em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
    >
      <span class="hiring-banner-track flex w-max items-center whitespace-nowrap text-xs sm:text-sm">
        <span class="flex items-center gap-5 px-5">
          <span>We’re hiring</span>
          <span aria-hidden="true">•</span>
          <span class="normal-case tracking-normal underline decoration-2 underline-offset-4 group-hover:no-underline">Explore open roles at Trovara Farm</span>
          <span aria-hidden="true">→</span>
        </span>
        <span class="flex items-center gap-5 px-5" aria-hidden="true">
          <span>We’re hiring</span>
          <span>•</span>
          <span class="normal-case tracking-normal underline decoration-2 underline-offset-4 group-hover:no-underline">Explore open roles at Trovara Farm</span>
          <span>→</span>
        </span>
        <span class="flex items-center gap-5 px-5" aria-hidden="true">
          <span>We’re hiring</span>
          <span>•</span>
          <span class="normal-case tracking-normal underline decoration-2 underline-offset-4 group-hover:no-underline">Explore open roles at Trovara Farm</span>
          <span>→</span>
        </span>
      </span>
    </a>
  </aside>
</template>

<style scoped>
.hiring-banner-track {
  animation: hiring-banner-scroll 22s linear infinite;
  will-change: transform;
}

.hiring-banner:hover .hiring-banner-track,
.hiring-banner:focus-within .hiring-banner-track {
  animation-play-state: paused;
}

@keyframes hiring-banner-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-33.3333%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hiring-banner-track {
    animation: none;
    width: 100%;
    justify-content: center;
  }

  .hiring-banner-track > :not(:first-child) {
    display: none;
  }
}
</style>
