import { type ColumnDef } from '@tanstack/react-table'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/long-text'
import { DataTableColumnHeader } from '@dashboard/components/data-table'

import { statusVariants, teamMemberRoles } from '../data/data'
import { type TeamMember } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const usersColumns: ColumnDef<TeamMember>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    accessorFn: (row) => `${row.preferredName} ${row.lastName}`.trim(),
    cell: ({ row }) => {
      const member = row.original
      const fullName = `${member.preferredName} ${member.lastName}`.trim()
      return <LongText className='max-w-40 ps-3 font-medium'>{fullName}</LongText>
    },
    meta: {
      className: cn(
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='ps-2 text-sm text-muted-foreground'>
        {row.original.email ?? '—'}
      </div>
    ),
  },
  {
    accessorKey: 'mobileNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone' />
    ),
    cell: ({ row }) => (
      <div className='text-sm'>{row.original.mobileNumber ?? '—'}</div>
    ),
    enableSorting: false,
  },
  {
    id: 'role',
    accessorFn: (row) => row.role ?? '',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const roleValue = row.original.role
      if (!roleValue) {
        return <span className='text-sm text-muted-foreground'>—</span>
      }

      const match = teamMemberRoles.find((role) => role.value === roleValue)

      return (
        <div className='flex items-center gap-x-2 text-sm capitalize'>
          {match?.icon ? <match.icon size={16} className='text-muted-foreground' /> : null}
          <span>{roleValue}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const cellValue = (row.getValue(id) as string) ?? ''
      return value.includes(cellValue)
    },
  },
  {
    id: 'location',
    accessorFn: (row) => row.location?.id ?? '',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Location' />
    ),
    cell: ({ row }) => {
      const location = row.original.location
      if (!location) return <span className='text-sm text-muted-foreground'>—</span>
      return (
        <div className='flex flex-col text-sm'>
          <span>{location.nickname ?? location.name}</span>
          {location.nickname && location.nickname !== location.name ? (
            <span className='text-muted-foreground text-xs'>{location.name}</span>
          ) : null}
        </div>
      )
    },
    filterFn: (row, _id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const locationId = row.original.location?.id ?? ''
      const wantsUnassigned = value.includes('none')

      if (!locationId) {
        return wantsUnassigned
      }

      return value.includes(locationId)
    },
  },
  {
    id: 'status',
    accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.isActive ? 'active' : 'inactive'
      const badgeClass = statusVariants.get(status) ?? ''
      return (
        <Badge variant='outline' className={cn('capitalize', badgeClass)}>
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]

