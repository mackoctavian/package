"use client"

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { ConfigDrawer } from '@dashboard/components/config-drawer'
import { Header } from '@dashboard/components/layout/header'
import { Main } from '@dashboard/components/layout/main'
import { ProfileDropdown } from '@dashboard/components/profile-dropdown'
import { Search } from '@dashboard/components/search'
import { ThemeSwitch } from '@dashboard/components/theme-switch'
import { useSidebarInfo } from '@dashboard/hooks/use-sidebar-info'
import {
  useCreateTeamMember,
  useDeleteTeamMember,
  useTeamMembers,
  useUpdateTeamMember,
} from '@dashboard/hooks/use-team-members'

import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import type { TeamMember } from './data/schema'

export function Users() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const search = useMemo(() => {
    const toNumber = (value: string | null) => {
      if (!value) return undefined
      const parsed = Number(value)
      return Number.isNaN(parsed) ? undefined : parsed
    }

    const collectArray = (key: string) => {
      const values = searchParams.getAll(key)
      return values.length > 0 ? values : undefined
    }

    return {
      page: toNumber(searchParams.get('page')),
      pageSize: toNumber(searchParams.get('pageSize')),
      filter: searchParams.get('filter') ?? undefined,
      name: searchParams.get('name') ?? undefined,
      status: collectArray('status'),
      role: collectArray('role'),
      locationId: collectArray('locationId'),
    } as Record<string, unknown>
  }, [searchParams])

  const navigate = useCallback(
    ({
      search: searchArg,
      replace,
    }: {
      search:
        | true
        | Record<string, unknown>
        | ((prev: Record<string, unknown>) => Record<string, unknown>)
      replace?: boolean
    }) => {
      const base = { ...search }
      let next: Record<string, unknown>

      if (searchArg === true) {
        next = base
      } else if (typeof searchArg === 'function') {
        const result = searchArg(base)
        next = { ...base, ...result }
      } else {
        next = { ...base, ...searchArg }
      }

      const params = new URLSearchParams()

      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === null || value === '') {
          continue
        }

        if (Array.isArray(value)) {
          if (value.length === 0) continue
          value.forEach((item) => {
            if (item !== undefined && item !== null && `${item}` !== '') {
              params.append(key, `${item}`)
            }
          })
        } else {
          params.set(key, `${value}`)
        }
      }

      const query = params.toString()
      const url = query ? `${pathname}?${query}` : pathname

      if (replace) {
        router.replace(url, { scroll: false })
      } else {
        router.replace(url, { scroll: false })
      }
    },
    [pathname, router, search]
  )

  const { data: members = [], isLoading } = useTeamMembers()
  const sidebarInfo = useSidebarInfo()
  const { mutateAsync: createMember, isPending: isCreating } = useCreateTeamMember()
  const { mutateAsync: updateMember, isPending: isUpdating } = useUpdateTeamMember()
  const { mutateAsync: deleteMember, isPending: isDeleting } = useDeleteTeamMember()

  const locationOptions = useMemo(
    () =>
      (sidebarInfo.data?.locations ?? []).map((location) => ({
        label: location.nickname ?? location.name,
        value: location.id,
      })),
    [sidebarInfo.data?.locations]
  )

  const locationFilterOptions = useMemo(
    () => [...locationOptions, { label: 'No location', value: 'none' }],
    [locationOptions]
  )

  const handleCreate = useCallback(
    async (input: Parameters<typeof createMember>[0]) => {
      await toast.promise(createMember(input), {
        loading: 'Saving team member...',
        success: 'Team member created',
        error: (err) => err.message ?? 'Failed to create team member',
      })
    },
    [createMember]
  )

  const handleUpdate = useCallback(
    async (id: string, input: Parameters<typeof updateMember>[0]['input']) => {
      await toast.promise(updateMember({ id, input }), {
        loading: 'Updating team member...',
        success: 'Team member updated',
        error: (err) => err.message ?? 'Failed to update team member',
      })
    },
    [updateMember]
  )

  const handleDelete = useCallback(
    async (member: TeamMember) => {
      await toast.promise(deleteMember(member.id), {
        loading: 'Removing team member...',
        success: 'Team member removed',
        error: (err) => err.message ?? 'Failed to remove team member',
      })
    },
    [deleteMember]
  )

  const isSubmitting = isCreating || isUpdating

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Team members</h2>
            <p className='text-muted-foreground'>
              Invite new staff, manage roles, and control access for each location.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable
          data={members}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
          locationFilters={locationFilterOptions}
        />
      </Main>

      <UsersDialogs
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        locationOptions={locationOptions}
      />
    </UsersProvider>
  )
}

