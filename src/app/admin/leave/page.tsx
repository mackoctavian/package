import type { Metadata } from 'next'

import { LeaveManager } from '@/app/components/Admin/people/LeaveManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Leave requests' }

export default async function Page() {
  await requireAdminPageAccess('leave')
  return <LeaveManager />
}
