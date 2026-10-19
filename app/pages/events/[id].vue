<script setup lang="ts">
import { ArrowLeft, CalendarDays, CalendarX2, Pencil, Trash2 } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data: event, refresh, error } = await useFetch<EventItem>(() => `/api/events/${id.value}`)

const editing = ref(false)
const confirmDel = ref(false)
const err = ref('')
const draft = reactive({ name: '', code: '', startDate: '', endDate: '' })

function startEdit() {
  if (!event.value) return
  Object.assign(draft, {
    name: event.value.name,
    code: event.value.code,
    startDate: toLocalInput(event.value.startDate),
    endDate: toLocalInput(event.value.endDate),
  })
  err.value = ''
  editing.value = true
}

async function save() {
  err.value = ''
  try {
    await $fetch(`/api/events/${id.value}`, {
      method: 'PATCH',
      body: {
        name: draft.name,
        code: draft.code,
        startDate: fromLocalInput(draft.startDate),
        endDate: fromLocalInput(draft.endDate),
      },
    })
    editing.value = false
    await refresh()
    toast.success('Evento atualizado')
  } catch (e) {
    err.value = errMsg(e)
  }
}

async function remove() {
  if (!confirmDel.value) {
    confirmDel.value = true
    return
  }
  try {
    await $fetch(`/api/events/${id.value}`, { method: 'DELETE' })
    toast.success('Evento removido')
    await navigateTo('/')
  } catch (e) {
    err.value = errMsg(e)
    confirmDel.value = false
  }
}

useHead({ title: computed(() => (event.value ? `${event.value.name} · Ingresso Aberto` : 'Evento · Ingresso Aberto')) })
</script>

<template>
  <section class="grid gap-6">
    <div>
      <Button variant="ghost" size="sm" as-child class="-ml-2">
        <NuxtLink to="/"><ArrowLeft /> Eventos</NuxtLink>
      </Button>
    </div>

    <div
      v-if="error || !event"
      class="grid animate-fade-up place-items-center gap-3 rounded-xl border border-dashed border-primary/30 py-16 text-center"
    >
      <CalendarX2 class="size-10 text-primary/70" />
      <div>
        <p class="font-medium">Evento não encontrado</p>
        <p class="text-sm text-muted-foreground">{{ error ? errMsg(error) : 'Ele pode ter sido removido.' }}</p>
      </div>
      <Button variant="outline" as-child><NuxtLink to="/">Voltar para eventos</NuxtLink></Button>
    </div>

    <Card v-else class="animate-fade-up gap-0 p-5">
      <form v-if="editing" class="grid gap-2 sm:grid-cols-2" @submit.prevent="save">
        <Input v-model="draft.name" placeholder="Nome" required />
        <Input v-model="draft.code" placeholder="Código" required />
        <Input v-model="draft.startDate" type="datetime-local" required />
        <Input v-model="draft.endDate" type="datetime-local" required />
        <div class="flex gap-2 sm:col-span-2">
          <Button>Salvar</Button>
          <Button type="button" variant="outline" @click="editing = false">Cancelar</Button>
        </div>
      </form>

      <div v-else class="flex flex-wrap items-start justify-between gap-3">
        <div class="grid min-w-0 gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight">{{ event.name }}</h1>
            <Badge variant="outline" class="border-primary/40 font-mono text-primary">{{ event.code }}</Badge>
          </div>
          <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays class="size-4" />
            {{ fmtDate(event.startDate) }} → {{ fmtDate(event.endDate) }}
          </span>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="startEdit"><Pencil /> Editar</Button>
          <Button
            :variant="confirmDel ? 'destructive' : 'ghost'"
            size="sm"
            :class="confirmDel ? '' : 'text-destructive hover:text-destructive'"
            @click="remove"
            @blur="confirmDel = false"
          >
            <Trash2 /> {{ confirmDel ? 'Confirmar?' : 'Remover' }}
          </Button>
        </div>
      </div>

      <Alert v-if="err" variant="destructive" class="mt-3">
        <AlertDescription>{{ err }}</AlertDescription>
      </Alert>

      <TicketList v-if="!editing" :event-id="event.id" />
    </Card>
  </section>
</template>
