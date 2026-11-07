import type { Metadata } from 'next'
import { Suspense } from 'react'

import { RecordsManager } from '@/app/components/Admin/records/RecordsManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Mass intentions' }

export default async function Page() {
  await requireAdminPageAccess('mass-intentions')
  return (
    <Suspense>
      <RecordsManager kind='mass-intentions' />
    </Suspense>
  )
}
