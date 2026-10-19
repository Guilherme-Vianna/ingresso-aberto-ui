import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onIdTokenChanged,
} from 'firebase/auth'

export interface SessionUser {
  uid: string
  email?: string
  name?: string
  picture?: string
}

function firebaseAuth() {
  const c = useRuntimeConfig().public
  const app = getApps()[0] ?? initializeApp({
    apiKey: c.firebaseApiKey,
    authDomain: c.firebaseAuthDomain,
    projectId: c.firebaseProjectId,
    appId: c.firebaseAppId,
  })
  return getAuth(app)
}

async function syncSession(idToken: string | null) {
  if (idToken) {
    return await $fetch<SessionUser>('/api/session', { method: 'POST', body: { idToken } })
  }
  await $fetch('/api/session', { method: 'DELETE' })
  return null
}

export function useAuth() {
  const user = useState<SessionUser | null>('user', () => null)

  /** Mantém o cookie do SSR renovado quando o Firebase troca o token (a cada ~1h). */
  function watchTokens() {
    return onIdTokenChanged(firebaseAuth(), async (fbUser) => {
      if (!fbUser) return
      try {
        user.value = await syncSession(await fbUser.getIdToken())
      } catch { /* mantém estado atual */ }
    })
  }

  async function finish(fbUser: import('firebase/auth').User) {
    user.value = await syncSession(await fbUser.getIdToken())
  }

  async function loginWithGoogle() {
    const { user: fb } = await signInWithPopup(firebaseAuth(), new GoogleAuthProvider())
    await finish(fb)
  }

  async function loginWithEmail(email: string, password: string) {
    const { user: fb } = await signInWithEmailAndPassword(firebaseAuth(), email, password)
    await finish(fb)
  }

  async function logout() {
    await signOut(firebaseAuth())
    await syncSession(null)
    user.value = null
    await navigateTo('/login')
  }

  return { user, watchTokens, loginWithGoogle, loginWithEmail, logout }
}
