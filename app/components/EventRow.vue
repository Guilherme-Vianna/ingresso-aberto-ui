<script setup lang="ts">
import { CalendarDays, ChevronRight } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'

defineProps<{ event: EventItem }>()
</script>

<template>
  <NuxtLink
    :to="`/events/${event.id}`"
    class="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
  >
    <span class="grid min-w-0 gap-1">
      <span class="flex flex-wrap items-center gap-2">
        <strong class="truncate text-base transition-colors group-hover:text-primary">{{ event.name }}</strong>
        <Badge variant="outline" class="border-primary/40 font-mono text-primary">{{ event.code }}</Badge>
      </span>
      <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays class="size-3.5" />
        {{ fmtDate(event.startDate) }} → {{ fmtDate(event.endDate) }}
      </span>
    </span>
    <ChevronRight class="size-5 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
  </NuxtLink>
</template>
