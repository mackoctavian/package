import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { CheckInDesk } from '@/app/components/Admin/bookings/CheckInDesk'
import { requireAdminUser } from '@/lib/auth/admin-session'
import { userHasModuleAccess } from '@/lib/auth/admin-shared'

export const metadata: Metadata = { title: 'Check-in desk' }

export default async function CheckInPage() {
  const user = await requireAdminUser()
  if (!userHasModuleAccess(user, 'check-in') && !userHasModuleAccess(user, 'retreats')) redirect('/admin?denied=1')
  return (
    <Suspense>
      <CheckInDesk />
    </Suspense>
  )
}
