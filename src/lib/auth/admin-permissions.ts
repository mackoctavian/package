import type { AdminRole } from '@prisma/client'

/**
 * Areas of the admin panel that access can be granted to. Each area is
 * granted at one of two levels:
 *
 *   view – can open the area and read or export its data
 *   edit – can also create, change, approve and delete
 *
 * Grants are stored in `AdminUser.allowedModules` as `"<area>:view"` or
 * `"<area>:edit"`. A bare `"<area>"` (the format used before access levels
 * existed) means "edit" for Editors and "view" for Viewers.
 */
export const ADMIN_MODULES = [
  { id: 'overview', label: 'Dashboard', group: 'General', description: 'Key numbers and recent activity.' },
  { id: 'retreats', label: 'Retreats & bookings', group: 'Retreats', description: 'Retreat sessions, bookings, approvals and check-in.' },
  { id: 'donations', label: 'Donations', group: 'Giving', description: 'Gifts, payment status and donor details.' },
  { id: 'mass-intentions', label: 'Mass intentions', group: 'Giving', description: 'Mass intention requests and their scheduling.' },
  { id: 'feedback', label: 'Inbox', group: 'Inbox', description: 'Messages sent through the contact form.' },
  { id: 'homepage', label: 'Homepage', group: 'Website content', description: 'Hero slides, quick links, patrons and testimonials.' },
  { id: 'news', label: 'News', group: 'Website content', description: 'News stories and announcements.' },
  { id: 'events', label: 'Events', group: 'Website content', description: 'Upcoming events.' },
  { id: 'articles', label: 'Articles', group: 'Website content', description: 'Reflections and long-form articles.' },
  { id: 'publications', label: 'Publications', group: 'Website content', description: 'Books, letters and the bookshop.' },
  { id: 'gallery', label: 'Gallery', group: 'Website content', description: 'Photos, videos and audio.' },
  { id: 'ministries', label: 'Ministries', group: 'Website content', description: 'Ministry pages.' },
  { id: 'patrons', label: 'Patrons', group: 'Website content', description: 'Patron saints and clergy.' },
  { id: 'about', label: 'About page', group: 'Website content', description: 'Mission, history and leadership.' },
  { id: 'team', label: 'Team & access', group: 'Organisation', description: 'Invite people and set what they can do.' },
] as const

export type AdminModuleId = (typeof ADMIN_MODULES)[number]['id']
export type AccessLevel = 'view' | 'edit'

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPERADMIN: 'Owner',
  EDITOR: 'Manager',
  VIEWER: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  SUPERADMIN: 'Full access to everything, including team and access settings.',
  EDITOR: 'Can view or edit the areas you choose.',
  VIEWER: 'Read-only access to the areas you choose.',
}

export const DEFAULT_ALLOWED_MODULES: string[] = ['overview:view']

export const ADMIN_MODULE_LABELS: Record<AdminModuleId, string> = ADMIN_MODULES.reduce(
  (acc, module) => ({ ...acc, [module.id]: module.label }),
  {} as Record<AdminModuleId, string>,
)

export const isAdminModuleId = (value: unknown): value is AdminModuleId =>
  typeof value === 'string' && ADMIN_MODULES.some((module) => module.id === value)

/** Splits `"news:edit"` into its parts. Returns null for unknown areas. */
export const parseGrant = (value: unknown): { moduleId: AdminModuleId; level: AccessLevel | null } | null => {
  if (typeof value !== 'string') return null
  const [moduleId, level] = value.split(':')
  if (!isAdminModuleId(moduleId)) return null
  if (level === 'view' || level === 'edit') return { moduleId, level }
  return { moduleId, level: null }
}

/**
 * Cleans a list of grants from user input: drops unknown areas, keeps the
 * highest level per area, and always includes the dashboard.
 */
export const sanitizeModules = (modules: unknown): string[] => {
  if (!Array.isArray(modules)) return DEFAULT_ALLOWED_MODULES
  const levels = new Map<AdminModuleId, AccessLevel | null>()
  for (const entry of modules) {
    const grant = parseGrant(entry)
    if (!grant) continue
    const previous = levels.get(grant.moduleId)
    if (previous === 'edit') continue
    if (previous === undefined || grant.level === 'edit' || (previous === null && grant.level)) {
      levels.set(grant.moduleId, grant.level)
    }
  }
  if (!levels.has('overview')) levels.set('overview', 'view')
  return Array.from(levels, ([moduleId, level]) => (level ? `${moduleId}:${level}` : moduleId))
}

/** Converts a role plus a map of area levels into stored grants. */
export const grantsFromLevels = (levels: Partial<Record<AdminModuleId, AccessLevel | 'none'>>): string[] =>
  sanitizeModules(
    Object.entries(levels)
      .filter(([, level]) => level && level !== 'none')
      .map(([moduleId, level]) => `${moduleId}:${level}`),
  )
