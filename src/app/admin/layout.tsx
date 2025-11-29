import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { DashboardLayoutClient } from '@dashboard/components/layout/authenticated-layout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className='dashboard-theme min-h-screen bg-background text-foreground'>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </div>
  )
}

