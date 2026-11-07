'use client'

import { useRouter } from 'next/navigation'
import { ExternalLink, Download } from 'lucide-react'

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/app/components/ui/command'
import { type AdminUserPayload, userHasModuleAccess } from '@/lib/auth/admin-shared'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { ADMIN_NAV, canSeeNavItem } from './nav'

const EXPORTS: Array<{ title: string; dataset: string; moduleId: AdminModuleId }> = [
  { title: 'Export bookings to Excel', dataset: 'bookings', moduleId: 'retreats' },
  { title: 'Export donations to Excel', dataset: 'donations', moduleId: 'donations' },
  { title: 'Export Mass intentions to Excel', dataset: 'mass-intentions', moduleId: 'mass-intentions' },
  { title: 'Export messages to Excel', dataset: 'feedback', moduleId: 'feedback' },
  { title: 'Export members directory to Excel', dataset: 'members', moduleId: 'members' },
  { title: 'Export leave requests to Excel', dataset: 'leave', moduleId: 'leave' },
  { title: 'Export team list to Excel', dataset: 'team', moduleId: 'team' },
]

export function CommandPalette({ open, onOpenChange, user }: { open: boolean; onOpenChange: (open: boolean) => void; user: AdminUserPayload }) {
  const router = useRouter()
  const run = (action: () => void) => {
    onOpenChange(false)
    action()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder='Search pages and actions…' />
      <CommandList>
        <CommandEmpty>Nothing matches that search.</CommandEmpty>
        {ADMIN_NAV.map((group) => {
          const items = group.items.filter((item) => canSeeNavItem(user, item))
          if (!items.length) return null
          return (
            <CommandGroup key={group.title} heading={group.title}>
              {items.map((item) => (
                <CommandItem key={item.href} value={`${item.title} ${item.keywords ?? ''}`} onSelect={() => run(() => router.push(item.href))}>
                  <item.icon className='mr-2 h-4 w-4 text-muted-foreground' />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
        <CommandGroup heading='Export'>
          {EXPORTS.filter((item) => userHasModuleAccess(user, item.moduleId)).map((item) => (
            <CommandItem key={item.dataset} value={item.title} onSelect={() => run(() => (window.location.href = `/api/admin/export/${item.dataset}`))}>
              <Download className='mr-2 h-4 w-4 text-muted-foreground' />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading='Website'>
          <CommandItem value='open public website' onSelect={() => run(() => window.open('/', '_blank', 'noopener'))}>
            <ExternalLink className='mr-2 h-4 w-4 text-muted-foreground' />
            Open the public website
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
