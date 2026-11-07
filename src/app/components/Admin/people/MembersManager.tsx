'use client'

import { useState } from 'react'
import Link from 'next/link'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarOff, Contact, KeyRound, Loader2, Mail, Pencil, Phone, Plus, UserCheck, Users } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAdminUser } from '@dashboard/context/admin-user'
import { FilterSelect, SearchInput, StatusPill, selectClass } from '@/app/components/Admin/shell/fields'
import { EmptyState, ExportButton, PageBody, PageHeader, Panel, StatCard } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/app/components/ui/sheet'
import { MEMBER_STATUSES, MEMBER_TYPES, labelOf } from '@/lib/admin/people-shared'
import { canEdit, userHasModuleAccess } from '@/lib/auth/admin-shared'
import { cn } from '@/lib/utils'
import { api, Avatar, ConfirmButton, Field, formatDay, formatRange, inputClass, LeaveBalance, leaveLabel, type LeaveRow } from './common'

type Member = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  memberType: string
  position: string | null
  department: string | null
  status: string
  startDate: string | null
  photoUrl: string | null
  annualLeaveDays: number
  notes: string | null
  adminUserId: string | null
  adminUser: { id: string; name: string; email: string } | null
  annualLeaveUsed: number
  awayUntil: string | null
}
type AdminOption = { id: string; name: string; email: string; linkedMemberId: string | null }
type ListResponse = { data: Member[]; counts: Record<string, number>; awayToday: number; admins: AdminOption[] }

const TYPE_TONES: Record<string, string> = {
  priest: 'bg-navy-900 text-white',
  religious: 'bg-gold-100 text-gold-700',
  staff: 'bg-sky-50 text-sky-700',
  volunteer: 'bg-emerald-50 text-emerald-700',
  other: 'bg-muted text-muted-foreground',
}

function TypeBadge({ type }: { type: string }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', TYPE_TONES[type] ?? TYPE_TONES.other)}>{labelOf(MEMBER_TYPES, type)}</span>
}

