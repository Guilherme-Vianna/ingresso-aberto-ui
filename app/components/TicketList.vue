<script setup lang="ts">
import { Check, Pencil, Plus, Trash2, X } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{ eventId: string }>()

const PAGE_SIZE = 10
const page = ref(1)

// lazy: não bloqueia a página; mostra skeleton enquanto carrega.
// Pede uma linha a mais só para saber se existe próxima página (a API não devolve o total).
const { data, refresh, status } = useFetch('/api/event-tickets', {
  query: computed(() => ({
    eventId: props.eventId,
    limit: PAGE_SIZE + 1,
    offset: (page.value - 1) * PAGE_SIZE,
  })),
  key: `tickets-${props.eventId}`,
  lazy: true,
})
const rows = computed(() => unwrapList<TicketItem>(data.value))
const tickets = computed(() => rows.value.slice(0, PAGE_SIZE))
const hasNext = computed(() => rows.value.length > PAGE_SIZE)
const pending = computed(() => status.value === 'pending')
const loading = computed(() => pending.value && !data.value)

// removeu o último ingresso da página: volta uma página
watch([tickets, status], () => {
  if (status.value === 'success' && !tickets.value.length && page.value > 1) page.value--
})

const form = reactive({ name: '', code: '', price: '', maxQuantity: '' })

// Código sugerido: 3 primeiras letras do nome + 4 dígitos aleatórios. O sufixo fica fixo
// enquanto o formulário está aberto (não muda a cada tecla) e a sugestão para de acompanhar
// o nome assim que a pessoa edita o código; apagar o campo reativa a sugestão.
const randomDigits = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0')
const codeSuffix = ref(randomDigits())
const codeEdited = ref(false)

const suggestCode = (name: string) => {
  const letters = name.normalize('NFD').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  return letters ? letters + codeSuffix.value : ''
}

watch(() => form.name, (name) => {
  if (!codeEdited.value) form.code = suggestCode(name)
})

const onCodeInput = (e: Event) => {
  codeEdited.value = (e.target as HTMLInputElement).value !== ''
}

const err = ref('')
const editingId = ref<string | null>(null)
const draft = reactive({ name: '', code: '', price: '', maxQuantity: '' })
const confirmId = ref<string | null>(null)

const body = (f: typeof form) => ({
  name: f.name,
  code: f.code,
  price: brlToCents(f.price),
  maxQuantity: Number(f.maxQuantity),
})

async function run(fn: () => Promise<unknown>, success?: string) {
  err.value = ''
  try {
    await fn()
    await refresh()
    if (success) toast.success(success)
  } catch (e) {
    err.value = errMsg(e)
  }
}

const create = () => run(async () => {
  await $fetch('/api/event-tickets', { method: 'POST', body: { eventId: props.eventId, ...body(form) } })
  Object.assign(form, { name: '', code: '', price: '', maxQuantity: '' })
  codeEdited.value = false
  codeSuffix.value = randomDigits()
}, 'Ingresso adicionado')

function edit(t: TicketItem) {
  editingId.value = t.id
  Object.assign(draft, {
    name: t.name,
    code: t.code,
    price: brl(t.price),
    maxQuantity: String(t.maxQuantity),
  })
}

const save = (id: string) => run(async () => {
  await $fetch(`/api/event-tickets/${id}`, { method: 'PATCH', body: body(draft) })
  editingId.value = null
}, 'Ingresso atualizado')

const remove = (id: string) => {
  if (confirmId.value !== id) {
    confirmId.value = id
    return
  }
  confirmId.value = null
  return run(() => $fetch(`/api/event-tickets/${id}`, { method: 'DELETE' }), 'Ingresso removido')
}
</script>

<template>
  <div class="mt-4">
    <Separator class="mb-4" />
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Ingressos</h3>

    <div v-if="loading" class="grid gap-2">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
    </div>

    <p v-else-if="!tickets.length" class="mb-3 text-sm text-muted-foreground">Nenhum ingresso neste evento.</p>

    <TransitionGroup v-else name="list" tag="ul" class="relative mb-4 grid gap-2">
      <li
        v-for="t in tickets"
        :key="t.id"
        class="rounded-lg border bg-background/40 p-3 transition-colors duration-200 hover:border-primary/40 hover:bg-accent/30"
      >
        <form v-if="editingId === t.id" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="save(t.id)">
          <Input v-model="draft.name" placeholder="Nome" required />
          <Input v-model="draft.code" placeholder="Código" required />
          <CurrencyInput v-model="draft.price" placeholder="Preço (R$)" required />
          <Input v-model="draft.maxQuantity" type="number" min="1" placeholder="Qtd. máx." required />
          <div class="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button size="sm"><Check /> Salvar</Button>
            <Button type="button" variant="outline" size="sm" @click="editingId = null"><X /> Cancelar</Button>
          </div>
        </form>

        <div v-else class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span class="flex items-center gap-2">
            <strong>{{ t.name }}</strong>
            <Badge variant="outline" class="border-primary/40 font-mono text-primary">{{ t.code }}</Badge>
          </span>
          <span class="flex items-center gap-4">
            <span class="font-semibold text-primary">{{ brl(t.price) }}</span>
            <span class="text-sm text-muted-foreground">máx. {{ t.maxQuantity }}</span>
          </span>
          <span class="flex gap-2">
            <Button variant="outline" size="sm" @click="edit(t)"><Pencil /> Editar</Button>
            <Button
              :variant="confirmId === t.id ? 'destructive' : 'ghost'"
              size="sm"
              :class="confirmId === t.id ? '' : 'text-destructive hover:text-destructive'"
              @click="remove(t.id)"
              @blur="confirmId = null"
            >
              <Trash2 /> {{ confirmId === t.id ? 'Confirmar?' : 'Remover' }}
            </Button>
          </span>
        </div>
      </li>
    </TransitionGroup>

    <PaginationBar v-model:page="page" :has-next="hasNext" :loading="pending" class="mb-4" />

    <form class="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" @submit.prevent="create">
      <Input v-model="form.name" placeholder="Nome (ex: Pista)" required />
      <Input v-model="form.code" placeholder="Código" required @input="onCodeInput" />
      <CurrencyInput v-model="form.price" placeholder="Preço (R$)" required />
      <Input v-model="form.maxQuantity" type="number" min="1" placeholder="Qtd. máx." required />
      <Button><Plus /> Adicionar</Button>
    </form>
    <p v-if="err" class="mt-2 text-sm text-destructive">{{ err }}</p>
  </div>
</template>
