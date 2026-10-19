<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>
  <Toaster position="top-right" rich-colors />
</template>
