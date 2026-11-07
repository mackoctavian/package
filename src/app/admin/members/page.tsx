import type { Metadata } from 'next'

import { MembersManager } from '@/app/components/Admin/people/MembersManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Members' }

export default async function Page() {
  await requireAdminPageAccess('members')
  return <MembersManager />
}
