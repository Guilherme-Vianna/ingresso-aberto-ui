export interface EventItem {
  id: string
  name: string
  code: string
  startDate: string
  endDate: string
}
export interface TicketItem {
  id: string
  eventId: string
  name: string
  code: string
  price: number // centavos
  maxQuantity: number
}

/** Aceita tanto `[...]` quanto `{ data | items: [...] }`. */
export function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const r = res as { data?: T[]; items?: T[] } | null
  return r?.data ?? r?.items ?? []
}

export const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Máscara de moeda: mantém só os dígitos e os lê como centavos ("1234" → "R$ 12,34"). */
export const maskBrl = (v: string) => {
  const digits = v.replace(/\D/g, '')
  return digits ? brl(Number(digits)) : ''
}
/** Inverso de `maskBrl`: "R$ 1.234,56" → 123456. */
export const brlToCents = (v: string) => Number(v.replace(/\D/g, ''))

// Fuso fixo para SSR e cliente renderizarem o mesmo texto.
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })

// Filtros de data (`<input type="date">`) viram o dia inteiro, no mesmo fuso fixo de `fmtDate`
// (os limites da API são inclusivos).
export const dayStartIso = (day: string) => new Date(`${day}T00:00:00.000-03:00`).toISOString()
export const dayEndIso = (day: string) => new Date(`${day}T23:59:59.999-03:00`).toISOString()

export const toLocalInput =(iso: string) => {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
export const fromLocalInput = (v: string) => new Date(v).toISOString()

export function errMsg(e: any) {
  const m = e?.data?.message
  return Array.isArray(m) ? m.join(', ') : m || e?.statusMessage || e?.message || 'Erro inesperado'
}
