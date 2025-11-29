import { type ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@dashboard/components/data-table'
import { type InventoryDiscount } from '@dashboard/hooks/use-inventory-discounts'
import { DiscountsRowActions } from './discounts-row-actions'

type DiscountsColumnOptions = {
  formatAmount: (value: number | null) => string
  onEdit: (discount: InventoryDiscount) => void
  onDelete: (discount: InventoryDiscount) => void
  disableActions?: boolean
}

export function createDiscountColumns(
  options: DiscountsColumnOptions
): ColumnDef<InventoryDiscount>[] {
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
        <DataTableColumnHeader column={column} title='Discount' />
      ),
      meta: { className: 'ps-2', tdClassName: 'ps-6' },
      cell: ({ row }) => (
        <div className='flex flex-col gap-1'>
          <span className='font-medium leading-tight'>{row.original.name}</span>
          <span className='text-muted-foreground text-xs leading-tight'>
            {row.original.type}
          </span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Amount' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <span className='font-medium'>
          {options.formatAmount(row.original.amount)}
        </span>
      ),
      sortingFn: (a, b) => {
        const amountA = a.original.amount ?? 0
        const amountB = b.original.amount ?? 0
        return amountA - amountB
      },
    },
    {
      accessorKey: 'applyAfterTax',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Apply after tax' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <Badge variant='secondary' className='rounded-full px-3 py-[2px] text-xs font-medium'>
          {row.original.applyAfterTax ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'requiresPasscode',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Passcode' />
      ),
      meta: { className: 'ps-1', tdClassName: 'ps-4' },
      cell: ({ row }) => (
        <Badge variant='secondary' className='rounded-full px-3 py-[2px] text-xs font-medium'>
          {row.original.requiresPasscode ? 'Required' : 'None'}
        </Badge>
      ),
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
        <DiscountsRowActions
          discount={row.original}
          onEdit={options.onEdit}
          onDelete={options.onDelete}
          disabled={options.disableActions}
        />
      ),
      size: 60,
    },
  ]
}

