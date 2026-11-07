import type { Metadata } from 'next'
import { Suspense } from 'react'

import { RecordsManager } from '@/app/components/Admin/records/RecordsManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Donations' }

export default async function Page() {
  await requireAdminPageAccess('donations')
  return (
    <Suspense>
      <RecordsManager kind='donations' />
    </Suspense>
  )
}
