import type { Metadata } from 'next'

import { PageBody } from '@/app/components/Admin/shell/primitives'

import { ContentManager } from '@/app/components/Admin/content-manager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Events CMS',
}

export default async function EventsAdminPage() {
  await requireAdminPageAccess('events')

  return (
    <PageBody>
      <ContentManager
        type='events'
        title='Event calendar'
        description='Coordinate events, vigils, parish missions, and leadership gatherings across the DMRC network.'
      />
    </PageBody>
  )
}

