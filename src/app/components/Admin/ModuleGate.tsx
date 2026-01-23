"use client"

import type { ReactNode } from 'react'

import { useAdminUser } from '@dashboard/context/admin-user'
import { userHasModuleAccess } from '@/lib/auth/admin-shared'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { AlertTriangle } from 'lucide-react'

export const ModuleGate = ({ moduleId, children }: { moduleId: AdminModuleId; children: ReactNode }) => {
  const user = useAdminUser()
  const allowed = userHasModuleAccess(user, moduleId)

  if (!allowed) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white text-center text-slate-500'>
        <AlertTriangle className='h-10 w-10 text-amber-500' />
        <div>
          <p className='text-lg font-semibold text-slate-900'>Access restricted</p>
          <p className='text-sm text-slate-500'>You don&apos;t have permission to view this module. Contact a super admin for access.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}


