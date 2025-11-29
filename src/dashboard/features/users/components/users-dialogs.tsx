import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'
import { useUsers } from './users-provider'

import { type CreateTeamMemberInput, type TeamMember, type UpdateTeamMemberInput } from '../data/schema'

type UsersDialogsProps = {
  onCreate: (input: CreateTeamMemberInput) => Promise<void>
  onUpdate: (id: string, input: UpdateTeamMemberInput) => Promise<void>
  onDelete: (member: TeamMember) => Promise<void>
  isSubmitting: boolean
  isDeleting: boolean
  locationOptions: Array<{ label: string; value: string }>
}

export function UsersDialogs({
  onCreate,
  onUpdate,
  onDelete,
  isSubmitting,
  isDeleting,
  locationOptions,
}: UsersDialogsProps) {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()

  const handleClose = () => setOpen(null)

  return (
    <>
      <UsersActionDialog
        key='team-member-add'
        mode='create'
        open={open === 'add'}
        onOpenChange={(state) => {
          if (!state) {
            handleClose()
          } else {
            setOpen('add')
          }
        }}
        onCreate={onCreate}
        onUpdate={onUpdate}
        isSubmitting={isSubmitting}
        locationOptions={locationOptions}
      />

      {currentRow && (
        <>
          <UsersActionDialog
            key={`team-member-edit-${currentRow.id}`}
            mode='edit'
            member={currentRow}
            open={open === 'edit'}
            onOpenChange={(state) => {
              if (!state) {
                handleClose()
                setTimeout(() => setCurrentRow(null), 0)
              } else {
                setOpen('edit')
              }
            }}
            onCreate={onCreate}
            onUpdate={onUpdate}
            isSubmitting={isSubmitting}
            locationOptions={locationOptions}
          />

          <UsersDeleteDialog
            key={`team-member-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={(state) => {
              if (!state) {
                handleClose()
                setTimeout(() => setCurrentRow(null), 0)
              } else {
                setOpen('delete')
              }
            }}
            currentRow={currentRow}
            onConfirm={onDelete}
            isDeleting={isDeleting}
          />
        </>
      )}
    </>
  )
}

