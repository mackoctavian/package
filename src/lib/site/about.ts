import { cache } from 'react'

import prisma from '@/lib/prisma'
import { dmrcStory, leaders as defaultLeaders, type Leader } from '@/app/data/about'

/** About page content, with admin overrides from content items of type "about". */
export const getAboutContent = cache(async () => {
  let history = dmrcStory.history
  let mission = dmrcStory.mission
  let leaders: Leader[] = defaultLeaders

  try {
    const items = await prisma.contentItem.findMany({
      where: { type: 'about', status: 'published' },
      orderBy: [{ publishDate: 'asc' }, { createdAt: 'asc' }],
    })
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
