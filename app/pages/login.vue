<script setup lang="ts">
import { Loader2, Ticket } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

definePageMeta({ layout: false })
const { loginWithGoogle, loginWithEmail } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function run(fn: () => Promise<void>) {
  error.value = ''
  busy.value = true
  try {
    await fn()
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.code?.replace('auth/', '').replaceAll('-', ' ') || e?.message || 'Falha no login'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="relative grid min-h-screen place-items-center overflow-hidden p-4">
    <!-- brilhos decorativos -->
    <div class="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
    <div class="pointer-events-none absolute -right-32 bottom-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />

    <Card class="relative w-full max-w-sm animate-fade-up border-primary/20 shadow-2xl shadow-primary/5">
      <CardHeader class="items-center text-center">
        <div
          class="mb-2 grid size-16 animate-float place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_40px_-8px] shadow-primary"
        >
          <Ticket class="size-8" />
        </div>
        <CardTitle class="text-2xl tracking-tight">
          Ingresso <span class="text-primary">Aberto</span>
        </CardTitle>
        <CardDescription>Entre para gerenciar seus eventos</CardDescription>
      </CardHeader>

      <CardContent>
        <form class="grid gap-3" @submit.prevent="run(() => loginWithEmail(email, password))">
          <Button type="button" size="lg" :disabled="busy" @click="run(loginWithGoogle)">
            <Loader2 v-if="busy" class="animate-spin" />
            Entrar com Google
          </Button>

          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator class="flex-1" /> ou <Separator class="flex-1" />
          </div>

          <Input v-model="email" type="email" placeholder="E-mail" autocomplete="username" required />
          <Input v-model="password" type="password" placeholder="Senha" autocomplete="current-password" required />
          <Button variant="outline" size="lg" :disabled="busy">Entrar</Button>

          <Transition name="expand">
            <div v-if="error">
              <p class="overflow-hidden text-center text-sm text-destructive">{{ error }}</p>
            </div>
          </Transition>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
