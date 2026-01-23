import type { Metadata } from 'next'

import RetreatDetail from '@/app/components/Admin/RetreatDetail'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

type PageProps = {
  params: { id: string }
}

export const metadata: Metadata = {
  title: 'Retreat detail | Admin',
}

export default async function AdminRetreatDetailPage(context: PageProps) {
  await requireAdminPageAccess('retreats')
  const params = await context.params
  return <RetreatDetail retreatId={params.id} />
}
