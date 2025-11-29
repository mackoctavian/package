import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@dashboard/components/data-table'

import { type TeamMember } from '../data/schema'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedMembers = selectedRows.map((row) => row.original as TeamMember)
    toast.promise(sleep(2000), {
      loading: `${status === 'active' ? 'Activating' : 'Deactivating'} team members...`,
      success: () => {
        table.resetRowSelection()
        return `${status === 'active' ? 'Activated' : 'Deactivated'} ${selectedMembers.length} team member${selectedMembers.length > 1 ? 's' : ''}`
      },
      error: `Error ${status === 'active' ? 'activating' : 'deactivating'} team members`,
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedMembers = selectedRows.map((row) => row.original as TeamMember)
    toast.promise(sleep(2000), {
      loading: 'Inviting team members...',
      success: () => {
        table.resetRowSelection()
        return `Invited ${selectedMembers.length} team member${selectedMembers.length > 1 ? 's' : ''}`
      },
      error: 'Error inviting team members',
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='team member'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkInvite}
              className='size-8'
              aria-label='Invite selected team members'
              title='Invite selected team members'
            >
              <Mail />
              <span className='sr-only'>Invite selected team members</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Invite selected team members</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('active')}
              className='size-8'
              aria-label='Activate selected team members'
              title='Activate selected team members'
            >
              <UserCheck />
              <span className='sr-only'>Activate selected team members</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Activate selected team members</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('inactive')}
              className='size-8'
              aria-label='Deactivate selected team members'
              title='Deactivate selected team members'
            >
              <UserX />
              <span className='sr-only'>Deactivate selected team members</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deactivate selected team members</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected team members'
              title='Delete selected team members'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected team members</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected team members</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}

