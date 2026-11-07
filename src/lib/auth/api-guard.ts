import { NextResponse } from 'next/server'

import type { AccessLevel, AdminModuleId } from './admin-permissions'
import { getCurrentAdminUser, requireAdminApiAccess } from './admin-session'
import { userHasModuleAccess } from './admin-shared'

/**
 * Returns a 401/403 response when the caller is not a signed-in admin with
 * `level` access to `moduleId`, or `null` when the request may proceed.
 * Reads need `view`; anything that changes data needs `edit`.
 *
 *   const denied = await guardAdminApi('retreats', 'edit')
 *   if (denied) return denied
 */
export const guardAdminApi = async (moduleId?: AdminModuleId, level: AccessLevel = 'view') => {
  const auth = await requireAdminApiAccess(moduleId, level)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  return null
}

/** True when the current request comes from an admin allowed to use `moduleId`. */
export const isAdminRequest = async (moduleId?: AdminModuleId, level: AccessLevel = 'view') => {
  const user = await getCurrentAdminUser()
  if (!user) return false
  return userHasModuleAccess(user, moduleId, level)
}
