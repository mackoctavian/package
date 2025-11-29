import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'

export const metadata: Metadata = {
  title: 'Publications',
}

export default function PublicationsAdminPage() {
  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='publications'
        title='Publications library'
        description='Publish pastoral letters, magazines, study guides, and downloadable resources.'
        metadataFields={[
          { key: 'author', label: 'Author / speaker' },
          { key: 'downloadUrl', label: 'Download URL', placeholder: 'https://...' },
        ]}
      />
    </div>
  )
}

