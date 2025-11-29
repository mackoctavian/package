import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@dashboard/components/data-table'
import { type InventoryDepartment } from '@dashboard/hooks/use-inventory-departments'
import { DepartmentsRowActions } from './departments-row-actions'

type DepartmentsColumnOptions = {
  onEdit: (department: InventoryDepartment) => void
  onDelete: (department: InventoryDepartment) => void
  disableActions?: boolean
}

export function createDepartmentColumns(
  options: DepartmentsColumnOptions
): ColumnDef<InventoryDepartment>[] {
  return [
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
      size: 36,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Department' />
      ),
      meta: { className: 'ps-2', tdClassName: 'ps-6' },
      cell: ({ row }) => {
        const department = row.original
        return (
          <div className='flex flex-col gap-1'>
            <span className='font-medium leading-tight'>{department.name}</span>
            {department.description ? (
              <span className='text-muted-foreground text-xs leading-tight'>
                {department.description}
              </span>
            ) : null}
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Location' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <span className='text-sm'>
          {row.original.location?.nickname ?? row.original.location?.name ?? 'All locations'}
        </span>
      ),
      sortingFn: (a, b) => {
        const nameA = a.original.location?.nickname ?? a.original.location?.name ?? ''
        const nameB = b.original.location?.nickname ?? b.original.location?.name ?? ''
        return nameA.localeCompare(nameB)
      },
    },
    {
      accessorKey: 'tileColor',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Color' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <span className='text-sm text-muted-foreground'>
          {row.original.tileColor ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? 'outline' : 'secondary'}
          className='rounded-full px-3 py-[2px] text-xs font-medium'
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        if (!Array.isArray(value) || value.length === 0) return true
        const status = row.getValue<boolean>(id)
        return status ? value.includes('active') : value.includes('inactive')
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DepartmentsRowActions
          department={row.original}
          onEdit={options.onEdit}
          onDelete={options.onDelete}
          disabled={options.disableActions}
        />
      ),
      size: 60,
    },
  ]
}

