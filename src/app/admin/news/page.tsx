import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'News & Events',
}

export default async function NewsAdminPage() {
  await requireAdminPageAccess('news')

  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='news'
        title='News & events'
        description='Publish mission updates, intercession testimonies, pastoral notices, and upcoming encounters.'
      />
    </div>
  )
}

