import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Patrons',
}

export default async function PatronsAdminPage() {
  await requireAdminPageAccess('patrons')

  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='patrons'
        title='Patrons & testimonials'
        description='Highlight bishops, clergy, benefactors, and transformation stories that anchor DMRC.'
        metadataFields={[
          { key: 'role', label: 'Role / office', placeholder: 'Bishop / Director' },
          { key: 'quote', label: 'Quote' },
        ]}
      />
    </div>
  )
}

