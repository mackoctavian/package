import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Events CMS',
}

export default async function EventsAdminPage() {
  await requireAdminPageAccess('events')

  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='events'
        title='Event calendar'
        description='Coordinate events, vigils, parish missions, and leadership gatherings across the DMRC network.'
      />
    </div>
  )
}

