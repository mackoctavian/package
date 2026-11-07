/** Shared fetch helper and response types for Admin → Translations. */

export const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'Something went wrong. Please try again.')
  return body.data as T
}

export type Status = 'missing' | 'partial' | 'complete' | 'outdated'

export type GroupSummary = {
  id: string
  label: string
  description: string
  total: number
  counts: Record<Status, number>
  canEdit: boolean
}

export type GroupItem = {
  id: string
  label: string
  detail: string | null
  status: Status
  translated: number
  required: number
  outdated: number
  updatedAt: string | null
  updatedBy: string | null
}

export type ListItem = Record<string, string>

export type EditorField = {
  key: string
  label: string
  kind: 'text' | 'long' | 'list'
  hint: string | null
  itemFields: { key: string; label: string; kind: 'text' | 'long' }[] | null
  source: string | ListItem[]
  value: string | ListItem[]
  required: boolean
  translated: boolean
  outdated: boolean
  updatedAt: string | null
  updatedBy: string | null
}

export type EditorRecord = {
  locale: string
  group: { id: string; label: string }
  record: { id: string; label: string; detail: string | null }
  status: Status
  translated: number
  required: number
  outdated: number
  fields: EditorField[]
  canEdit: boolean
}

export type UiEntry = {
  key: string
  namespace: string
  placeholders: string[]
  locales: Record<string, { builtIn: string | null; override: string | null; updatedAt: string | null; updatedBy: string | null }>
}

export type UiResponse = { scope: 'web' | 'mobile'; locales: string[]; entries: UiEntry[]; canEdit: boolean }

export const STATUS_LABELS: Record<Status, string> = {
  missing: 'Not translated',
  partial: 'In progress',
  complete: 'Translated',
  outdated: 'Needs review',
}

export const STATUS_TONES: Record<Status, string> = {
  missing: 'bg-slate-100 text-slate-600 ring-slate-200',
  partial: 'bg-amber-50 text-amber-700 ring-amber-200',
  complete: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  outdated: 'bg-rose-50 text-rose-700 ring-rose-200',
}
