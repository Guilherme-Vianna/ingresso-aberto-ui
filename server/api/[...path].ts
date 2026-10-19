// Proxy autenticado para a API (evita CORS e mantém a URL da API só no servidor).
export default defineEventHandler((event) => {
  if (!event.context.user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  const { apiBase } = useRuntimeConfig()
  const url = getRequestURL(event)

  // Evita o app chamar a si mesmo (NUXT_API_BASE apontando para a porta do próprio Nuxt),
  // o que resultaria em "Page not found" em vez de um erro útil.
  if (new URL(apiBase).host === url.host) {
    throw createError({
      statusCode: 500,
      statusMessage: `NUXT_API_BASE (${apiBase}) aponta para este próprio app. Aponte para a URL da API.`,
    })
  }

  // A API valida o ID token do Firebase via `Authorization: Bearer`; ele vive no cookie httpOnly.
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

  const path = url.pathname.replace(/^\/api\//, '')
  return proxyRequest(event, `${apiBase.replace(/\/$/, '')}/${path}${url.search}`, {
    // `cookie` vazio: o cookie de sessão não precisa chegar à API.
    headers: { authorization: `Bearer ${token}`, cookie: '' },
  })
})
