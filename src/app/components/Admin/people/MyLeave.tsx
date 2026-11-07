'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'

import { StatusPill } from '@/app/components/Admin/shell/fields'
import { Panel } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { api, ConfirmButton, emptyLeaveForm, formatRange, LeaveBalance, LeaveFormFields, leaveLabel, type LeaveFormValues, type LeaveRow } from './common'

type MyLeaveResponse = {
  data: { member: { id: string; fullName: string; annualLeaveDays: number }; annualLeaveUsed: number; requests: LeaveRow[] } | null
}

/** Self-service leave on the account page, for logins linked to a member profile. */
export function MyLeave() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<LeaveFormValues>(emptyLeaveForm)
  const [showForm, setShowForm] = useState(false)
  const query = useQuery({ queryKey: ['my-leave'], queryFn: () => api<MyLeaveResponse>('/api/admin/me/leave') })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-leave'] })

  const request = useMutation({
    mutationFn: () => api('/api/admin/me/leave', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      toast.success('Leave requested. You will see the decision here.')
      setForm(emptyLeaveForm())
      setShowForm(false)
      refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const cancel = useMutation({
    mutationFn: (id: string) => api(`/api/admin/leave/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }),
    onSuccess: () => {
      toast.success('Request cancelled')
      refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (query.isPending) return null
  const data = query.data?.data
  if (!data) return null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Panel
      title='My leave'
      description='Request time off and follow its approval.'
      actions={
        !showForm && (
          <Button size='sm' onClick={() => setShowForm(true)}>
            Request leave
          </Button>
        )
      }
    >
      <div className='grid gap-6 lg:grid-cols-[18rem_1fr]'>
        <div className='self-start rounded-xl border border-border p-4'>
          <p className='text-sm font-medium text-navy-950'>Annual leave this year</p>
          <div className='mt-3'>
            <LeaveBalance used={data.annualLeaveUsed} allowance={data.member.annualLeaveDays} />
          </div>
        </div>
        <div className='space-y-4'>
          {showForm && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                request.mutate()
              }}
              className='space-y-4 rounded-xl border border-border bg-muted/30 p-4'
            >
              <LeaveFormFields value={form} onChange={setForm} />
              <div className='flex gap-2'>
                <Button type='submit' disabled={request.isPending} className='gap-2'>
                  {request.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                  Send request
                </Button>
                <Button type='button' variant='outline' onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
          {!data.requests.length ? (
            <p className='text-sm text-muted-foreground'>You have not requested any leave yet.</p>
          ) : (
            <ul className='divide-y divide-border rounded-xl border border-border'>
              {data.requests.map((row) => {
                const cancellable = row.status === 'pending' || (row.status === 'approved' && row.startDate > today)
                return (
                  <li key={row.id} className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm'>
                    <div>
                      <p className='font-medium text-navy-950'>
                        {leaveLabel(row.leaveType)} · {formatRange(row.startDate, row.endDate)}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {row.days} day{row.days === 1 ? '' : 's'}
                        {row.reviewedByName && ` · reviewed by ${row.reviewedByName}`}
                        {row.reviewNote && ` · “${row.reviewNote}”`}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <StatusPill status={row.status} label={row.status === 'rejected' ? 'Declined' : undefined} />
                      {cancellable && (
                        <ConfirmButton label='Cancel' confirmLabel='Cancel request' variant='ghost' disabled={cancel.isPending} onConfirm={() => cancel.mutate(row.id)} />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  )
}
