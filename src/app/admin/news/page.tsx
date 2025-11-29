import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'

export const metadata: Metadata = {
  title: 'News & Events',
}

export default function NewsAdminPage() {
  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='news'
        title='News & events'
        description='Publish mission updates, intercession testimonies, pastoral notices, and upcoming encounters.'
        metadataFields={[
          { key: 'location', label: 'Location', placeholder: 'Retreat center / parish' },
          { key: 'cta', label: 'CTA Link', placeholder: '/events/divine-mercy-sunday' },
        ]}
      />
    </div>
  )
}

