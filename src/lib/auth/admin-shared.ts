import type { AdminRole } from '@prisma/client'

import { type AccessLevel, type AdminModuleId, ADMIN_MODULES, DEFAULT_ALLOWED_MODULES, parseGrant } from './admin-permissions'

export type AdminUserPayload = {
  id: string
  name: string
  email: string
  role: AdminRole
  /** Stored grants such as `"news:edit"`. Use the helpers below to read them. */
  allowedModules: string[]
  isActive: boolean
}

type PermissionSubject = Pick<AdminUserPayload, 'role' | 'allowedModules'>

/** The level a user has in an area, or null when they have no access. */
export const getModuleAccess = (user: PermissionSubject, moduleId: AdminModuleId): AccessLevel | null => {
  if (user.role === 'SUPERADMIN') return 'edit'
  const grants = user.allowedModules?.length ? user.allowedModules : DEFAULT_ALLOWED_MODULES
  let level: AccessLevel | null = null
  for (const entry of grants) {
    const grant = parseGrant(entry)
    if (!grant || grant.moduleId !== moduleId) continue
    const granted: AccessLevel = grant.level ?? (user.role === 'VIEWER' ? 'view' : 'edit')
    if (granted === 'edit') level = 'edit'
    else if (!level) level = 'view'
  }
  if (!level && moduleId === 'overview') level = 'view'
  // Viewers are read-only everywhere, whatever their grants say.
  if (level === 'edit' && user.role === 'VIEWER') return 'view'
  return level
}

/**
 * True when the user may use an area at the given level. With no area, true
 * for any signed-in admin (or, for `edit`, anyone who can edit something).
 */
export const userHasModuleAccess = (user: PermissionSubject, moduleId?: AdminModuleId, level: AccessLevel = 'view') => {
  if (!moduleId) {
    if (level === 'view') return true
    return ADMIN_MODULES.some((module) => getModuleAccess(user, module.id) === 'edit')
  }
  const access = getModuleAccess(user, moduleId)
  if (!access) return false
  return level === 'view' || access === 'edit'
}

export const canEdit = (user: PermissionSubject, moduleId: AdminModuleId) => userHasModuleAccess(user, moduleId, 'edit')

/** Every area the user can see, with their level. */
export const listModuleAccess = (user: PermissionSubject) =>
  ADMIN_MODULES.map((module) => ({ ...module, level: getModuleAccess(user, module.id) })).filter(
    (module): module is typeof module & { level: AccessLevel } => module.level !== null,
  )
