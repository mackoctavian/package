import type { Metadata } from 'next'

import { ContentManager } from '@/app/components/Admin/content-manager'

export const metadata: Metadata = {
  title: 'Events CMS',
}

export default function EventsAdminPage() {
  return (
    <div className='px-6 py-8'>
      <ContentManager
        type='events'
        title='Event calendar'
        description='Coordinate events, vigils, parish missions, and leadership gatherings across the DMRC network.'
        metadataFields={[
          { key: 'location', label: 'Location', placeholder: 'City / Parish' },
          { key: 'timezone', label: 'Timezone', placeholder: 'GMT+5:30' },
        ]}
      />
    </div>
  )
}

