import type { Metadata } from 'next'

import { PageBody } from '@/app/components/Admin/shell/primitives'

import { ContentManager } from '@/app/components/Admin/content-manager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Articles',
}

export default async function ArticlesAdminPage() {
  await requireAdminPageAccess('articles')

  return (
    <PageBody>
      <ContentManager
        type='articles'
        title='Articles'
        description='Publish long-form articles, catechesis notes, and reflections.'
        metadataFields={[
          { key: 'author', label: 'Author' },
          { key: 'readingTime', label: 'Reading time (mins)' },
        ]}
      />
    </PageBody>
  )
}


