export const ADMIN_MODULES = [
  { id: 'overview', label: 'Overview' },
  { id: 'homepage', label: 'Homepage CMS' },
  { id: 'retreats', label: 'Retreats' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'news', label: 'News & Events' },
  { id: 'events', label: 'Events' },
  { id: 'publications', label: 'Publications' },
  { id: 'articles', label: 'Articles' },
  { id: 'patrons', label: 'Patrons' },
  { id: 'ministries', label: 'Ministries' },
  { id: 'about', label: 'About' },
  { id: 'feedback', label: 'Feedback Inbox' },
  { id: 'mass-intentions', label: 'Mass Intentions' },
  { id: 'donations', label: 'Donations' },
  { id: 'team', label: 'Admin Team' },
] as const

export type AdminModuleId = (typeof ADMIN_MODULES)[number]['id']

export const DEFAULT_ALLOWED_MODULES: AdminModuleId[] = ['overview']

export const ADMIN_MODULE_LABELS: Record<AdminModuleId, string> = ADMIN_MODULES.reduce(
  (acc, module) => ({ ...acc, [module.id]: module.label }),
  {} as Record<AdminModuleId, string>,
)

export const sanitizeModules = (modules: unknown): AdminModuleId[] => {
  if (!Array.isArray(modules)) return DEFAULT_ALLOWED_MODULES
  const entries = modules.filter((value): value is AdminModuleId =>
    ADMIN_MODULES.some((module) => module.id === value),
  )
  return entries.length ? Array.from(new Set(entries)) : DEFAULT_ALLOWED_MODULES
}


