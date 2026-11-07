'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChevronsUpDown, ExternalLink, KeyRound, LogOut, Menu, Search, X } from 'lucide-react'

import { AdminUserProvider } from '@dashboard/context/admin-user'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { type AdminUserPayload, userHasModuleAccess } from '@/lib/auth/admin-shared'
import { cn } from '@/lib/utils'
import { CommandPalette } from './CommandPalette'
import { ADMIN_NAV, findNavItem } from './nav'

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

function useVisibleNav(user: AdminUserPayload) {
  return useMemo(
    () =>
      ADMIN_NAV.map((group) => ({ ...group, items: group.items.filter((item) => userHasModuleAccess(user, item.moduleId)) })).filter(
        (group) => group.items.length,
      ),
    [user],
  )
}

function SidebarNav({ user, onNavigate }: { user: AdminUserPayload; onNavigate?: () => void }) {
  const pathname = usePathname()
  const groups = useVisibleNav(user)
  const active = findNavItem(pathname)

  return (
    <nav aria-label='Admin' className='flex-1 space-y-6 overflow-y-auto px-3 py-4'>
      {groups.map((group) => (
        <div key={group.title}>
          <p className='px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-300'>{group.title}</p>
          <ul className='space-y-0.5'>
            {group.items.map((item) => {
              const isActive = active?.href === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-gold-300' : 'text-navy-300 group-hover:text-navy-100')} />
                    <span className='truncate'>{item.title}</span>
                    {isActive && <span aria-hidden className='ml-auto h-1.5 w-1.5 rounded-full bg-gold-300' />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <Link href='/admin' className='flex items-center gap-3 px-6 py-5'>
      <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 font-display text-lg font-bold text-navy-950'>D</span>
      <span className='leading-tight'>
        <span className='block text-sm font-semibold text-white'>DMRC Admin</span>
        <span className='block text-xs text-navy-300'>Divine Mercy Retreat Center</span>
      </span>
    </Link>
  )
}

function UserMenu({ user, compact = false }: { user: AdminUserPayload; compact?: boolean }) {
  const router = useRouter()
  const signOut = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => null)
    router.replace('/login')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300',
          compact ? 'p-1 hover:bg-muted' : 'w-full p-2 hover:bg-white/5',
        )}
        aria-label='Account menu'
      >
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-200 text-xs font-bold text-navy-900'>{initials(user.name)}</span>
        {!compact && (
          <>
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-medium text-white'>{user.name}</span>
              <span className='block truncate text-xs text-navy-300'>{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronsUpDown className='h-4 w-4 text-navy-300' />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? 'end' : 'start'} side={compact ? 'bottom' : 'top'} className='w-60'>
        <DropdownMenuLabel>
          <p className='truncate text-sm font-semibold'>{user.name}</p>
          <p className='truncate text-xs font-normal text-muted-foreground'>{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/admin/account'>
            <KeyRound className='mr-2 h-4 w-4' /> My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href='/' target='_blank' rel='noopener noreferrer'>
            <ExternalLink className='mr-2 h-4 w-4' /> View website
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className='text-rose-600 focus:text-rose-700'>
          <LogOut className='mr-2 h-4 w-4' /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AdminShell({ user, children }: { user: AdminUserPayload; children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = usePathname()
  const current = findNavItem(pathname)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AdminUserProvider value={user}>
        <a href='#admin-main' className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2'>
          Skip to content
        </a>

        {/* Desktop sidebar */}
        <aside className='fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-navy-950 lg:flex'>
          <Brand />
          <SidebarNav user={user} />
          <div className='border-t border-white/10 p-3'>
            <UserMenu user={user} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className='fixed inset-0 z-50 lg:hidden' role='dialog' aria-modal='true' aria-label='Navigation'>
            <button type='button' aria-label='Close navigation' className='absolute inset-0 bg-navy-950/60 backdrop-blur-sm' onClick={() => setDrawerOpen(false)} />
            <aside className='relative flex h-full w-72 max-w-[85vw] flex-col bg-navy-950 shadow-2xl'>
              <div className='flex items-center justify-between pr-3'>
                <Brand />
                <button type='button' onClick={() => setDrawerOpen(false)} className='rounded-md p-2 text-navy-200 hover:bg-white/10' aria-label='Close navigation'>
                  <X className='h-5 w-5' />
                </button>
              </div>
              <SidebarNav user={user} onNavigate={() => setDrawerOpen(false)} />
              <div className='border-t border-white/10 p-3'>
                <UserMenu user={user} />
              </div>
            </aside>
          </div>
        )}

        <div className='lg:pl-64'>
          <header className='sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur sm:px-6'>
            <button type='button' onClick={() => setDrawerOpen(true)} className='-ml-1 rounded-md p-2 text-navy-700 hover:bg-muted lg:hidden' aria-label='Open navigation'>
              <Menu className='h-5 w-5' />
            </button>
            <p className='truncate text-sm font-medium text-muted-foreground'>
              <span className='hidden sm:inline'>Admin / </span>
              <span className='text-foreground'>{current?.title ?? (pathname.startsWith('/admin/account') ? 'My account' : 'Admin')}</span>
            </p>
            <button
              type='button'
              onClick={() => setPaletteOpen(true)}
              className='ml-auto flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition hover:bg-muted sm:w-64'
            >
              <Search className='h-4 w-4' />
              <span className='hidden sm:inline'>Search or jump to…</span>
              <kbd className='ml-auto hidden rounded border border-border bg-white px-1.5 text-[10px] font-medium sm:inline'>⌘K</kbd>
            </button>
            <div className='lg:hidden'>
              <UserMenu user={user} compact />
            </div>
          </header>
          <main id='admin-main' className='min-h-[calc(100vh-4rem)]'>
            {children}
          </main>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} user={user} />
      </AdminUserProvider>
    </QueryClientProvider>
  )
}
