import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'session'

export interface SessionUser {
  uid: string
  email?: string
  name?: string
  picture?: string
}

const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

/** Valida um ID token do Firebase (assinatura, issuer, audience e expiração). */
export async function verifyIdToken(token: string): Promise<SessionUser & { exp: number }> {
  const projectId = useRuntimeConfig().public.firebaseProjectId
  if (!projectId) throw new Error('NUXT_PUBLIC_FIREBASE_PROJECT_ID não configurado')
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  })
  return {
    uid: payload.sub as string,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
    exp: payload.exp as number,
  }
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  try {
    const { exp: _exp, ...user } = await verifyIdToken(token)
    return user
  } catch {
    return null
  }
}
