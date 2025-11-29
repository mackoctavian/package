import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@dashboard/components/data-table'
import { type InventoryItem } from '@dashboard/hooks/use-inventory-items'
import { ItemsRowActions } from './items-row-actions'

type ItemsColumnOptions = {
  formatPrice: (value: number) => string
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  actionsDisabled?: boolean
}

export function createInventoryItemsColumns(
  options: ItemsColumnOptions
): ColumnDef<InventoryItem>[] {
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
        <DataTableColumnHeader column={column} title='Item' />
      ),
      meta: { className: 'ps-2', tdClassName: 'ps-6' },
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className='flex flex-col gap-1'>
            <span className='font-medium leading-tight'>{item.name}</span>
            <span className='text-muted-foreground text-xs leading-tight'>
              {item.stockKeepingUnit || 'No SKU'}
            </span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Reporting category' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <span className='text-sm'>
          {row.original.category?.name ?? 'Unassigned'}
        </span>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.category?.name ?? ''
        const b = rowB.original.category?.name ?? ''
        return a.localeCompare(b)
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
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.location?.nickname ?? rowA.original.location?.name ?? ''
        const b = rowB.original.location?.nickname ?? rowB.original.location?.name ?? ''
        return a.localeCompare(b)
      },
    },
    {
      accessorKey: 'stockQuantity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Availability' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => {
        const quantity = row.original.stockQuantity ?? 0
        const negative = quantity < 0
        return (
          <Badge
            variant={negative ? 'destructive' : 'secondary'}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              negative && 'bg-destructive/15 text-destructive'
            )}
          >
            {quantity.toLocaleString()}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Price' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4 text-right' },
      cell: ({ row }) => (
        <span className='font-medium'>
          {options.formatPrice(row.original.price ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => {
        const isActive = row.original.isActive
        return (
          <Badge
            variant={isActive ? 'outline' : 'secondary'}
            className={cn(
              'rounded-full px-3 py-[2px] text-xs font-medium',
              !isActive && 'border-none bg-muted text-muted-foreground'
            )}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        if (!Array.isArray(value) || value.length === 0) return true
        const status = row.getValue<boolean>(id)
        if (status) {
          return value.includes('active')
        }
        return value.includes('inactive')
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <ItemsRowActions
          item={row.original}
          onEdit={options.onEdit}
          onDelete={options.onDelete}
          disabled={options.actionsDisabled}
        />
      ),
      size: 60,
    },
  ]
}

