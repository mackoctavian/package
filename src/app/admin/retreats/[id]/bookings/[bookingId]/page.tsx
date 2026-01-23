import type { Metadata } from 'next'

import RetreatBookingDetail from '@/app/components/Admin/RetreatBookingDetail'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

type PageParams = {
  params: { id: string; bookingId: string }
}

export const metadata: Metadata = {
  title: 'Booking detail | Admin',
}

export default async function AdminRetreatBookingPage(context: PageParams) {
  await requireAdminPageAccess('retreats')
  const params = await context.params

  return <RetreatBookingDetail retreatId={params.id} bookingId={params.bookingId} />
}


