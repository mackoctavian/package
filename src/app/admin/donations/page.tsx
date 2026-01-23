import type { Metadata } from 'next'

import { DonationsTable } from '@/app/components/Admin/DonationsTable'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Donations',
}

export default async function DonationsAdminPage() {
  await requireAdminPageAccess('donations')

  return (
    <div className='px-6 py-8'>
      <DonationsTable />
    </div>
  )
}
