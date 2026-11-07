import type { Metadata } from 'next'

import { PageBody } from '@/app/components/Admin/shell/primitives'

import { ContentManager } from '@/app/components/Admin/content-manager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Patrons',
}

export default async function PatronsAdminPage() {
  await requireAdminPageAccess('patrons')

  return (
    <PageBody>
      <ContentManager
        type='patrons'
        title='Patrons & testimonials'
        description='Highlight bishops, clergy, benefactors, and transformation stories that anchor DMRC.'
        metadataFields={[
          { key: 'role', label: 'Role / office', placeholder: 'Bishop / Director' },
          { key: 'quote', label: 'Quote' },
        ]}
      />
    </PageBody>
  )
}

