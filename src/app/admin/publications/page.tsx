import type { Metadata } from 'next'

import { PublicationManager } from '@/app/components/Admin/PublicationManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Publications',
}

export default async function PublicationsAdminPage() {
  await requireAdminPageAccess('publications')
  return <PublicationManager />
}

