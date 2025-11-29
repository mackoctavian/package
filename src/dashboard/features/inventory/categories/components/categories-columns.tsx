import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@dashboard/components/data-table'
import { type InventoryCategory } from '@dashboard/hooks/use-inventory-categories'
import { CategoriesRowActions } from './categories-row-actions'

type CategoriesColumnOptions = {
  onEdit: (category: InventoryCategory) => void
  onDelete: (category: InventoryCategory) => void
  disableActions?: boolean
}

export function createCategoryColumns(
  options: CategoriesColumnOptions
): ColumnDef<InventoryCategory>[] {
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
      minSize: 36,
      maxSize: 48,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Category' />
      ),
      meta: { className: 'ps-2', tdClassName: 'ps-6' },
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className='flex flex-col gap-1'>
            <span className='font-medium leading-tight'>{category.name}</span>
            {category.description ? (
              <span className='text-muted-foreground text-xs leading-tight'>
                {category.description}
              </span>
            ) : null}
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'parent',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Parent' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <span className='text-sm'>
          {row.original.parent?.name ?? '—'}
        </span>
      ),
      sortingFn: (a, b) => {
        const nameA = a.original.parent?.name ?? ''
        const nameB = b.original.parent?.name ?? ''
        return nameA.localeCompare(nameB)
      },
    },
    {
      accessorKey: 'department',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Department' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <span className='text-sm'>
          {row.original.department?.name ?? '—'}
        </span>
      ),
      sortingFn: (a, b) => {
        const nameA = a.original.department?.name ?? ''
        const nameB = b.original.department?.name ?? ''
        return nameA.localeCompare(nameB)
      },
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
        <CategoriesRowActions
          category={row.original}
          onEdit={options.onEdit}
          onDelete={options.onDelete}
          disabled={options.disableActions}
        />
      ),
      size: 60,
    },
  ]
}

