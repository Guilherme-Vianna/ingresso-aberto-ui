// Hidrata o estado do usuário a partir do que o servidor (SSR) já validou.
export default defineNuxtPlugin(() => {
  const user = useState<SessionUser | null>('user', () => null)
  if (import.meta.server) {
    user.value = useRequestEvent()?.context.user ?? null
  }
})
