import type { Metadata } from 'next'

import { PageBody } from '@/app/components/Admin/shell/primitives'

import { ContentManager } from '@/app/components/Admin/content-manager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'News & Events',
}

export default async function NewsAdminPage() {
  await requireAdminPageAccess('news')

  return (
    <PageBody>
      <ContentManager
        type='news'
        title='News & events'
        description='Publish mission updates, intercession testimonies, pastoral notices, and upcoming encounters.'
      />
    </PageBody>
  )
}

