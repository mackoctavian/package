"use client"

import Link from 'next/link'
import { useMemo } from 'react'
import useDialogState from '@dashboard/hooks/use-dialog-state'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@dashboard/components/sign-out-dialog'

function getInitials(input?: string | null) {
  if (!input) return 'NA'
  const parts = input.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() || 'NA'
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
}

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { data } = useSidebarInfo()
  const profile = data?.profile

  const displayName = useMemo(
    () => profile?.username || profile?.businessName || profile?.email || 'Account',
    [profile?.username, profile?.businessName, profile?.email],
  )
  const email = profile?.email ?? 'Manage account details'
  const avatarUrl = profile?.avatarUrl ?? undefined
  const initials = useMemo(() => getInitials(displayName), [displayName])

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{displayName}</p>
              <p className='text-muted-foreground text-xs leading-none'>{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href='/dashboard/settings/account'>
                Account
                <DropdownMenuShortcut>⇧⌘A</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/dashboard/settings/subscription'>
                Subscription
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className='text-destructive focus:bg-destructive/10 focus:text-destructive'
          >
            Sign out
            <DropdownMenuShortcut className='text-current'>
              ⇧⌘Q
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}

