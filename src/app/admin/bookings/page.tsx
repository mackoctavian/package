import type { Metadata } from 'next'
import { Suspense } from 'react'

import { BookingsManager } from '@/app/components/Admin/bookings/BookingsManager'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Bookings' }

export default async function BookingsPage() {
  await requireAdminPageAccess('retreats')
  return (
    <Suspense>
      <BookingsManager />
    </Suspense>
  )
}
