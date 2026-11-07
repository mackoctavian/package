import type { Metadata } from 'next'

import { AdminShell } from '@/app/components/Admin/shell/AdminShell'
import { requireAdminUser } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · DMRC Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await requireAdminUser()

  return (
    <div className='dashboard-theme min-h-screen bg-[#f6f7fa] text-foreground'>
      <AdminShell user={currentUser}>{children}</AdminShell>
    </div>
  )
}
