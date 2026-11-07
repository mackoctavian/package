
import prisma from '@/lib/prisma'
import { LOCALES, SOURCE_LOCALE, type Locale } from '@/i18n/config'
import { DEFAULT_MESSAGES } from '@/i18n/messages'
import { flattenMessages, type MessageTree } from '@/i18n/translate'
import { mobileMessages } from '../../../mobile/src/i18n/messages'
import { readSourceField, sourceHash } from './content'
import type { TranslatableField, TranslationGroup } from './entities'

/**
 * Data access for Admin → Translations.
 *
 * Content: each translatable record is compared against its stored
 * translations to work out a status per language:
 *   missing   – nothing translated yet
 *   partial   – some fields translated
 *   complete  – every field that has English text is translated
 *   outdated  – a translated field's English source changed since (sourceHash)
 *
 * Interface text: built-in strings live in code (website message files and
 * the mobile app's catalogue); a row in `ui_translations` overrides one key
 * for one language.
 */

export const TARGET_LOCALES = LOCALES.filter((locale) => locale !== SOURCE_LOCALE)

export type TranslationStatus = 'missing' | 'partial' | 'complete' | 'outdated'

export type SourceRecord = { id: string; label: string; detail: string | null; source: Record<string, unknown> }

type Row = Record<string, unknown> & { id: string }

const asText = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value))
const truncate = (value: string, length = 90) => (value.length > length ? `${value.slice(0, length - 1)}…` : value)

const SELECTS = {
  retreat: () =>
    prisma.retreat.findMany({ orderBy: { createdAt: 'desc' } }).then((rows) =>
      rows.map((row) => ({ row: row as unknown as Row, label: row.title, detail: row.dateRange })),
    ),
  ministry: () =>
    prisma.ministry.findMany({ orderBy: [{ order: 'asc' }, { title: 'asc' }] }).then((rows) =>
      rows.map((row) => ({ row: row as unknown as Row, label: row.title, detail: row.isActive ? null : 'Hidden' })),
    ),
  hero_slide: () =>
    prisma.heroSlide.findMany({ orderBy: { order: 'asc' } }).then((rows) =>
      rows.map((row, index) => ({ row: row as unknown as Row, label: row.title || `Slide ${index + 1}`, detail: row.isActive ? null : 'Hidden' })),
    ),
  patron: () =>
    prisma.patron.findMany({ orderBy: { order: 'asc' } }).then((rows) =>
      rows.map((row) => ({ row: row as unknown as Row, label: row.name, detail: row.title })),
    ),
  testimonial: () =>
    prisma.testimonial.findMany({ orderBy: { order: 'asc' } }).then((rows) =>
      rows.map((row) => ({ row: row as unknown as Row, label: row.name, detail: truncate(row.quote, 70) })),
    ),
  content: (contentType: string) =>
    prisma.contentItem.findMany({ where: { type: contentType }, orderBy: { updatedAt: 'desc' } }).then((rows) =>
      rows.map((row) => ({
        row: row as unknown as Row,
        label: row.title,
        detail: [row.status === 'published' ? null : row.status, row.category].filter(Boolean).join(' · ') || null,
      })),
    ),
}

const toSource = (group: TranslationGroup, row: Row): Record<string, unknown> =>
  Object.fromEntries(group.fields.map((field) => [field.key, readSourceField(row, field.key)]))

/** Every record in a group, with the English value of each translatable field. */
export const loadGroupRecords = async (group: TranslationGroup, id?: string): Promise<SourceRecord[]> => {
  const rows = group.entity === 'content' ? await SELECTS.content(group.contentType ?? '') : await SELECTS[group.entity]()
  return rows
    .filter((item) => !id || item.row.id === id)
    .map((item) => ({ id: item.row.id, label: asText(item.label) || 'Untitled', detail: item.detail ? asText(item.detail) : null, source: toSource(group, item.row) }))
}

/** True when an English value has something to translate. */
export const hasSourceText = (field: TranslatableField, value: unknown) => {
  if (field.kind === 'list') {
    if (!Array.isArray(value)) return false
    return value.some((item) =>
      typeof item === 'string' ? item.trim() : item && typeof item === 'object' && (field.itemFields ?? []).some((sub) => asText((item as Row)[sub.key]).trim()),
    )
  }
  return asText(value).trim().length > 0
}

export type StoredTranslation = { field: string; value: string; sourceHash: string | null; updatedAt: Date; updatedBy: string | null }

export const loadTranslations = async (group: TranslationGroup, locale: Locale, ids: string[]) => {
  const byRecord = new Map<string, Map<string, StoredTranslation>>()
  if (!ids.length) return byRecord
  const fieldKeys = group.fields.map((field) => field.key)
  const rows = await prisma.contentTranslation.findMany({
    where: { entity: group.entity, locale, entityId: { in: ids }, field: { in: fieldKeys } },
    select: { entityId: true, field: true, value: true, sourceHash: true, updatedAt: true, updatedBy: true },
  })
  for (const row of rows) {
    const map = byRecord.get(row.entityId) ?? new Map<string, StoredTranslation>()
    map.set(row.field, row)
    byRecord.set(row.entityId, map)
  }
  return byRecord
}

export type FieldState = { required: boolean; translated: boolean; outdated: boolean }

export const fieldStates = (group: TranslationGroup, record: SourceRecord, stored: Map<string, StoredTranslation> | undefined) =>
  group.fields.map((field): FieldState & { key: string } => {
    const source = record.source[field.key]
    const required = hasSourceText(field, source)
    const translation = stored?.get(field.key)
    const translated = Boolean(translation?.value.trim())
    const outdated = Boolean(translated && required && translation?.sourceHash && translation.sourceHash !== sourceHash(source))
    return { key: field.key, required, translated, outdated }
  })

export const statusOf = (states: FieldState[]): { status: TranslationStatus; translated: number; required: number; outdated: number } => {
  const required = states.filter((state) => state.required)
  const translated = required.filter((state) => state.translated).length
  const outdated = required.filter((state) => state.outdated).length
  const status: TranslationStatus = outdated
    ? 'outdated'
    : translated === 0
      ? required.length === 0
        ? 'complete'
        : 'missing'
      : translated < required.length
        ? 'partial'
        : 'complete'
  return { status, translated, required: required.length, outdated }
}

/* ------------------------------------------------------------------ interface text */

export type UiScope = 'web' | 'mobile'
export const UI_SCOPES: UiScope[] = ['web', 'mobile']

const flatten = (tree: unknown) => flattenMessages(tree as MessageTree)

const BUILT_IN: Record<UiScope, Record<Locale, Record<string, string>>> = {
  web: { en: flatten(DEFAULT_MESSAGES.en), sw: flatten(DEFAULT_MESSAGES.sw) },
  mobile: { en: flatten(mobileMessages.en), sw: flatten(mobileMessages.sw) },
}

/** Built-in text for a scope and language, keyed by dotted key. */
export const builtInMessages = (scope: UiScope, locale: Locale) => BUILT_IN[scope][locale]

export const isUiKey = (scope: UiScope, key: string) => key in BUILT_IN[scope][SOURCE_LOCALE]

/** `{name}` placeholders used in a message; a translation must keep the same ones. */
export const placeholdersOf = (value: string) => [...new Set(value.match(/\{(\w+)\}/g) ?? [])].sort()
