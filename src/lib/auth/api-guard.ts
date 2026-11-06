import { NextResponse } from 'next/server'

import type { AdminModuleId } from './admin-permissions'
import { getCurrentAdminUser, requireAdminApiAccess } from './admin-session'
import { userHasModuleAccess } from './admin-shared'

/**
 * Returns a 401/403 response when the caller is not a signed-in admin with
 * access to `moduleId`, or `null` when the request may proceed.
 *
 *   const denied = await guardAdminApi('retreats')
 *   if (denied) return denied
 */
export const guardAdminApi = async (moduleId?: AdminModuleId) => {
  const auth = await requireAdminApiAccess(moduleId)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  return null
}

/** True when the current request comes from an admin allowed to use `moduleId`. */
export const isAdminRequest = async (moduleId?: AdminModuleId) => {
  const user = await getCurrentAdminUser()
  if (!user) return false
  return moduleId ? userHasModuleAccess(user, moduleId) : true
}
