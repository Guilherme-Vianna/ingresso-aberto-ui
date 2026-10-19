// Renova o cookie de sessão sempre que o Firebase trocar o ID token (~1h).
export default defineNuxtPlugin(() => {
  const { user, watchTokens } = useAuth()
  watchTokens()
  watch(user, (u) => {
    if (u && useRoute().path === '/login') navigateTo('/')
  })
})
