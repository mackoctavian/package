import type { Metadata } from 'next'

import RetreatDashboard from '@/app/components/Admin/RetreatDashboard'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Retreats | Admin',
}

export default async function AdminRetreatsPage() {
  await requireAdminPageAccess('retreats')
  return <RetreatDashboard />
}

