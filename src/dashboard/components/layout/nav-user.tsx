"use client"

import Link from 'next/link'
import { ChevronsUpDown } from 'lucide-react'
import useDialogState from '@dashboard/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuShortcut,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { SignOutDialog } from '@dashboard/components/sign-out-dialog'

type NavUserProps = {
  user?: {
    username?: string | null
    email?: string | null
    avatarUrl?: string | null
    businessName?: string | null
  }
  isLoading?: boolean
}

function getInitials(input?: string | null) {
  if (!input) return 'NA'
  const [first, second] = input.trim().split(/\s+/)
  if (!second) {
    return first.slice(0, 2).toUpperCase()
  }
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase()
}

export function NavUser({ user, isLoading }: NavUserProps) {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useDialogState()

  const displayName = user?.username || user?.businessName || user?.email || 'Account'
  const email = user?.email || 'Manage account details'
  const avatarUrl = user?.avatarUrl ?? undefined
  const initials = getInitials(displayName)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold capitalize'>
                    {isLoading ? 'Loading…' : displayName}
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {isLoading ? '' : email}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-semibold capitalize'>
                      {displayName}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {email}
                    </span>
                  </div>
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
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}

