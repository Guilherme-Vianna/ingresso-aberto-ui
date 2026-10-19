<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'

// A API não devolve o total, só a lista; por isso é "Anterior / Próxima" e não números de página.
const props = defineProps<{ page: number; hasNext: boolean; loading?: boolean }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()
</script>

<template>
  <nav v-if="props.page > 1 || props.hasNext" class="flex items-center justify-between gap-3" aria-label="Paginação">
    <Button
      variant="outline"
      size="sm"
      :disabled="props.page <= 1 || props.loading"
      @click="emit('update:page', props.page - 1)"
    >
      <ChevronLeft /> Anterior
    </Button>
    <span class="text-sm text-muted-foreground">Página {{ props.page }}</span>
    <Button
      variant="outline"
      size="sm"
      :disabled="!props.hasNext || props.loading"
      @click="emit('update:page', props.page + 1)"
    >
      Próxima <ChevronRight />
    </Button>
  </nav>
</template>
