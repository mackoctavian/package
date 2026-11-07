'use client'

import type { AdminRole } from '@prisma/client'
import { Crown, Eye, PencilLine } from 'lucide-react'

import { type AccessLevel, ADMIN_MODULES, type AdminModuleId, parseGrant, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { cn } from '@/lib/utils'

export type LevelMap = Partial<Record<AdminModuleId, AccessLevel | 'none'>>

const GROUPS = Array.from(new Set(ADMIN_MODULES.map((module) => module.group)))

export const levelsFromGrants = (grants: string[], role: AdminRole): LevelMap => {
  const map: LevelMap = {}
  for (const entry of grants) {
    const grant = parseGrant(entry)
    if (!grant) continue
    map[grant.moduleId] = grant.level ?? (role === 'VIEWER' ? 'view' : 'edit')
  }
  map.overview = 'view'
  return map
}

export const grantsFromLevelMap = (levels: LevelMap, role: AdminRole) =>
  Object.entries(levels)
    .filter(([, level]) => level && level !== 'none')
    .map(([moduleId, level]) => `${moduleId}:${role === 'VIEWER' ? 'view' : level}`)

export const PRESETS: Array<{ id: string; label: string; description: string; role: AdminRole; levels: LevelMap }> = [
  {
    id: 'retreat-desk',
    label: 'Retreat desk',
    description: 'Bookings, approvals and check-in',
    role: 'EDITOR',
    levels: { overview: 'view', retreats: 'edit', 'check-in': 'edit', feedback: 'view' },
  },
  {
    id: 'door',
    label: 'Door volunteer',
    description: 'Only scans tickets at check-in',
    role: 'EDITOR',
    levels: { overview: 'view', 'check-in': 'edit' },
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Donations and Mass intentions',
    role: 'EDITOR',
    levels: { overview: 'view', donations: 'edit', 'mass-intentions': 'edit', retreats: 'view' },
  },
  {
    id: 'content',
    label: 'Website editor',
    description: 'All website content',
    role: 'EDITOR',
    levels: {
      overview: 'view',
      homepage: 'edit',
      news: 'edit',
      events: 'edit',
      articles: 'edit',
      publications: 'edit',
      gallery: 'edit',
      ministries: 'edit',
      patrons: 'edit',
      about: 'edit',
    },
  },
  {
    id: 'read-only',
    label: 'Read-only',
    description: 'Can see everything, change nothing',
    role: 'VIEWER',
    levels: Object.fromEntries(ADMIN_MODULES.filter((m) => m.id !== 'team').map((m) => [m.id, 'view'])) as LevelMap,
  },
]

const ROLE_ICONS = { SUPERADMIN: Crown, EDITOR: PencilLine, VIEWER: Eye }

export function RolePicker({ value, onChange, allowOwner }: { value: AdminRole; onChange: (role: AdminRole) => void; allowOwner: boolean }) {
  const roles: AdminRole[] = allowOwner ? ['EDITOR', 'VIEWER', 'SUPERADMIN'] : ['EDITOR', 'VIEWER']
  return (
    <div role='radiogroup' aria-label='Role' className='grid gap-2 sm:grid-cols-3'>
      {roles.map((role) => {
        const Icon = ROLE_ICONS[role]
        const selected = value === role
        return (
          <button
            key={role}
            type='button'
            role='radio'
            aria-checked={selected}
            onClick={() => onChange(role)}
            className={cn(
              'rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
              selected ? 'border-navy-800 bg-navy-50 ring-1 ring-navy-800' : 'border-border hover:border-navy-300',
            )}
          >
            <span className='flex items-center gap-2 text-sm font-semibold text-navy-950'>
              <Icon className='h-4 w-4 text-gold-700' /> {ROLE_LABELS[role]}
            </span>
            <span className='mt-1 block text-xs text-muted-foreground'>{ROLE_DESCRIPTIONS[role]}</span>
          </button>
        )
      })}
    </div>
  )
}

export function AccessMatrix({
  role,
  levels,
  onChange,
  maxLevel,
}: {
  role: AdminRole
  levels: LevelMap
  onChange: (levels: LevelMap) => void
  /** The most the current admin may grant per area (non-Owners can only pass on what they hold). */
  maxLevel: (moduleId: AdminModuleId) => AccessLevel | null
}) {
  if (role === 'SUPERADMIN') {
    return (
      <p className='rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-700'>
        Owners can see and change everything, including who has access. Keep this role for one or two trusted people.
      </p>
    )
  }
  const options: Array<AccessLevel | 'none'> = role === 'VIEWER' ? ['none', 'view'] : ['none', 'view', 'edit']
  const optionLabel = { none: 'No access', view: 'View', edit: 'Edit' }

  return (
    <div className='space-y-5'>
      {GROUPS.map((group) => (
        <fieldset key={group}>
          <legend className='mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>{group}</legend>
          <div className='divide-y divide-border rounded-xl border border-border'>
            {ADMIN_MODULES.filter((module) => module.group === group).map((module) => {
              const current = module.id === 'overview' ? 'view' : (levels[module.id] ?? 'none')
              const limit = maxLevel(module.id)
              return (
                <div key={module.id} className='flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-navy-950'>{module.label}</p>
                    <p className='text-xs text-muted-foreground'>{module.description}</p>
                  </div>
                  <div role='radiogroup' aria-label={`${module.label} access`} className='inline-flex shrink-0 rounded-lg border border-border bg-muted/50 p-0.5'>
                    {options.map((option) => {
                      const disabled =
                        module.id === 'overview' ? option !== 'view' : option === 'none' ? false : !limit || (option === 'edit' && limit !== 'edit')
                      const selected = current === option
                      return (
                        <button
                          key={option}
                          type='button'
                          role='radio'
                          aria-checked={selected}
                          disabled={disabled}
                          onClick={() => onChange({ ...levels, [module.id]: option })}
                          className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
                            selected ? 'bg-white text-navy-950 shadow-sm' : 'text-muted-foreground hover:text-navy-900',
                            selected && option === 'edit' && 'bg-navy-900 text-white',
                          )}
                        >
                          {optionLabel[option]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

export const accessSummary = (role: AdminRole, grants: string[]) => {
  if (role === 'SUPERADMIN') return 'Everything'
  const levels = levelsFromGrants(grants, role)
  const entries = Object.entries(levels).filter(([id, level]) => id !== 'overview' && level && level !== 'none')
  if (!entries.length) return 'Dashboard only'
  const edit = entries.filter(([, level]) => level === 'edit').length
  return `${entries.length} area${entries.length === 1 ? '' : 's'}${edit ? ` · edits ${edit}` : ' · view only'}`
}
