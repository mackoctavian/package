import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { isLocale, SOURCE_LOCALE } from '@/i18n/config'
import { audit } from '@/lib/audit'
import { guardAnyAdminApi } from '@/lib/auth/api-guard'
import { canEditGroup } from '@/lib/i18n/admin-access'
import { fieldStates, hasSourceText, loadGroupRecords, loadTranslations, statusOf } from '@/lib/i18n/admin'
import { sourceHash } from '@/lib/i18n/content'
import { findTranslationGroup, type TranslatableField } from '@/lib/i18n/entities'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ group: string; id: string }> }

const MAX_LENGTH = 50_000

const parseList = (value: string | undefined) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** The English list as editable items: strings become `{ title }`. */
const sourceList = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => (typeof item === 'string' ? { title: item } : item && typeof item === 'object' ? item : {})) : []

const resolve = async (groupId: string, id: string, locale: string | null) => {
  const group = findTranslationGroup(groupId)
  if (!group) return { error: NextResponse.json({ error: 'Unknown content type.' }, { status: 404 }) } as const
  if (!locale || !isLocale(locale) || locale === SOURCE_LOCALE) {
    return { error: NextResponse.json({ error: 'Choose a language to translate into.' }, { status: 400 }) } as const
  }
  const [record] = await loadGroupRecords(group, id)
  if (!record) return { error: NextResponse.json({ error: 'This item no longer exists.' }, { status: 404 }) } as const
  return { group, locale, record } as const
}

const describe = async (groupId: string, id: string, locale: string) => {
  const resolved = await resolve(groupId, id, locale)
  if (resolved.error) return { error: resolved.error } as const
  const { group, record } = resolved
  const stored = (await loadTranslations(group, resolved.locale, [id])).get(id)
  const states = fieldStates(group, record, stored)
  const fields = group.fields.map((field, index) => {
    const translation = stored?.get(field.key)
    const source = record.source[field.key]
    return {
      key: field.key,
      label: field.label,
      kind: field.kind,
      hint: field.hint ?? null,
      itemFields: field.itemFields ?? null,
      source: field.kind === 'list' ? sourceList(source) : typeof source === 'string' ? source : source == null ? '' : String(source),
      value: field.kind === 'list' ? parseList(translation?.value) : translation?.value ?? '',
      required: states[index].required,
      translated: states[index].translated,
      outdated: states[index].outdated,
      updatedAt: translation?.updatedAt ?? null,
      updatedBy: translation?.updatedBy ?? null,
    }
  })
  return {
    data: {
      locale: resolved.locale,
      group: { id: group.id, label: group.label },
      record: { id: record.id, label: record.label, detail: record.detail },
      ...statusOf(states),
      fields,
    },
  } as const
}

/** GET /api/admin/translations/content/:group/:id?locale=sw — the English text beside its translation. */
export async function GET(request: Request, { params }: Params) {
  const auth = await guardAnyAdminApi([['translations', 'view']])
  if ('denied' in auth) return auth.denied
  const { group, id } = await params
  try {
    const result = await describe(group, id, new URL(request.url).searchParams.get('locale') ?? '')
    if (result.error) return result.error
    const definition = findTranslationGroup(group)!
    return NextResponse.json({ data: { ...result.data, canEdit: canEditGroup(auth.user, definition) } })
  } catch (error) {
    console.error('[translations][record][GET]', error)
    return NextResponse.json({ error: 'Could not load this translation.' }, { status: 500 })
  }
}

/** Normalises one submitted value; returns null to clear the translation. */
const normalise = (field: TranslatableField, value: unknown): string | null | { error: string } => {
  if (value === null || value === undefined) return null
  if (field.kind === 'list') {
    if (!Array.isArray(value)) return { error: `${field.label} must be a list.` }
    const subKeys = field.itemFields?.map((sub) => sub.key) ?? ['title']
    const items = value.map((item) => {
      const clean: Record<string, string> = {}
      if (item && typeof item === 'object') {
        for (const key of subKeys) {
          const text = (item as Record<string, unknown>)[key]
          if (typeof text === 'string' && text.trim()) clean[key] = text.trim()
        }
      }
      return clean
    })
    if (!items.some((item) => Object.keys(item).length)) return null
    return JSON.stringify(items)
  }
  if (typeof value !== 'string') return { error: `${field.label} must be text.` }
  const text = field.kind === 'text' ? value.replace(/\s+/g, ' ').trim() : value.replace(/\r\n/g, '\n').trim()
  return text ? text : null
}

/**
 * PUT /api/admin/translations/content/:group/:id
 * Body: { locale: 'sw', values: { title: '…', focusAreas: [{ title: '…' }] } }
 * Only the fields in `values` are touched; an empty value removes that translation.
 */
export async function PUT(request: Request, { params }: Params) {
  const auth = await guardAnyAdminApi([['translations', 'view']])
  if ('denied' in auth) return auth.denied
  const { group: groupId, id } = await params

  let body: { locale?: unknown; values?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const values = body.values && typeof body.values === 'object' && !Array.isArray(body.values) ? (body.values as Record<string, unknown>) : null
  if (!values) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })

  try {
    const resolved = await resolve(groupId, id, typeof body.locale === 'string' ? body.locale : null)
    if (resolved.error) return resolved.error
    const { group, locale, record } = resolved
    if (!canEditGroup(auth.user, group)) {
      return NextResponse.json({ error: `You need edit access to Translations or ${group.label} to change these translations.` }, { status: 403 })
    }

    const writes: { field: TranslatableField; value: string | null }[] = []
    for (const [key, raw] of Object.entries(values)) {
      const field = group.fields.find((candidate) => candidate.key === key)
      if (!field) return NextResponse.json({ error: `Unknown field “${key}”.` }, { status: 400 })
      const value = normalise(field, raw)
      if (value && typeof value === 'object') return NextResponse.json({ error: value.error }, { status: 400 })
      if (typeof value === 'string' && value.length > MAX_LENGTH) return NextResponse.json({ error: `${field.label} is too long.` }, { status: 400 })
      writes.push({ field, value })
    }

    const actor = { id: auth.user.id, name: auth.user.name }
    await prisma.$transaction(
      writes.map(({ field, value }) => {
        const where = { entity_entityId_locale_field: { entity: group.entity, entityId: id, locale, field: field.key } }
        if (value === null) return prisma.contentTranslation.deleteMany({ where: { entity: group.entity, entityId: id, locale, field: field.key } })
        const source = record.source[field.key]
        const data = {
          value,
          sourceHash: hasSourceText(field, source) ? sourceHash(source) : null,
          updatedById: actor.id,
          updatedBy: actor.name,
        }
        return prisma.contentTranslation.upsert({
          where,
          create: { entity: group.entity, entityId: id, locale, field: field.key, ...data },
          update: data,
        })
      }),
    )

    await audit({
      actor,
      action: 'updated',
      entity: 'translation',
      entityId: id,
      summary: `Updated the ${locale.toUpperCase()} translation of ${group.label.toLowerCase()} “${record.label}”`,
      metadata: { group: group.id, locale, fields: writes.map((write) => write.field.key) },
      request,
    })
    revalidatePath('/', 'layout')

    const result = await describe(groupId, id, locale)
    if (result.error) return result.error
    return NextResponse.json({ data: { ...result.data, canEdit: true } })
  } catch (error) {
    console.error('[translations][record][PUT]', error)
    return NextResponse.json({ error: 'Could not save the translation. Please try again.' }, { status: 500 })
  }
}