export function MembersManager() {
  const me = useAdminUser()
  const editable = canEdit(me, 'members')
  const seesLeave = userHasModuleAccess(me, 'leave')
  const [filters, setFilters] = useState({ q: '', type: 'all', status: 'active' })
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Member | 'new' | null>(null)

  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value && value !== 'all'))
  const query = useQuery({
    queryKey: ['admin-members', filters],
    queryFn: () => api<ListResponse>(`/api/admin/members?${params}`),
    placeholderData: keepPreviousData,
  })
  const members = query.data?.data ?? []
  const counts = query.data?.counts ?? {}
  const totalActive = Object.values(counts).reduce((sum, value) => sum + value, 0)
  const open = members.find((member) => member.id === openId) ?? null

  return (
    <PageBody>
      <PageHeader
        eyebrow='Organisation'
        title='Members directory'
        description='Priests, sisters and brothers, staff and volunteers who serve at the centre, with their role, contact details and leave.'
        actions={
          <>
            <ExportButton dataset='members' filters={{ q: filters.q, type: filters.type, status: filters.status }} />
            {editable && (
              <Button onClick={() => setEditing('new')} className='gap-2'>
                <Plus className='h-4 w-4' /> Add member
              </Button>
            )}
          </>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Active members' value={totalActive} icon={Users} />
        <StatCard label='Priests and religious' value={(counts.priest ?? 0) + (counts.religious ?? 0)} icon={Contact} tone='gold' />
        <StatCard label='Staff and volunteers' value={(counts.staff ?? 0) + (counts.volunteer ?? 0)} icon={UserCheck} tone='green' />
        <StatCard
          label='Away today'
          value={query.data?.awayToday ?? 0}
          icon={CalendarOff}
          tone='rose'
          hint={seesLeave ? <Link href='/admin/leave' className='underline-offset-2 hover:underline'>See leave calendar</Link> : undefined}
        />
      </div>

      <Panel bodyClassName='p-0'>
        <div className='flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center'>
          <SearchInput value={filters.q} onChange={(q) => setFilters((prev) => ({ ...prev, q }))} placeholder='Search name, email, position…' className='sm:max-w-xs sm:flex-1' />
          <FilterSelect
            label='Role'
            value={filters.type}
            onChange={(type) => setFilters((prev) => ({ ...prev, type }))}
            options={[{ value: 'all', label: 'All roles' }, ...MEMBER_TYPES]}
          />
          <FilterSelect
            label='Status'
            value={filters.status}
            onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
            options={[{ value: 'all', label: 'Active and inactive' }, ...MEMBER_STATUSES]}
          />
          {query.isFetching && <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />}
        </div>

        {query.isPending ? (
          <div className='flex justify-center py-16'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : query.isError ? (
          <EmptyState title='Could not load members' description={(query.error as Error).message} />
        ) : !members.length ? (
          <EmptyState
            icon={Contact}
            title={filters.q || filters.type !== 'all' ? 'No members match these filters' : 'No members yet'}
            description='Add the priests, religious, staff and volunteers who serve here to track roles and leave in one place.'
            action={editable && <Button onClick={() => setEditing('new')}>Add the first member</Button>}
          />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] text-sm'>
              <thead className='bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Name</th>
                  <th className='px-4 py-3 font-medium'>Role</th>
                  <th className='px-4 py-3 font-medium'>Position</th>
                  <th className='px-4 py-3 font-medium'>Status</th>
                  <th className='px-4 py-3 font-medium'>Annual leave</th>
                  <th className='px-4 py-3 font-medium'>Admin login</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {members.map((member) => (
                  <tr key={member.id} onClick={() => setOpenId(member.id)} className='cursor-pointer transition hover:bg-muted/40'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar name={member.fullName} photoUrl={member.photoUrl} />
                        <div className='min-w-0'>
                          <button type='button' className='font-medium text-navy-950 hover:underline' onClick={() => setOpenId(member.id)}>
                            {member.fullName}
                          </button>
                          <p className='truncate text-xs text-muted-foreground'>{member.email ?? member.phone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <TypeBadge type={member.memberType} />
                    </td>
                    <td className='px-4 py-3'>
                      <p className='text-navy-950'>{member.position ?? '—'}</p>
                      {member.department && <p className='text-xs text-muted-foreground'>{member.department}</p>}
                    </td>
                    <td className='px-4 py-3'>
                      {member.awayUntil ? (
                        <StatusPill status='pending' label={`On leave to ${formatDay(member.awayUntil, false)}`} />
                      ) : member.status === 'active' ? (
                        <StatusPill status='approved' label='Active' />
                      ) : (
                        <StatusPill status='inactive' label='Inactive' />
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <LeaveBalance used={member.annualLeaveUsed} allowance={member.annualLeaveDays} compact />
                    </td>
                    <td className='px-4 py-3 text-xs text-muted-foreground'>
                      {member.adminUser ? (
                        <span className='inline-flex items-center gap-1 text-navy-900'>
                          <KeyRound className='h-3.5 w-3.5 text-gold-600' /> {member.adminUser.email}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && (
        <MemberSheet
          key={open.id}
          member={open}
          editable={editable}
          seesLeave={seesLeave}
          onEdit={() => setEditing(open)}
          onClose={() => setOpenId(null)}
        />
      )}
      {editing && (
        <MemberDialog
          member={editing === 'new' ? null : editing}
          admins={query.data?.admins ?? []}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setEditing(null)
            if (id) setOpenId(id)
          }}
        />
      )}
    </PageBody>
  )
}

function MemberSheet({
  member,
  editable,
  seesLeave,
  onEdit,
  onClose,
}: {
  member: Member
  editable: boolean
  seesLeave: boolean
  onEdit: () => void
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const detail = useQuery({
    queryKey: ['admin-member', member.id],
    queryFn: () => api<{ data: Member & { leave: LeaveRow[] } }>(`/api/admin/members/${member.id}`),
  })
  const remove = useMutation({
    mutationFn: () => api(`/api/admin/members/${member.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(`${member.fullName} removed`)
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      onClose()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const leave = detail.data?.data.leave ?? []

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <div className='flex items-center gap-4 pr-8'>
            <Avatar name={member.fullName} photoUrl={member.photoUrl} className='h-14 w-14 text-base' />
            <div className='min-w-0'>
              <SheetTitle className='text-xl font-semibold text-navy-950'>{member.fullName}</SheetTitle>
              <SheetDescription className='mt-1 flex flex-wrap items-center gap-2'>
                <TypeBadge type={member.memberType} />
                {member.position && <span>{member.position}</span>}
                {member.status !== 'active' && <StatusPill status='inactive' label='Inactive' />}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='space-y-6 px-6 py-5'>
          {editable && (
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' onClick={onEdit} className='gap-2'>
                <Pencil className='h-3.5 w-3.5' /> Edit details
              </Button>
              <ConfirmButton label='Remove' confirmLabel='Remove member and leave history' disabled={remove.isPending} onConfirm={() => remove.mutate()} />
            </div>
          )}

          <dl className='grid gap-4 rounded-xl border border-border p-4 text-sm sm:grid-cols-2'>
            <Detail label='Email' value={member.email && <a href={`mailto:${member.email}`} className='inline-flex items-center gap-1.5 hover:underline'><Mail className='h-3.5 w-3.5' />{member.email}</a>} />
            <Detail label='Phone' value={member.phone && <a href={`tel:${member.phone}`} className='inline-flex items-center gap-1.5 hover:underline'><Phone className='h-3.5 w-3.5' />{member.phone}</a>} />
            <Detail label='Department' value={member.department} />
            <Detail label='Serving since' value={member.startDate && formatDay(member.startDate)} />
            <Detail label='Admin login' value={member.adminUser && `${member.adminUser.name} (${member.adminUser.email})`} />
            <Detail label='Annual leave allowance' value={`${member.annualLeaveDays} days a year`} />
            {member.notes && <Detail label='Notes' value={<span className='whitespace-pre-line'>{member.notes}</span>} className='sm:col-span-2' />}
          </dl>

          <div>
            <h3 className='text-sm font-semibold text-navy-950'>Annual leave this year</h3>
            <div className='mt-2 rounded-xl border border-border p-4'>
              <LeaveBalance used={member.annualLeaveUsed} allowance={member.annualLeaveDays} />
              {member.awayUntil && <p className='mt-3 text-sm text-amber-700'>On leave today, back after {formatDay(member.awayUntil)}.</p>}
            </div>
          </div>

          <div>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold text-navy-950'>Leave history</h3>
              {seesLeave && (
                <Link href='/admin/leave' className='text-xs font-medium text-navy-700 hover:underline'>
                  Manage leave
                </Link>
              )}
            </div>
            {detail.isPending ? (
              <Loader2 className='mt-4 h-5 w-5 animate-spin text-muted-foreground' />
            ) : !leave.length ? (
              <p className='mt-2 text-sm text-muted-foreground'>No leave recorded.</p>
            ) : (
              <ul className='mt-2 divide-y divide-border rounded-xl border border-border'>
                {leave.map((row) => (
                  <li key={row.id} className='flex items-center justify-between gap-3 px-4 py-3 text-sm'>
                    <div>
                      <p className='font-medium text-navy-950'>{leaveLabel(row.leaveType)}</p>
                      <p className='text-xs text-muted-foreground'>
                        {formatRange(row.startDate, row.endDate)} · {row.days} day{row.days === 1 ? '' : 's'}
                      </p>
                    </div>
                    <StatusPill status={row.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Detail({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>{label}</dt>
      <dd className='mt-0.5 text-navy-950'>{value || '—'}</dd>
    </div>
  )
}

function MemberDialog({
  member,
  admins,
  onClose,
  onSaved,
}: {
  member: Member | null
  admins: AdminOption[]
  onClose: () => void
  onSaved: (id: string | null) => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    fullName: member?.fullName ?? '',
    email: member?.email ?? '',
    phone: member?.phone ?? '',
    memberType: member?.memberType ?? 'staff',
    position: member?.position ?? '',
    department: member?.department ?? '',
    status: member?.status ?? 'active',
    startDate: member?.startDate ?? '',
    photoUrl: member?.photoUrl ?? '',
    annualLeaveDays: String(member?.annualLeaveDays ?? 21),
    notes: member?.notes ?? '',
    adminUserId: member?.adminUserId ?? '',
  })
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const save = useMutation({
    mutationFn: () =>
      api<{ data: { id: string } }>(member ? `/api/admin/members/${member.id}` : '/api/admin/members', {
        method: member ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...form, annualLeaveDays: Number(form.annualLeaveDays) }),
      }),
    onSuccess: (result) => {
      toast.success(member ? 'Member updated' : `${form.fullName} added`)
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-member'] })
      onSaved(member ? null : result.data.id)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const availableAdmins = admins.filter((admin) => !admin.linkedMemberId || admin.linkedMemberId === member?.id)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto'>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            save.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{member ? `Edit ${member.fullName}` : 'Add a member'}</DialogTitle>
            <DialogDescription>Contact details, role and yearly leave allowance.</DialogDescription>
          </DialogHeader>
          <div className='mt-5 grid gap-4 sm:grid-cols-2'>
            <Field label='Full name' className='sm:col-span-2'>
              <input required autoFocus value={form.fullName} onChange={set('fullName')} className={inputClass} placeholder='e.g. Fr. John Mushi' />
            </Field>
            <Field label='Role'>
              <select value={form.memberType} onChange={set('memberType')} className={cn(selectClass, 'w-full')}>
                {MEMBER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label='Status'>
              <select value={form.status} onChange={set('status')} className={cn(selectClass, 'w-full')}>
                {MEMBER_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label='Position'>
              <input value={form.position} onChange={set('position')} className={inputClass} placeholder='e.g. Retreat director' />
            </Field>
            <Field label='Department'>
              <input value={form.department} onChange={set('department')} className={inputClass} placeholder='e.g. Hospitality' />
            </Field>
            <Field label='Email'>
              <input type='email' value={form.email} onChange={set('email')} className={inputClass} />
            </Field>
            <Field label='Phone'>
              <input type='tel' value={form.phone} onChange={set('phone')} className={inputClass} placeholder='+255 …' />
            </Field>
            <Field label='Serving since'>
              <input type='date' value={form.startDate} onChange={set('startDate')} className={inputClass} />
            </Field>
            <Field label='Annual leave (days a year)'>
              <input type='number' min={0} max={365} value={form.annualLeaveDays} onChange={set('annualLeaveDays')} className={inputClass} />
            </Field>
            <Field label='Photo URL (optional)' className='sm:col-span-2'>
              <input type='url' value={form.photoUrl} onChange={set('photoUrl')} className={inputClass} placeholder='https://…' />
            </Field>
            <Field
              label='Admin login'
              className='sm:col-span-2'
              hint='Linking a login lets this person request their own leave from My account.'
            >
              <select value={form.adminUserId} onChange={set('adminUserId')} className={cn(selectClass, 'w-full')}>
                <option value=''>Not linked</option>
                {availableAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label='Notes' className='sm:col-span-2'>
              <textarea rows={3} value={form.notes} onChange={set('notes')} className={cn(inputClass, 'h-auto resize-none py-2')} />
            </Field>
          </div>
          <DialogFooter className='mt-6'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={save.isPending} className='gap-2'>
              {save.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              {member ? 'Save changes' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

