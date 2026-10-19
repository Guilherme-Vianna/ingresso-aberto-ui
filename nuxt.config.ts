import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: false },
  devServer: { port: 3005 },
  modules: ['shadcn-nuxt'],
  css: ['~/assets/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  // Valores vêm do arquivo .env (veja .env.example)
  runtimeConfig: {
    apiBase: 'http://localhost:3000', // NUXT_API_BASE
    public: {
      firebaseApiKey: '', // NUXT_PUBLIC_FIREBASE_API_KEY
      firebaseAuthDomain: '', // NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      firebaseProjectId: '', // NUXT_PUBLIC_FIREBASE_PROJECT_ID
      firebaseAppId: '', // NUXT_PUBLIC_FIREBASE_APP_ID
    },
  },
  app: {
    head: {
      title: 'Ingresso Aberto',
      htmlAttrs: { lang: 'pt-BR', class: 'dark' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/ticket-icon.svg' }],
    },
  },
})
