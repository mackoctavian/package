"use client"

import { MoreHorizontal, Pencil, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type InventoryDiscount } from '@dashboard/hooks/use-inventory-discounts'

type DiscountsRowActionsProps = {
  discount: InventoryDiscount
  onEdit: (discount: InventoryDiscount) => void
  onDelete: (discount: InventoryDiscount) => void
  disabled?: boolean
}

export function DiscountsRowActions({
  discount,
  onEdit,
  onDelete,
  disabled,
}: DiscountsRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='size-8 p-0' disabled={disabled}>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem onClick={() => onEdit(discount)}>
          <Pencil className='mr-2 h-4 w-4' /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onClick={() => onDelete(discount)}
        >
          <Trash className='mr-2 h-4 w-4' /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

