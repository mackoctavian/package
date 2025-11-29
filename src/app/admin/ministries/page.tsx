import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'

export const metadata: Metadata = {
  title: 'Ministries',
}

export default function MinistriesAdminPage() {
  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='ministries'
        title='Ministries & initiatives'
        description='Describe the hospitality, intercession, youth, and outreach ministries that serve each retreat.'
        metadataFields={[
          { key: 'lead', label: 'Ministry lead' },
          { key: 'focus', label: 'Primary focus', placeholder: 'Healing / Outreach' },
        ]}
      />
    </div>
  )
}

