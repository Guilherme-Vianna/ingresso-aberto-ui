<script setup lang="ts">
import { CalendarDays, CalendarX2, ChevronDown, Loader2, Plus, RefreshCw, Search, SearchX, X } from '@lucide/vue'
import { useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PAGE_SIZE = 10
const SEARCH_DELAY_MS = 500

// Filtros e página vivem na URL: voltar da tela de detalhes mantém a busca, e o link é compartilhável.
const FILTER_KEYS = ['search', 'startFrom', 'startTo', 'endFrom', 'endTo'] as const
const DATE_KEYS = ['startFrom', 'startTo', 'endFrom', 'endTo'] as const
type Filters = Record<(typeof FILTER_KEYS)[number], string>
const blankFilters = (): Filters => ({ search: '', startFrom: '', startTo: '', endFrom: '', endTo: '' })

const route = useRoute()
const router = useRouter()

const param = (k: string) => {
  const v = route.query[k]
  return typeof v === 'string' ? v : ''
}
const applied = computed<Filters>(() => {
  const f = blankFilters()
  for (const k of FILTER_KEYS) f[k] = param(k)
  return f
})
const page = computed(() => Math.max(1, Math.floor(Number(param('page'))) || 1))
const hasFilters = computed(() => FILTER_KEYS.some((k) => applied.value[k]))

// Os campos editam um rascunho; ele vira filtro (URL) 500 ms depois da última alteração.
const filters = reactive<Filters>({ ...applied.value })
watch(applied, (f) => Object.assign(filters, f))

function go(f: Filters, p: number) {
  const query: Record<string, string> = {}
  for (const k of FILTER_KEYS) {
    const v = f[k].trim()
    if (v) query[k] = v
  }
  if (p > 1) query.page = String(p)
  return router.push({ query })
}

// ignora quando o rascunho já é o filtro aplicado (ex.: sincronização ao voltar no histórico)
const draftMatchesApplied = () => FILTER_KEYS.every((k) => filters[k].trim() === applied.value[k])
const runSearch = () => {
  if (!draftMatchesApplied()) go(filters, 1)
}
const runSearchDebounced = useDebounceFn(runSearch, SEARCH_DELAY_MS)
watch(filters, () => runSearchDebounced())

const clearFilters = () => go(blankFilters(), 1)
const clearSearch = () => {
  filters.search = ''
  runSearch()
}

// filtros de data ficam recolhidos, a menos que algum esteja aplicado
const dateOpen = ref(DATE_KEYS.some((k) => applied.value[k]))
const dateCount = computed(() => DATE_KEYS.filter((k) => applied.value[k]).length)

// pede uma linha a mais só para saber se existe próxima página (a API não devolve o total)
const apiQuery = computed(() => {
  const f = applied.value
  return {
    limit: PAGE_SIZE + 1,
    offset: (page.value - 1) * PAGE_SIZE,
    search: f.search || undefined,
    startDateFrom: f.startFrom ? dayStartIso(f.startFrom) : undefined,
    startDateTo: f.startTo ? dayEndIso(f.startTo) : undefined,
    endDateFrom: f.endFrom ? dayStartIso(f.endFrom) : undefined,
    endDateTo: f.endTo ? dayEndIso(f.endTo) : undefined,
  }
})

const { data, refresh, error, status } = await useFetch('/api/events', { query: apiQuery })
const rows = computed(() => unwrapList<EventItem>(data.value))
const events = computed(() => rows.value.slice(0, PAGE_SIZE))
const hasNext = computed(() => rows.value.length > PAGE_SIZE)
const pending = computed(() => status.value === 'pending')

const dialogOpen = ref(false)
const form = reactive({ name: '', code: '', startDate: '', endDate: '' })
const formError = ref('')
const creating = ref(false)

// limpa o formulário sempre que o modal abre
watch(dialogOpen, (open) => {
  if (!open) return
  formError.value = ''
  Object.assign(form, { name: '', code: '', startDate: '', endDate: '' })
})

async function create() {
  formError.value = ''
  creating.value = true
  try {
    await $fetch('/api/events', {
      method: 'POST',
      body: {
        name: form.name,
        code: form.code,
        startDate: fromLocalInput(form.startDate),
        endDate: fromLocalInput(form.endDate),
      },
    })
    dialogOpen.value = false
    // os mais novos vêm primeiro: volta à página 1 sem filtros para o evento aparecer
    if (hasFilters.value || page.value > 1) await clearFilters()
    else await refresh()
    toast.success('Evento criado')
  } catch (e) {
    formError.value = errMsg(e)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Eventos</h1>
        <p class="text-sm text-muted-foreground">Crie eventos e gerencie os ingressos de cada um.</p>
      </div>
      <Button size="lg" @click="dialogOpen = true">
        <Plus /> Criar Novo Evento
      </Button>
    </div>

    <Card class="gap-0 p-4">
      <form class="grid gap-3" @submit.prevent="runSearch">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative min-w-0 flex-1 basis-64">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="filters.search"
              class="h-10 pl-9 pr-9"
              placeholder="Buscar por nome ou código…"
              aria-label="Buscar eventos por nome ou código"
              autocomplete="off"
              inputmode="search"
            />
            <Loader2
              v-if="pending"
              class="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            />
            <button
              v-else-if="filters.search"
              type="button"
              class="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Limpar busca"
              @click="clearSearch"
            >
              <X class="size-4" />
            </button>
          </div>

          <Button type="button" variant="outline" class="h-10" :aria-expanded="dateOpen" @click="dateOpen = !dateOpen">
            <CalendarDays /> Datas
            <Badge v-if="dateCount" class="ml-0.5 px-1.5">{{ dateCount }}</Badge>
            <ChevronDown class="transition-transform duration-300" :class="{ 'rotate-180': dateOpen }" />
          </Button>
          <Button v-if="hasFilters" type="button" variant="ghost" class="h-10" @click="clearFilters">
            <X /> Limpar
          </Button>
        </div>

        <Transition name="expand">
          <div v-if="dateOpen">
            <div class="min-h-0 overflow-hidden">
              <div class="grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4">
                <div class="grid gap-1.5">
                  <Label for="f-start-from">Início a partir de</Label>
                  <Input id="f-start-from" v-model="filters.startFrom" type="date" :max="filters.startTo || undefined" />
                </div>
                <div class="grid gap-1.5">
                  <Label for="f-start-to">Início até</Label>
                  <Input id="f-start-to" v-model="filters.startTo" type="date" :min="filters.startFrom || undefined" />
                </div>
                <div class="grid gap-1.5">
                  <Label for="f-end-from">Fim a partir de</Label>
                  <Input id="f-end-from" v-model="filters.endFrom" type="date" :max="filters.endTo || undefined" />
                </div>
                <div class="grid gap-1.5">
                  <Label for="f-end-to">Fim até</Label>
                  <Input id="f-end-to" v-model="filters.endTo" type="date" :min="filters.endFrom || undefined" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </form>
    </Card>

    <Alert v-if="error" variant="destructive" class="animate-fade-up">
      <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
        <span>Não foi possível carregar os eventos: {{ errMsg(error) }}</span>
        <Button variant="outline" size="sm" :disabled="pending" @click="refresh()">
          <RefreshCw :class="{ 'animate-spin': pending }" /> Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>

    <div
      v-else-if="!events.length && hasFilters"
      class="grid animate-fade-up place-items-center gap-3 rounded-xl border border-dashed border-primary/30 py-16 text-center"
    >
      <SearchX class="size-10 text-primary/70" />
      <div>
        <p class="font-medium">Nenhum evento encontrado</p>
        <p class="text-sm text-muted-foreground">Nenhum evento corresponde aos filtros aplicados.</p>
      </div>
      <Button variant="outline" @click="clearFilters"><X /> Limpar filtros</Button>
    </div>

    <div
      v-else-if="!events.length && page > 1"
      class="grid animate-fade-up place-items-center gap-3 rounded-xl border border-dashed border-primary/30 py-16 text-center"
    >
      <p class="font-medium">Esta página está vazia</p>
      <Button variant="outline" @click="go(applied, 1)">Voltar à primeira página</Button>
    </div>

    <div
      v-else-if="!events.length"
      class="grid animate-fade-up place-items-center gap-3 rounded-xl border border-dashed border-primary/30 py-16 text-center"
    >
      <CalendarX2 class="size-10 text-primary/70" />
      <div>
        <p class="font-medium">Nenhum evento ainda</p>
        <p class="text-sm text-muted-foreground">Crie o primeiro para começar a cadastrar ingressos.</p>
      </div>
      <Button variant="outline" @click="dialogOpen = true"><Plus /> Criar Novo Evento</Button>
    </div>

    <ul v-else class="grid gap-3 transition-opacity duration-200" :class="{ 'opacity-60': pending }">
      <li v-for="(ev, i) in events" :key="ev.id" class="animate-fade-up" :style="{ animationDelay: `${Math.min(i, 6) * 40}ms` }">
        <EventRow :event="ev" />
      </li>
    </ul>

    <PaginationBar :page="page" :has-next="hasNext" :loading="pending" @update:page="go(applied, $event)" />

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-lg">
        <form class="grid gap-5" @submit.prevent="create">
          <DialogHeader>
            <DialogTitle>Novo evento</DialogTitle>
            <DialogDescription>Preencha os dados para criar um evento.</DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-1.5 sm:col-span-2">
              <Label for="ev-name">Nome</Label>
              <Input id="ev-name" v-model="form.name" placeholder="Ex: Rock in Rio" required />
            </div>
            <div class="grid gap-1.5 sm:col-span-2">
              <Label for="ev-code">Código</Label>
              <Input id="ev-code" v-model="form.code" placeholder="Ex: RIR-2026" required />
            </div>
            <div class="grid gap-1.5">
              <Label for="ev-start">Início</Label>
              <Input id="ev-start" v-model="form.startDate" type="datetime-local" required />
            </div>
            <div class="grid gap-1.5">
              <Label for="ev-end">Fim</Label>
              <Input id="ev-end" v-model="form.endDate" type="datetime-local" required />
            </div>
          </div>

          <Transition name="expand">
            <div v-if="formError">
              <p class="overflow-hidden text-sm text-destructive">{{ formError }}</p>
            </div>
          </Transition>

          <DialogFooter>
            <Button type="button" variant="outline" @click="dialogOpen = false">Cancelar</Button>
            <Button :disabled="creating">
              <Loader2 v-if="creating" class="animate-spin" />
              Criar evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
