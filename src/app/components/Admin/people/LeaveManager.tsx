'use client'

import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck2, CalendarClock, CalendarOff, Check, Hourglass, Loader2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAdminUser } from '@dashboard/context/admin-user'
import { FilterSelect, StatusPill, selectClass } from '@/app/components/Admin/shell/fields'
import { EmptyState, ExportButton, PageBody, PageHeader, Panel, StatCard } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { LEAVE_TYPES, MEMBER_TYPES, labelOf } from '@/lib/admin/people-shared'
import { canEdit } from '@/lib/auth/admin-shared'
import { cn } from '@/lib/utils'
import {
  api,
  Avatar,
  emptyLeaveForm,
  Field,
  formatDay,
  formatRange,
  inputClass,
  LeaveFormFields,
  leaveLabel,
  type LeaveFormValues,
  type LeaveRow,
} from './common'

type ListResponse = {
  data: LeaveRow[]
  counts: Record<string, number>
  upcoming: LeaveRow[]
  today: string
  members: Array<{ id: string; fullName: string; memberType: string }>
}

const TABS = [
  { value: 'pending', label: 'Awaiting approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
] as const

const TYPE_COLOURS: Record<string, string> = {
  annual: 'bg-navy-600',
  sick: 'bg-rose-500',
  retreat: 'bg-gold-400',
  compassionate: 'bg-violet-500',
  study: 'bg-sky-500',
  other: 'bg-slate-400',
}

const addDays = (day: string, count: number) => new Date(Date.parse(`${day}T00:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)

export function LeaveManager() {
  const me = useAdminUser()
  const editable = canEdit(me, 'leave')
  const [status, setStatus] = useState<string>('pending')
  const [type, setType] = useState('all')
  const [reviewing, setReviewing] = useState<{ row: LeaveRow; action: 'approved' | 'rejected' | 'cancelled' } | null>(null)
  const [recording, setRecording] = useState(false)

  const query = useQuery({
    queryKey: ['admin-leave', status, type],
    queryFn: () => api<ListResponse>(`/api/admin/leave?status=${status}&type=${type}`),
    placeholderData: keepPreviousData,
  })
  const counts = query.data?.counts ?? {}
  const today = query.data?.today ?? new Date().toISOString().slice(0, 10)
  const upcoming = query.data?.upcoming ?? []
  const awayToday = upcoming.filter((row) => row.startDate <= today && row.endDate >= today)
  const rows = query.data?.data ?? []

  return (
    <PageBody>
      <PageHeader
        eyebrow='Organisation'
        title='Leave requests'
        description='Approve time off, see who is away, and keep each person’s annual leave balance in view.'
        actions={
          <>
            <ExportButton dataset='leave' filters={{ status, type }} />
            {editable && (
              <Button onClick={() => setRecording(true)} className='gap-2'>
                <Plus className='h-4 w-4' /> Record leave
              </Button>
            )}
          </>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Awaiting approval' value={counts.pending ?? 0} icon={Hourglass} tone='gold' />
        <StatCard
          label='Away today'
          value={awayToday.length}
          icon={CalendarOff}
          tone='rose'
          hint={awayToday.length ? awayToday.map((row) => row.member.fullName).join(', ') : 'Everyone is in'}
        />
        <StatCard label='Leave in the next 2 weeks' value={new Set(upcoming.map((row) => row.memberId)).size} icon={CalendarClock} hint='people with approved leave' />
        <StatCard label='Approved in total' value={counts.approved ?? 0} icon={CalendarCheck2} tone='green' />
      </div>

      <AwayCalendar today={today} rows={upcoming} />

      <Panel bodyClassName='p-0'>
        <div className='flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between'>
          <div role='tablist' aria-label='Leave status' className='flex flex-wrap gap-1 rounded-lg bg-muted p-1'>
            {TABS.map((tab) => {
              const count = tab.value === 'all' ? Object.values(counts).reduce((sum, value) => sum + value, 0) : counts[tab.value] ?? 0
              return (
                <button
                  key={tab.value}
                  type='button'
                  role='tab'
                  aria-selected={status === tab.value}
                  onClick={() => setStatus(tab.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition',
                    status === tab.value ? 'bg-white text-navy-950 shadow-sm' : 'text-muted-foreground hover:text-navy-950',
                  )}
                >
                  {tab.label}
                  <span className='ml-1.5 text-xs tabular-nums text-muted-foreground'>{count}</span>
                </button>
              )
            })}
          </div>
          <div className='flex items-center gap-2'>
            {query.isFetching && <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />}
            <FilterSelect label='Type of leave' value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...LEAVE_TYPES]} />
          </div>
        </div>

        {query.isPending ? (
          <div className='flex justify-center py-16'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : query.isError ? (
          <EmptyState title='Could not load leave' description={(query.error as Error).message} />
        ) : !rows.length ? (
          <EmptyState
            icon={CalendarOff}
            title={status === 'pending' ? 'Nothing waiting for approval' : 'No leave here'}
            description={status === 'pending' ? 'New requests from the team appear here.' : 'Try another tab or type.'}
          />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[820px] text-sm'>
              <thead className='bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Member</th>
                  <th className='px-4 py-3 font-medium'>Leave</th>
                  <th className='px-4 py-3 font-medium'>Dates</th>
                  <th className='px-4 py-3 font-medium'>Status</th>
                  <th className='px-4 py-3 font-medium'>Reviewed</th>
                  {editable && <th className='px-4 py-3 text-right font-medium'>Actions</th>}
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {rows.map((row) => (
                  <tr key={row.id} className='align-top'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar name={row.member.fullName} />
                        <div>
                          <p className='font-medium text-navy-950'>{row.member.fullName}</p>
                          <p className='text-xs text-muted-foreground'>{row.member.position ?? labelOf(MEMBER_TYPES, row.member.memberType)}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex items-center gap-2 text-navy-950'>
                        <span aria-hidden='true' className={cn('h-2.5 w-2.5 rounded-full', TYPE_COLOURS[row.leaveType] ?? TYPE_COLOURS.other)} />
                        {leaveLabel(row.leaveType)}
                      </span>
                      {row.reason && <p className='mt-1 line-clamp-2 max-w-xs text-xs text-muted-foreground'>{row.reason}</p>}
                    </td>
                    <td className='px-4 py-3'>
                      <p className='text-navy-950'>{formatRange(row.startDate, row.endDate)}</p>
                      <p className='text-xs text-muted-foreground'>
                        {row.days} day{row.days === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className='px-4 py-3'>
                      <StatusPill status={row.status} label={row.status === 'rejected' ? 'Declined' : undefined} />
                    </td>
                    <td className='px-4 py-3 text-xs text-muted-foreground'>
                      {row.reviewedByName ? (
                        <>
                          <p className='text-navy-900'>{row.reviewedByName}</p>
                          {row.reviewedAt && <p>{formatDay(row.reviewedAt.slice(0, 10))}</p>}
                          {row.reviewNote && <p className='mt-1 max-w-[14rem] italic'>“{row.reviewNote}”</p>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    {editable && (
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-2'>
                          {row.status === 'pending' && (
                            <>
                              <Button size='sm' className='gap-1.5' onClick={() => setReviewing({ row, action: 'approved' })}>
                                <Check className='h-3.5 w-3.5' /> Approve
                              </Button>
                              <Button size='sm' variant='outline' className='gap-1.5' onClick={() => setReviewing({ row, action: 'rejected' })}>
                                <X className='h-3.5 w-3.5' /> Decline
                              </Button>
                            </>
                          )}
                          {row.status === 'approved' && row.endDate >= today && (
                            <Button size='sm' variant='outline' onClick={() => setReviewing({ row, action: 'cancelled' })}>
                              Cancel leave
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {reviewing && <ReviewDialog {...reviewing} onClose={() => setReviewing(null)} />}
      {recording && <RecordLeaveDialog members={query.data?.members ?? []} onClose={() => setRecording(false)} />}
    </PageBody>
  )
}

/** A two-week strip showing who is away on each day. */
function AwayCalendar({ today, rows }: { today: string; rows: LeaveRow[] }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(today, index)), [today])
  const people = useMemo(() => {
    const byMember = new Map<string, { name: string; rows: LeaveRow[] }>()
    for (const row of rows) {
      const entry = byMember.get(row.memberId) ?? { name: row.member.fullName, rows: [] }
      entry.rows.push(row)
      byMember.set(row.memberId, entry)
    }
    return Array.from(byMember, ([id, value]) => ({ id, ...value }))
  }, [rows])
  const weekday = (day: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))

  return (
    <Panel title='Who’s away' description='Approved leave for the next two weeks.' bodyClassName='p-0'>
      {!people.length ? (
        <p className='px-5 py-8 text-center text-sm text-muted-foreground'>No approved leave in the next two weeks.</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[720px] table-fixed text-xs'>
            <thead>
              <tr className='text-muted-foreground'>
                <th className='w-44 px-4 py-2 text-left font-medium'>Member</th>
                {days.map((day) => {
                  const date = new Date(`${day}T00:00:00Z`)
                  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
                  return (
                    <th key={day} className={cn('px-0.5 py-2 text-center font-medium', weekend && 'text-muted-foreground/60')}>
                      <span className='block'>{weekday(day)}</span>
                      <span className={cn('mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full tabular-nums', day === today && 'bg-navy-900 text-white')}>
                        {date.getUTCDate()}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id} className='border-t border-border'>
                  <td className='truncate px-4 py-2 font-medium text-navy-950'>{person.name}</td>
                  {days.map((day) => {
                    const hit = person.rows.find((row) => row.startDate <= day && row.endDate >= day)
                    const startsHere = hit && (hit.startDate === day || day === days[0])
                    const endsHere = hit && (hit.endDate === day || day === days[days.length - 1])
                    return (
                      <td key={day} className='px-0 py-2'>
                        {hit && (
                          <div
                            title={`${leaveLabel(hit.leaveType)}: ${formatRange(hit.startDate, hit.endDate)}`}
                            className={cn('h-5 opacity-90', TYPE_COLOURS[hit.leaveType] ?? TYPE_COLOURS.other, startsHere && 'ml-0.5 rounded-l-full', endsHere && 'mr-0.5 rounded-r-full')}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className='flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-xs text-muted-foreground'>
        {LEAVE_TYPES.map((type) => (
          <span key={type.value} className='inline-flex items-center gap-1.5'>
            <span aria-hidden='true' className={cn('h-2.5 w-2.5 rounded-full', TYPE_COLOURS[type.value])} />
            {type.label}
          </span>
        ))}
      </div>
    </Panel>
  )
}

const ACTION_COPY = {
  approved: { title: 'Approve leave', button: 'Approve', note: 'Note for the member (optional)' },
  rejected: { title: 'Decline leave', button: 'Decline', note: 'Reason (shown to the member)' },
  cancelled: { title: 'Cancel approved leave', button: 'Cancel leave', note: 'Reason (optional)' },
}

function ReviewDialog({ row, action, onClose }: { row: LeaveRow; action: 'approved' | 'rejected' | 'cancelled'; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const copy = ACTION_COPY[action]
  const save = useMutation({
    mutationFn: () => api(`/api/admin/leave/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: action, reviewNote: note }) }),
    onSuccess: () => {
      toast.success(action === 'approved' ? 'Leave approved' : action === 'rejected' ? 'Leave declined' : 'Leave cancelled')
      queryClient.invalidateQueries({ queryKey: ['admin-leave'] })
      onClose()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const used = useQuery({
    queryKey: ['admin-member', row.memberId],
    queryFn: () => api<{ data: { annualLeaveUsed: number; annualLeaveDays: number } }>(`/api/admin/members/${row.memberId}`),
    enabled: row.leaveType === 'annual' && action === 'approved',
    retry: false,
  })
  const balance = used.data?.data

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='w-[calc(100%-2rem)] max-w-md'>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {row.member.fullName} · {leaveLabel(row.leaveType)} · {formatRange(row.startDate, row.endDate)} ({row.days} day{row.days === 1 ? '' : 's'})
          </DialogDescription>
        </DialogHeader>
        {row.reason && <p className='rounded-lg bg-muted px-3 py-2 text-sm text-navy-900'>{row.reason}</p>}
        {balance && (
          <p className={cn('text-sm', balance.annualLeaveUsed + row.days > balance.annualLeaveDays ? 'text-rose-700' : 'text-muted-foreground')}>
            Annual leave used this year: {balance.annualLeaveUsed} of {balance.annualLeaveDays} days. After this: {balance.annualLeaveUsed + row.days}.
          </p>
        )}
        <Field label={copy.note}>
          <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} className={cn(inputClass, 'h-auto resize-none py-2')} />
        </Field>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Back
          </Button>
          <Button variant={action === 'approved' ? 'default' : 'destructive'} disabled={save.isPending} onClick={() => save.mutate()} className='gap-2'>
            {save.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
            {copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecordLeaveDialog({ members, onClose }: { members: ListResponse['members']; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [memberId, setMemberId] = useState('')
  const [form, setForm] = useState<LeaveFormValues>(emptyLeaveForm)
  const [approve, setApprove] = useState(true)
  const save = useMutation({
    mutationFn: () => api('/api/admin/leave', { method: 'POST', body: JSON.stringify({ ...form, memberId, approve }) }),
    onSuccess: () => {
      toast.success(approve ? 'Leave recorded and approved' : 'Leave request added')
      queryClient.invalidateQueries({ queryKey: ['admin-leave'] })
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      onClose()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto'>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            save.mutate()
          }}
          className='space-y-4'
        >
          <DialogHeader>
            <DialogTitle>Record leave</DialogTitle>
            <DialogDescription>Add leave on someone’s behalf, for example sick leave phoned in to the office.</DialogDescription>
          </DialogHeader>
          <Field label='Member'>
            <select required value={memberId} onChange={(event) => setMemberId(event.target.value)} className={cn(selectClass, 'w-full')}>
              <option value=''>Choose a member…</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName} ({labelOf(MEMBER_TYPES, member.memberType)})
                </option>
              ))}
            </select>
          </Field>
          {!members.length && <p className='text-sm text-amber-700'>Add people in the Members directory first.</p>}
          <LeaveFormFields value={form} onChange={setForm} />
          <label className='flex items-center gap-2 text-sm text-navy-900'>
            <Checkbox checked={approve} onCheckedChange={(checked) => setApprove(checked === true)} />
            Approve straight away
          </label>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={save.isPending || !memberId} className='gap-2'>
              {save.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              {approve ? 'Record approved leave' : 'Add request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
