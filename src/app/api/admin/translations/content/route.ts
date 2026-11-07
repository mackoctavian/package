import { NextResponse } from 'next/server'

import { isLocale, SOURCE_LOCALE } from '@/i18n/config'
import { guardAnyAdminApi } from '@/lib/auth/api-guard'
import { canEditGroup } from '@/lib/i18n/admin-access'
import { fieldStates, loadGroupRecords, loadTranslations, statusOf, TARGET_LOCALES, type TranslationStatus } from '@/lib/i18n/admin'
import { findTranslationGroup, TRANSLATION_GROUPS } from '@/lib/i18n/entities'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/translations/content?locale=sw
 *   → progress for every content group
 * GET /api/admin/translations/content?locale=sw&group=news
 *   → every record in the group with its translation status
 */
export async function GET(request: Request) {
  const auth = await guardAnyAdminApi([['translations', 'view']])
  if ('denied' in auth) return auth.denied

  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') ?? TARGET_LOCALES[0]
  if (!isLocale(locale) || locale === SOURCE_LOCALE) return NextResponse.json({ error: 'Choose a language to translate into.' }, { status: 400 })

  const groupId = url.searchParams.get('group')
  try {
    if (!groupId) {
      const groups = await Promise.all(
        TRANSLATION_GROUPS.map(async (group) => {
          const records = await loadGroupRecords(group)
          const stored = await loadTranslations(group, locale, records.map((record) => record.id))
          const counts: Record<TranslationStatus, number> = { missing: 0, partial: 0, complete: 0, outdated: 0 }
          for (const record of records) counts[statusOf(fieldStates(group, record, stored.get(record.id))).status] += 1
          return {
            id: group.id,
            label: group.label,
            description: group.description,
            total: records.length,
            counts,
            canEdit: canEditGroup(auth.user, group),
          }
        }),
      )
      return NextResponse.json({ data: { locale, groups } })
    }

    const group = findTranslationGroup(groupId)
    if (!group) return NextResponse.json({ error: 'Unknown content type.' }, { status: 404 })
    const records = await loadGroupRecords(group)
    const stored = await loadTranslations(group, locale, records.map((record) => record.id))
    const items = records.map((record) => {
      const translations = stored.get(record.id)
      const summary = statusOf(fieldStates(group, record, translations))
      const updated = translations ? [...translations.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] : undefined
      return {
        id: record.id,
        label: record.label,
        detail: record.detail,
        ...summary,
        updatedAt: updated?.updatedAt ?? null,
        updatedBy: updated?.updatedBy ?? null,
      }
    })
    return NextResponse.json({ data: { locale, group: { id: group.id, label: group.label, description: group.description, canEdit: canEditGroup(auth.user, group) }, items } })
  } catch (error) {
    console.error('[translations][content][GET]', error)
    return NextResponse.json(
      { error: 'Could not load translations. If this is a new install, run prisma/sql/004_i18n.sql in Supabase first.' },
      { status: 500 },
    )
  }
}
