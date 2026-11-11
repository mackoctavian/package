import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { isLocale, LOCALES, SOURCE_LOCALE, type Locale } from '@/i18n/config'
import { audit } from '@/lib/audit'
import { guardAnyAdminApi } from '@/lib/auth/api-guard'
import { canEditInterface } from '@/lib/i18n/admin-access'
import { builtInMessages, isUiKey, placeholdersOf, UI_SCOPES, type UiScope } from '@/lib/i18n/admin'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const isScope = (value: unknown): value is UiScope => typeof value === 'string' && (UI_SCOPES as string[]).includes(value)

const MAX_LENGTH = 2_000

/**
 * GET /api/admin/translations/ui?scope=web|mobile
 * Every interface string with its built-in text and any saved change, per language.
 */
export async function GET(request: Request) {
  const auth = await guardAnyAdminApi([['translations', 'view']])
  if ('denied' in auth) return auth.denied

  const scope = new URL(request.url).searchParams.get('scope')
  if (!isScope(scope)) return NextResponse.json({ error: 'Unknown text area.' }, { status: 400 })

  try {
    const rows = await prisma.uiTranslation.findMany({
      where: { scope },
      select: { locale: true, key: true, value: true, updatedAt: true, updatedBy: true },
    })
    const overrides = new Map(rows.map((row) => [`${row.locale}:${row.key}`, row]))
    const source = builtInMessages(scope, SOURCE_LOCALE)
    const entries = Object.keys(source).map((key) => ({
      key,
      namespace: key.split('.')[0],
      placeholders: placeholdersOf(source[key]),
      locales: Object.fromEntries(
        LOCALES.map((locale) => {
          const override = overrides.get(`${locale}:${key}`)
          return [
            locale,
            {
              builtIn: builtInMessages(scope, locale)[key] ?? null,
              override: override?.value ?? null,
              updatedAt: override?.updatedAt ?? null,
              updatedBy: override?.updatedBy ?? null,
            },
          ]
        }),
      ),
    }))
    return NextResponse.json({ data: { scope, locales: LOCALES, entries, canEdit: canEditInterface(auth.user) } })
  } catch (error) {
    console.error('[translations][ui][GET]', error)
    return NextResponse.json(
      { error: 'Could not load interface text. If this is a new install, run prisma/sql/004_i18n.sql in Supabase first.' },
      { status: 500 },
    )
  }
}

type Change = { locale: Locale; key: string; value: string | null }

/**
 * PUT /api/admin/translations/ui
 * Body: { scope: 'web', changes: [{ locale: 'sw', key: 'nav.home', value: 'Nyumbani' }] }
 * `value: null` (or empty) removes the change and restores the built-in text.
 */
export async function PUT(request: Request) {
  const auth = await guardAnyAdminApi([['translations', 'view']])
  if ('denied' in auth) return auth.denied
  if (!canEditInterface(auth.user)) return NextResponse.json({ error: 'You need edit access to Translations to change interface text.' }, { status: 403 })

  let body: { scope?: unknown; changes?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const { scope } = body
  if (!isScope(scope)) return NextResponse.json({ error: 'Unknown text area.' }, { status: 400 })
  if (!Array.isArray(body.changes) || !body.changes.length) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })
  if (body.changes.length > 500) return NextResponse.json({ error: 'Too many changes at once.' }, { status: 400 })

  const changes: Change[] = []
  for (const raw of body.changes as Record<string, unknown>[]) {
    const locale = raw?.locale
    const key = raw?.key
    if (typeof locale !== 'string' || !isLocale(locale)) return NextResponse.json({ error: 'Unknown language.' }, { status: 400 })
    if (typeof key !== 'string' || !isUiKey(scope, key)) return NextResponse.json({ error: `Unknown text “${String(key)}”.` }, { status: 400 })
    const value = typeof raw.value === 'string' ? raw.value.trim() : null
    if (raw.value !== null && raw.value !== undefined && typeof raw.value !== 'string') return NextResponse.json({ error: 'Text must be a string.' }, { status: 400 })
    if (value && value.length > MAX_LENGTH) return NextResponse.json({ error: `“${key}” is too long.` }, { status: 400 })
    if (value) {
      // Placeholders such as {name} are filled in by the site; a translation must keep every one.
      const expected = placeholdersOf(builtInMessages(scope, SOURCE_LOCALE)[key])
      const actual = placeholdersOf(value)
      const missing = expected.filter((token) => !actual.includes(token))
      const extra = actual.filter((token) => !expected.includes(token))
      if (missing.length || extra.length) {
        const parts = [missing.length && `keep ${missing.join(', ')}`, extra.length && `remove ${extra.join(', ')}`].filter(Boolean).join(' and ')
        return NextResponse.json({ error: `“${key}”: please ${parts}. These are filled in automatically.` }, { status: 400 })
      }
    }
    changes.push({ locale, key, value: value || null })
  }

  try {
    const actor = { id: auth.user.id, name: auth.user.name }
    await prisma.$transaction(
      changes.map(({ locale, key, value }) =>
        value === null
          ? prisma.uiTranslation.deleteMany({ where: { scope, locale, key } })
          : prisma.uiTranslation.upsert({
              where: { scope_locale_key: { scope, locale, key } },
              create: { scope, locale, key, value, updatedById: actor.id, updatedBy: actor.name },
              update: { value, updatedById: actor.id, updatedBy: actor.name },
            }),
      ),
    )
    const area = scope === 'web' ? 'website' : 'app'
    await audit({
      actor,
      action: 'updated',
      entity: 'translation',
      summary:
        changes.length === 1
          ? `${changes[0].value === null ? 'Reset' : 'Changed'} ${area} text “${changes[0].key}” (${changes[0].locale.toUpperCase()})`
          : `Changed ${changes.length} ${area} text entries`,
      metadata: { scope, changes: changes.map(({ locale, key, value }) => ({ locale, key, reset: value === null })) },
      request,
    })
    if (scope === 'web') revalidatePath('/', 'layout')
    return NextResponse.json({ data: { saved: changes.length } })
  } catch (error) {
    console.error('[translations][ui][PUT]', error)
    return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 })
  }
}
