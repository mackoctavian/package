import type { AdminRole } from '@prisma/client'

import { AdminModuleId, DEFAULT_ALLOWED_MODULES } from './admin-permissions'

export type AdminUserPayload = {
  id: string
  name: string
  email: string
  role: AdminRole
  allowedModules: AdminModuleId[]
  isActive: boolean
}

export const userHasModuleAccess = (user: AdminUserPayload, moduleId: AdminModuleId) => {
  if (!moduleId) return true
  if (user.role === 'SUPERADMIN') return true
  const allowed = user.allowedModules?.length ? user.allowedModules : DEFAULT_ALLOWED_MODULES
  return allowed.includes(moduleId)
}


