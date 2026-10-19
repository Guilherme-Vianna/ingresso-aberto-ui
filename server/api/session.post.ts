// Recebe o ID token do Firebase (client) e o guarda em cookie httpOnly para o SSR.
export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken?: string }>(event)
  if (!idToken) throw createError({ statusCode: 400, statusMessage: 'idToken ausente' })
  let claims
  try {
    claims = await verifyIdToken(idToken)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido' })
  }
  setCookie(event, SESSION_COOKIE, idToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: Math.max(claims.exp - Math.floor(Date.now() / 1000), 0),
  })
  const { exp: _exp, ...user } = claims
  return user
})
