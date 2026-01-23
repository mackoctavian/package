import type { Metadata } from 'next'

import { AdminMembersManager } from '@/app/components/Admin/AdminMembersManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Admin Team',
}

export default async function AdminTeamPage() {
  await requireAdminPageAccess('team')

  return (
    <div className='px-6 py-8'>
      <AdminMembersManager />
    </div>
  )
}


