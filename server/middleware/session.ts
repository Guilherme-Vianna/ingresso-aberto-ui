// Resolve o usuário a partir do cookie em toda requisição (páginas SSR e /api).
export default defineEventHandler(async (event) => {
  const path = event.path
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt') || path.includes('.')) return
  event.context.user = await getSessionUser(event)
})
