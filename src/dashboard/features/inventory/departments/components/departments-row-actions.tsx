"use client"

import { MoreHorizontal, Pencil, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type InventoryDepartment } from '@dashboard/hooks/use-inventory-departments'

type DepartmentsRowActionsProps = {
  department: InventoryDepartment
  onEdit: (department: InventoryDepartment) => void
  onDelete: (department: InventoryDepartment) => void
  disabled?: boolean
}

export function DepartmentsRowActions({
  department,
  onEdit,
  onDelete,
  disabled,
}: DepartmentsRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='size-8 p-0' disabled={disabled}>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem onClick={() => onEdit(department)}>
          <Pencil className='mr-2 h-4 w-4' /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onClick={() => onDelete(department)}
        >
          <Trash className='mr-2 h-4 w-4' /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

