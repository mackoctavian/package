import type { Metadata } from 'next'

import { TeamManager } from '@/app/components/Admin/team/TeamManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Team & access' }

export default async function AdminTeamPage() {
  await requireAdminPageAccess('team')
  return <TeamManager />
}
