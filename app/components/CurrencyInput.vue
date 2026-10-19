<script setup lang="ts">
import { cn } from '@/lib/utils'

// <input> nativo (e não o Input do shadcn): o v-model passivo dele não reaplica o
// valor mascarado quando o usuário digita um caractere que a máscara descarta.
const props = defineProps<{ modelValue: string; class?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  el.value = maskBrl(el.value)
  emit('update:modelValue', el.value)
}
</script>

<template>
  <input
    :value="props.modelValue"
    inputmode="numeric"
    autocomplete="off"
    data-slot="input"
    :class="cn(
      'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      props.class,
    )"
    @input="onInput"
  >
</template>
