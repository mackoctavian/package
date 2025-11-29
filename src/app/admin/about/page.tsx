import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'

export const metadata: Metadata = {
  title: 'About DMRC',
}

export default function AboutAdminPage() {
  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='about'
        title='About page content'
        description='Maintain the mission statement, history, and leadership narrative presented on the public about page.'
        metadataFields={[
          { key: 'section', label: 'Section key', placeholder: 'mission / history / leadership' },
          { key: 'accent', label: 'Accent scripture / quote' },
        ]}
      />
    </div>
  )
}

