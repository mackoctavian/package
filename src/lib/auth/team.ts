import type { AdminRole } from '@prisma/client'

import { ADMIN_MODULES, parseGrant, ROLE_LABELS, sanitizeModules } from './admin-permissions'
import { type AdminUserPayload, getModuleAccess } from './admin-shared'

export const ADMIN_ROLES: AdminRole[] = ['SUPERADMIN', 'EDITOR', 'VIEWER']

export const isAdminRole = (value: unknown): value is AdminRole =>
  typeof value === 'string' && (ADMIN_ROLES as string[]).includes(value)

/**
 * Checks that `actor` may hand out `role` with `modules`. Owners can grant
 * anything. Everyone else with team edit access can only grant areas and
 * levels they hold themselves, and can never create an Owner.
 */
export const validateGrant = (
  actor: AdminUserPayload,
  role: AdminRole,
  modules: unknown,
): { ok: true; modules: string[] } | { ok: false; error: string } => {
  const cleaned = role === 'SUPERADMIN' ? [] : sanitizeModules(modules)
  if (actor.role === 'SUPERADMIN') return { ok: true, modules: cleaned }
  if (role === 'SUPERADMIN') return { ok: false, error: `Only an ${ROLE_LABELS.SUPERADMIN} can add another ${ROLE_LABELS.SUPERADMIN}.` }

  for (const entry of cleaned) {
    const grant = parseGrant(entry)
    if (!grant) continue
    const wanted = grant.level ?? (role === 'VIEWER' ? 'view' : 'edit')
    const held = getModuleAccess(actor, grant.moduleId)
    if (!held || (wanted === 'edit' && held !== 'edit')) {
      const label = ADMIN_MODULES.find((module) => module.id === grant.moduleId)?.label ?? grant.moduleId
      return { ok: false, error: `You can't give ${wanted} access to ${label} because you don't have it yourself.` }
    }
  }
  return { ok: true, modules: cleaned }
}

/** Only Owners can change or remove another Owner. */
export const canManageMember = (actor: AdminUserPayload, target: { id: string; role: AdminRole }) =>
  actor.role === 'SUPERADMIN' || target.role !== 'SUPERADMIN'

export const normalizeEmail = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
export const normalizeName = (value: unknown) => (typeof value === 'string' ? value.trim().slice(0, 120) : '')
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const MIN_PASSWORD_LENGTH = 10
export const passwordProblem = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Use a mix of letters and numbers.'
  return null
}

export const serializeMember = (user: {
  id: string
  name: string
  email: string
  role: AdminRole
  allowedModules: string[]
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  allowedModules: user.role === 'SUPERADMIN' ? [] : sanitizeModules(user.allowedModules),
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
})

export type TeamMember = ReturnType<typeof serializeMember>

export const memberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  allowedModules: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const
