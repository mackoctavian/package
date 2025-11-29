'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { type TeamMember } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: TeamMember
  onConfirm: (member: TeamMember) => Promise<void>
  isDeleting: boolean
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
  onConfirm,
  isDeleting,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')

  const confirmationToken = currentRow.preferredName

  const handleDelete = () => {
    if (value.trim() !== confirmationToken) return
    void (async () => {
      await onConfirm(currentRow)
      setValue('')
      onOpenChange(false)
    })()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          setValue('')
        }
        onOpenChange(state)
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== confirmationToken}
      isLoading={isDeleting}
      title={
        <span className='text-destructive flex items-center gap-2'>
          <AlertTriangle className='size-4' /> Delete team member
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            This will permanently remove{' '}
            <span className='font-semibold'>{currentRow.preferredName}</span>{' '}
            from your team. This action cannot be undone.
          </p>

          <Label className='flex flex-col gap-1 text-sm'>
            <span>
              Type <span className='font-mono'>{confirmationToken}</span> to confirm
            </span>
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={confirmationToken}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Removing a team member will revoke their access immediately.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  )
}

