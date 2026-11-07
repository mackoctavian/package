import { createHash } from 'node:crypto'
import { cache } from 'react'

import prisma from '@/lib/prisma'
import { SOURCE_LOCALE, type Locale } from '@/i18n/config'
import { fieldsForEntity, type StoredEntity } from './entities'

/**
 * Applies stored translations to records loaded from the database. English
 * is always the source: when a field has no translation, the English text is
 * kept, so partially translated content still renders completely.
 */

type TranslationMap = Map<string, Record<string, string>>

const loadTranslations = cache(async (entity: StoredEntity, locale: Locale, idsKey: string): Promise<TranslationMap> => {
  const map: TranslationMap = new Map()
  const ids = idsKey ? idsKey.split('|') : []
  if (!ids.length) return map
  try {
    const rows = await prisma.contentTranslation.findMany({
      where: { entity, locale, entityId: { in: ids } },
      select: { entityId: true, field: true, value: true },
    })
    for (const row of rows) {
      if (!row.value.trim()) continue
      const fields = map.get(row.entityId) ?? {}
      fields[row.field] = row.value
      map.set(row.entityId, fields)
    }
  } catch (error) {
    // Missing table (SQL not run yet) or database hiccup: show English.
    console.error(`[i18n] could not load ${entity} translations`, error instanceof Error ? error.message : error)
  }
  return map
})

type Item = Record<string, unknown> & { id: string }

const parseList = (value: string): Record<string, unknown>[] | null => {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Merges a translated list onto the English one, item by item and field by field. */
const mergeList = (english: unknown, translated: Record<string, unknown>[]) => {
  if (!Array.isArray(english)) return english
  return english.map((item, index) => {
    const overlay = translated[index]
    if (!overlay || typeof overlay !== 'object') return item
    if (typeof item === 'string') return typeof overlay.title === 'string' && overlay.title.trim() ? overlay.title : item
    if (!item || typeof item !== 'object') return item
    const merged = { ...(item as Record<string, unknown>) }
    for (const [key, value] of Object.entries(overlay)) {
      if (typeof value === 'string' && value.trim()) merged[key] = value
    }
    return merged
  })
}

const overlay = <T extends Item>(entity: StoredEntity, item: T, fields: Record<string, string>): T => {
  const known = fieldsForEntity(entity)
  const next: Record<string, unknown> = { ...item }
  for (const [field, value] of Object.entries(fields)) {
    const definition = known.get(field)
    if (!definition) continue
    if (field.startsWith('meta.')) {
      const metadata = { ...((next.metadata as Record<string, unknown> | null) ?? {}) }
      metadata[field.slice(5)] = value
      next.metadata = metadata
    } else if (definition.kind === 'list') {
      const list = parseList(value)
      if (list) next[field] = mergeList(next[field], list)
    } else {
      next[field] = value
    }
  }
  return next as T
}

/** Returns the records with their fields translated into `locale` where a translation exists. */
export const localizeRecords = async <T extends Item>(entity: StoredEntity, items: T[], locale: Locale): Promise<T[]> => {
  if (locale === SOURCE_LOCALE || !items.length) return items
  const idsKey = [...new Set(items.map((item) => item.id))].sort().join('|')
  const translations = await loadTranslations(entity, locale, idsKey)
  if (!translations.size) return items
  return items.map((item) => {
    const fields = translations.get(item.id)
    return fields ? overlay(entity, item, fields) : item
  })
}

export const localizeRecord = async <T extends Item>(entity: StoredEntity, item: T | null | undefined, locale: Locale) =>
  item ? (await localizeRecords(entity, [item], locale))[0] : item

/** Fingerprint of the English text a translation was made from. */
export const sourceHash = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '')
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

/** Reads a field's English value from a record (`meta.x` reads `metadata.x`). */
export const readSourceField = (record: Record<string, unknown>, field: string): unknown => {
  if (field.startsWith('meta.')) return ((record.metadata as Record<string, unknown> | null) ?? {})[field.slice(5)]
  return record[field]
}
