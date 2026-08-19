<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <svg
    :class="$props.class"
    viewBox="0 0 520 420"
    role="img"
    aria-labelledby="shop-hero-title shop-hero-desc"
  >
    <title id="shop-hero-title">Trovara Farm Account</title>
    <desc id="shop-hero-desc">Shopping bags and a harvest crate for customer orders.</desc>
    <defs>
      <radialGradient id="shopGlow" cx="70%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#2d9960" stop-opacity=".28" />
        <stop offset="100%" stop-color="#07140f" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="520" height="420" rx="32" fill="url(#shopGlow)" />

    <!-- Crate -->
    <g transform="translate(48 248)">
      <rect x="0" y="28" width="196" height="92" rx="10" fill="#31483C" />
      <rect x="8" y="36" width="180" height="76" rx="6" fill="none" stroke="#889058" stroke-width="3" />
      <path d="M8 62h180M8 86h180M56 36v76M140 36v76" fill="none" stroke="#889058" stroke-width="2.5" opacity=".7" />
      <rect x="18" y="0" width="70" height="48" rx="10" fill="#B8C27A" />
      <rect x="78" y="8" width="58" height="42" rx="10" fill="#e8a427" />
      <rect x="128" y="4" width="52" height="46" rx="10" fill="#2d9960" />
    </g>

    <!-- Small tote -->
    <g transform="translate(78 148)">
      <path d="M28 18c0-18 14-30 32-30s32 12 32 30" fill="none" stroke="#B8C27A" stroke-width="10" stroke-linecap="round" />
      <path d="M8 28h104l-10 118H18Z" fill="#889058" />
      <path d="M22 48h76" fill="none" stroke="#FAF9F5" stroke-width="4" opacity=".35" />
    </g>

    <!-- Main shopping bag -->
    <g transform="translate(228 52)">
      <path d="M62 38c0-28 22-48 50-48s50 20 50 48" fill="none" stroke="#B8C27A" stroke-width="14" stroke-linecap="round" />
      <path d="M18 52h176l-16 214H34Z" fill="#2d9960" />
      <path d="M34 52h144l-14 214H48Z" fill="#1f6b42" />
      <rect x="78" y="118" width="58" height="58" rx="12" fill="#FAF9F5" />
      <path fill="#28382F" d="M90 130h42v10h-2c0-6-4-8-10-8h-7v42c0 5 2 7 6 8v1H99v-1c4-1 6-3 6-8v-42h-7c-6 0-10 2-10 8h-2z" />
      <path d="M42 86h128" fill="none" stroke="#FAF9F5" stroke-width="5" opacity=".28" />
      <!-- Price tag -->
      <g transform="translate(168 96) rotate(18)">
        <path d="M8 0h54l18 18v46H8Z" fill="#e8a427" />
        <circle cx="22" cy="16" r="5" fill="#28382F" />
        <path d="M16 36h38M16 48h28" fill="none" stroke="#28382F" stroke-width="4" stroke-linecap="round" />
      </g>
    </g>
  </svg>
</template>
