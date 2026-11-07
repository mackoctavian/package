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

/**
 * Like guardAdminApi, but passes when the caller meets any one of the
 * requirements, e.g. retreats edit OR check-in edit for the ticket scanner.
 * Returns the signed-in user when allowed.
 */
export const guardAnyAdminApi = async (requirements: Array<[AdminModuleId, AccessLevel]>) => {
  const user = await getCurrentAdminUser()
  if (!user) return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  if (!requirements.some(([moduleId, level]) => userHasModuleAccess(user, moduleId, level))) {
    return { denied: NextResponse.json({ error: 'You do not have access to this area.' }, { status: 403 }) } as const
  }
  return { user } as const
}
