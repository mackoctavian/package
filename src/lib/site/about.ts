import { cache } from 'react'

import prisma from '@/lib/prisma'
import { leaders as defaultLeaders, type Leader } from '@/app/data/about'
import { getT } from '@/i18n/server'
import { localizeRecords } from '@/lib/i18n/content'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'

/** About page content, with admin overrides from content items of type "about". */
export const getAboutContent = cache(async (locale: Locale = DEFAULT_LOCALE) => {
  const t = await getT(locale)
  let history = t('about.story.history')
  let mission = t('about.mission.text')
  let leaders: Leader[] = defaultLeaders.map((leader) => ({
    ...leader,
    role: t.dynamic(`about.leadership.${leader.id}.role`, undefined, leader.role),
    body: t.dynamic(`about.leadership.${leader.id}.body`, undefined, leader.body),
  }))

  try {
    const items = await localizeRecords(
      'content',
      await prisma.contentItem.findMany({
        where: { type: 'about', status: 'published' },
        orderBy: [{ publishDate: 'asc' }, { createdAt: 'asc' }],
      }),
      locale,
    )
    const section = (item: (typeof items)[number]) =>
      String(((item.metadata ?? {}) as Record<string, unknown>).section ?? '').toLowerCase().trim()

    const historyItem = items.find((item) => section(item) === 'history' && item.body)
    const missionItem = items.find((item) => section(item) === 'mission' && item.body)
    const leaderItems = items.filter((item) => section(item) === 'leadership')

    if (historyItem?.body) history = historyItem.body
    if (missionItem?.body) mission = missionItem.body
    if (leaderItems.length) {
      leaders = leaderItems.map((item) => ({
        name: item.title,
        role: item.summary ?? item.category ?? '',
        body: item.body ?? '',
        image: item.mediaUrl ?? undefined,
      }))
    }
  } catch (error) {
    console.error('[about] database unavailable, using static content', error instanceof Error ? error.message : error)
  }

  return { history, mission, leaders }
})
