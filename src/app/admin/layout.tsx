import { DashboardLayoutClient } from '@dashboard/components/layout/authenticated-layout'
import { requireAdminUser } from '@/lib/auth/admin-session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await requireAdminUser()

  return (
    <div className='dashboard-theme min-h-screen bg-background text-foreground'>
      <DashboardLayoutClient currentUser={currentUser}>{children}</DashboardLayoutClient>
    </div>
  )
}

