<script setup lang="ts">
import { CalendarDays, LogOut, Menu, Ticket } from '@lucide/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { user, logout } = useAuth()
const menuOpen = useState('menu-open', () => true)
const initial = computed(() => (user.value?.name || user.value?.email || '?')[0]?.toUpperCase())
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header
      class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-primary/20 bg-background/70 px-4 backdrop-blur-xl"
    >
      <Button variant="ghost" size="icon" aria-label="Menu" @click="menuOpen = !menuOpen">
        <Menu class="transition-transform duration-300" :class="menuOpen ? 'rotate-90' : 'rotate-0'" />
      </Button>

      <NuxtLink to="/" class="group flex flex-1 items-center gap-2.5 font-semibold tracking-tight">
        <span
          class="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_-4px] shadow-primary/60 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
        >
          <Ticket class="size-5" />
        </span>
        <span>Ingresso <span class="text-primary">Aberto</span></span>
      </NuxtLink>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="rounded-full outline-none ring-primary/60 transition-all duration-200 hover:scale-105 hover:ring-2 focus-visible:ring-2"
            aria-label="Perfil"
          >
            <Avatar class="size-10 border-2 border-primary">
              <AvatarImage v-if="user?.picture" :src="user.picture" referrerpolicy="no-referrer" />
              <AvatarFallback class="bg-primary font-semibold text-primary-foreground">
                {{ initial }}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-60">
          <DropdownMenuLabel class="grid">
            <span class="truncate">{{ user?.name || 'Perfil' }}</span>
            <span class="truncate text-xs font-normal text-muted-foreground">{{ user?.email }}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" @click="logout">
            <LogOut /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>

    <div class="relative flex flex-1">
      <!-- escurece o conteúdo quando o menu abre no mobile -->
      <Transition name="page">
        <div
          v-if="menuOpen"
          class="fixed inset-0 top-16 z-10 bg-black/60 backdrop-blur-sm md:hidden"
          @click="menuOpen = false"
        />
      </Transition>

      <aside
        class="fixed bottom-0 left-0 top-16 z-20 w-56 shrink-0 border-r bg-card/95 p-3 backdrop-blur transition-all duration-300 ease-out md:sticky md:bg-card/40"
        :class="menuOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:-ml-56'"
      >
        <nav class="grid gap-1">
          <NuxtLink
            to="/"
            class="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:translate-x-0.5 hover:bg-accent hover:text-accent-foreground"
            active-class="!bg-primary !text-primary-foreground shadow-[0_0_18px_-6px] shadow-primary"
          >
            <CalendarDays class="size-4" /> Eventos
          </NuxtLink>
        </nav>
      </aside>

      <main class="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
