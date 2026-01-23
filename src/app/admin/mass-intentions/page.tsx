import type { Metadata } from 'next'

import { MassIntentionsTable } from '@/app/components/Admin/MassIntentionsTable'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Mass Intentions',
}

export default async function MassIntentionsAdminPage() {
  await requireAdminPageAccess('mass-intentions')

  return (
    <div className='px-6 py-8'>
      <MassIntentionsTable />
    </div>
  )
}
