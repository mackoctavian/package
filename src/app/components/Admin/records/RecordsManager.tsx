'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { CalendarClock, ChevronLeft, ChevronRight, HandCoins, HeartHandshake, Inbox, Loader2, Mail, Phone, Reply, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAdminUser } from '@dashboard/context/admin-user'
import { FilterSelect, SearchInput, StatusPill } from '@/app/components/Admin/shell/fields'
import { EmptyState, ExportButton, PageBody, PageHeader, Panel, StatCard } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/app/components/ui/sheet'
import { formatTZS, relativeTime } from '@/lib/admin/safe'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { canEdit } from '@/lib/auth/admin-shared'
import { cn } from '@/lib/utils'

type Row = Record<string, unknown> & { id: string; status: string; createdAt: string }
type Kind = 'donations' | 'mass-intentions' | 'feedback'

type Giving = {
  paidTotal: number
  paidCount: number
  pendingTotal: number
  pendingCount: number
  thisMonth: number
  lastMonth: number
  thisYear: number
  byMethod: Array<{ method: string; total: number; count: number }>
  months: Array<{ month: string; total: number; count: number }>
}
type Upcoming = Array<{ id: string; fullName: string; intentionFor: string; intentionType: string; scheduledFor: string; celebrant: string | null }>
type ListResponse = {
  data: Row[]
  page: number
  pageSize: number
  total: number
  summary: { status: Record<string, number>; giving?: Giving; upcoming?: Upcoming }
}

const INTENTION_TYPES: Record<string, string> = {
  thanksgiving: 'Thanksgiving',
  healing: 'Healing',
  deceased: 'For the deceased',
  special: 'Special intention',
  family: 'Family blessing',
}

const s = (value: unknown) => (value === null || value === undefined ? '' : String(value))
const formatDate = (value: unknown, withTime = false) => {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime && { hour: '2-digit', minute: '2-digit' }), timeZone: 'Africa/Dar_es_Salaam' }).format(date)
}
const nameOf = (kind: Kind, row: Row) => (kind === 'feedback' ? `${s(row.firstName)} ${s(row.lastName)}`.trim() : s(row.fullName))

type KindConfig = {
  moduleId: AdminModuleId
  title: string
  eyebrow: string
  description: string
  icon: LucideIcon
  statuses: Array<{ value: string; label: string }>
  payments?: Array<{ value: string; label: string }>
  search: string
  noun: string
  columns: Array<{ header: string; className?: string; render: (row: Row) => React.ReactNode }>
  quickActions: Array<{ label: string; set: { status?: string; paymentStatus?: string } }>
}

const CONFIG: Record<Kind, KindConfig> = {
  donations: {
    moduleId: 'donations',
    title: 'Donations',
    eyebrow: 'Giving',
    description: 'Every gift received through the website, with payment status and the donor’s prayer intention.',
    icon: HandCoins,
    statuses: [
      { value: 'new', label: 'New' },
      { value: 'acknowledged', label: 'Thanked' },
      { value: 'archived', label: 'Archived' },
    ],
    payments: [
      { value: 'pending', label: 'Unpaid' },
      { value: 'paid', label: 'Paid' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' },
    ],
    search: 'Search donor, email, phone or intention',
    noun: 'gift',
    columns: [
      { header: 'Donor', render: (row) => <><p className='font-medium text-navy-950'>{s(row.fullName)}</p><p className='text-xs text-muted-foreground'>{s(row.email)}</p></> },
      { header: 'Amount', className: 'text-right', render: (row) => <span className='font-semibold tabular-nums text-navy-950'>{formatTZS(Number(row.amount) || 0)}</span> },
      { header: 'Method', render: (row) => <span className='text-navy-800'>{s(row.paymentMethod)}</span> },
      { header: 'Payment', render: (row) => <StatusPill status={s(row.paymentStatus)} label={row.paymentStatus === 'pending' ? 'Unpaid' : undefined} /> },
      { header: 'Status', render: (row) => <StatusPill status={row.status} label={row.status === 'acknowledged' ? 'Thanked' : undefined} /> },
    ],
    quickActions: [
      { label: 'Mark paid', set: { paymentStatus: 'paid' } },
      { label: 'Mark thanked', set: { status: 'acknowledged' } },
      { label: 'Archive', set: { status: 'archived' } },
    ],
  },
  'mass-intentions': {
    moduleId: 'mass-intentions',
    title: 'Mass intentions',
    eyebrow: 'Giving',
    description: 'Requests for Masses from the website. Schedule each one, note the celebrant and mark it celebrated.',
    icon: HeartHandshake,
    statuses: [
      { value: 'new', label: 'New' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'celebrated', label: 'Celebrated' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    search: 'Search name, email or intention',
    noun: 'intention',
    columns: [
      { header: 'Requested by', render: (row) => <><p className='font-medium text-navy-950'>{s(row.fullName)}</p><p className='text-xs text-muted-foreground'>{s(row.email)}</p></> },
      { header: 'Intention', render: (row) => <><p className='text-navy-900'>{INTENTION_TYPES[s(row.intentionType)] ?? s(row.intentionType)}</p><p className='max-w-[240px] truncate text-xs text-muted-foreground'>For {s(row.intentionFor)}</p></> },
      { header: 'Masses', className: 'text-center', render: (row) => <span className='tabular-nums'>{s(row.numberOfMasses)}</span> },
      { header: 'Preferred', render: (row) => <span className='text-xs text-navy-800'>{formatDate(row.preferredDate)}</span> },
      { header: 'Scheduled', render: (row) => <span className='text-xs text-navy-800'>{row.scheduledFor ? formatDate(row.scheduledFor) : '—'}</span> },
      { header: 'Status', render: (row) => <StatusPill status={row.status} /> },
    ],
    quickActions: [
      { label: 'Mark celebrated', set: { status: 'celebrated' } },
      { label: 'Cancel', set: { status: 'cancelled' } },
    ],
  },
  feedback: {
    moduleId: 'feedback',
    title: 'Messages',
    eyebrow: 'Inbox',
    description: 'Messages sent through the contact form. Reply by email, then mark them replied or archive them.',
    icon: Inbox,
    statuses: [
      { value: 'new', label: 'Unread' },
      { value: 'read', label: 'Read' },
      { value: 'replied', label: 'Replied' },
      { value: 'archived', label: 'Archived' },
    ],
    search: 'Search name, email or message',
    noun: 'message',
    columns: [
      { header: 'From', render: (row) => <><p className={cn('text-navy-950', row.status === 'new' ? 'font-semibold' : 'font-medium')}>{`${s(row.firstName)} ${s(row.lastName)}`}</p><p className='text-xs text-muted-foreground'>{s(row.email)}</p></> },
      { header: 'Message', render: (row) => <p className={cn('max-w-[460px] truncate', row.status === 'new' ? 'text-navy-950' : 'text-muted-foreground')}>{s(row.message)}</p> },
      { header: 'Status', render: (row) => <StatusPill status={row.status} label={row.status === 'new' ? 'Unread' : undefined} /> },
    ],
    quickActions: [
      { label: 'Mark read', set: { status: 'read' } },
      { label: 'Mark replied', set: { status: 'replied' } },
      { label: 'Archive', set: { status: 'archived' } },
    ],
  },
}

const api = async <T,>(url: string, init?: RequestInit) => {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Something went wrong.')
  return payload as T
}

function GivingOverview({ giving }: { giving: Giving }) {
  const max = Math.max(1, ...giving.months.map((month) => month.total))
  const change = giving.lastMonth ? Math.round(((giving.thisMonth - giving.lastMonth) / giving.lastMonth) * 100) : null
  return (
    <div className='grid gap-4 xl:grid-cols-3'>
      <div className='grid gap-4 sm:grid-cols-2 xl:col-span-1 xl:grid-cols-1'>
        <StatCard label='Received this month' value={formatTZS(giving.thisMonth)} hint={change === null ? 'No gifts last month' : `${change >= 0 ? '+' : ''}${change}% on last month`} icon={HandCoins} tone='gold' />
        <StatCard label='Received this year' value={formatTZS(giving.thisYear)} hint={`${giving.paidCount} paid gifts in total`} tone='green' />
        <StatCard label='Awaiting payment' value={formatTZS(giving.pendingTotal)} hint={`${giving.pendingCount} pledges not yet paid`} tone='rose' />
      </div>
      <Panel title='Last 12 months' description='Paid gifts by month' className='xl:col-span-2'>
        <div className='flex h-48 items-end gap-1.5' role='img' aria-label='Bar chart of paid gifts per month for the last 12 months'>
          {giving.months.map((month) => (
            <div key={month.month} className='group relative flex h-full flex-1 flex-col justify-end'>
              <div className='rounded-t-md bg-navy-800 transition-colors group-hover:bg-gold-500' style={{ height: `${Math.max(month.total ? 4 : 1, (month.total / max) * 100)}%` }} />
              <span className='pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-950 px-2 py-0.5 text-[11px] text-white group-hover:block'>
                {formatTZS(month.total)}
              </span>
            </div>
          ))}
        </div>
        <div className='mt-2 flex gap-1.5'>
          {giving.months.map((month) => (
            <span key={month.month} className='flex-1 text-center text-[10px] text-muted-foreground'>
              {new Date(`${month.month}-01T00:00:00`).toLocaleString('en-GB', { month: 'short' })}
            </span>
          ))}
        </div>
        {giving.byMethod.length > 0 && (
          <div className='mt-5 flex flex-wrap gap-2 border-t border-border pt-4'>
            {giving.byMethod.map((method) => (
              <span key={method.method} className='rounded-full bg-muted px-3 py-1 text-xs text-navy-800'>
                {method.method}: <strong>{formatTZS(method.total)}</strong> · {method.count}
              </span>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function DetailSheet({ kind, row, editable, onClose }: { kind: Kind; row: Row; editable: boolean; onClose: () => void }) {
  const config = CONFIG[kind]
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState({
    status: row.status,
    paymentStatus: s(row.paymentStatus),
    adminNotes: s(row.adminNotes),
    scheduledFor: row.scheduledFor ? s(row.scheduledFor).slice(0, 10) : '',
    celebrant: s(row.celebrant),
  })

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/admin/records/${kind}/${row.id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['records', kind] })
      onClose()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: () => api(`/api/admin/records/${kind}/${row.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Deleted')
      queryClient.invalidateQueries({ queryKey: ['records', kind] })
      onClose()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const name = nameOf(kind, row)
  const facts: Array<[string, React.ReactNode]> =
    kind === 'donations'
      ? [
          ['Amount', <strong key='a'>{formatTZS(Number(row.amount) || 0)}</strong>],
          ['Method', s(row.paymentMethod)],
          ['Prayer intention', s(row.prayerIntention) || '—'],
        ]
      : kind === 'mass-intentions'
        ? [
            ['Type', INTENTION_TYPES[s(row.intentionType)] ?? s(row.intentionType)],
            ['For', s(row.intentionFor)],
            ['Details', s(row.intentionDetails)],
            ['Number of Masses', s(row.numberOfMasses)],
            ['Preferred date', formatDate(row.preferredDate)],
            ['Offering', s(row.donationAmount) || '—'],
          ]
        : [['Message', <span key='m' className='whitespace-pre-wrap'>{s(row.message)}</span>]]
  const phone = s(kind === 'feedback' ? row.phoneNumber : row.phone)
  const field = 'mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted'
  const replySubject = kind === 'feedback' ? 'Re: your message to DMRC' : kind === 'donations' ? 'Thank you for your gift to DMRC' : 'Your Mass intention at DMRC'

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle className='pr-8 text-xl font-semibold text-navy-950'>{name}</SheetTitle>
          <SheetDescription>
            Received {formatDate(row.createdAt, true)} · {relativeTime(row.createdAt)}
          </SheetDescription>
        </SheetHeader>
        <div className='space-y-6 px-6 py-5'>
          <div className='flex flex-wrap gap-2'>
            <Button asChild size='sm' className='gap-1.5'>
              <a href={`mailto:${s(row.email)}?subject=${encodeURIComponent(replySubject)}`}>
                <Reply className='h-4 w-4' /> Reply by email
              </a>
            </Button>
            {phone && (
              <Button asChild size='sm' variant='outline' className='gap-1.5'>
                <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                  <Phone className='h-4 w-4' /> {phone}
                </a>
              </Button>
            )}
            <Button asChild size='sm' variant='outline' className='gap-1.5'>
              <a href={`mailto:${s(row.email)}`}>
                <Mail className='h-4 w-4' /> {s(row.email)}
              </a>
            </Button>
          </div>

          <dl className='divide-y divide-border rounded-xl border border-border'>
            {facts.map(([label, value]) => (
              <div key={label} className='grid gap-1 px-4 py-3 sm:grid-cols-3'>
                <dt className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>{label}</dt>
                <dd className='text-sm text-navy-950 sm:col-span-2'>{value}</dd>
              </div>
            ))}
          </dl>

          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='text-sm font-medium text-navy-900'>
              Status
              <select disabled={!editable} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className={field}>
                {config.statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {config.payments && (
              <label className='text-sm font-medium text-navy-900'>
                Payment
                <select disabled={!editable} value={draft.paymentStatus} onChange={(event) => setDraft({ ...draft, paymentStatus: event.target.value })} className={field}>
                  {config.payments.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {kind === 'mass-intentions' && (
              <>
                <label className='text-sm font-medium text-navy-900'>
                  Mass date
                  <input type='date' disabled={!editable} value={draft.scheduledFor} onChange={(event) => setDraft({ ...draft, scheduledFor: event.target.value, status: event.target.value && draft.status === 'new' ? 'scheduled' : draft.status })} className={field} />
                </label>
                <label className='text-sm font-medium text-navy-900'>
                  Celebrant
                  <input disabled={!editable} value={draft.celebrant} onChange={(event) => setDraft({ ...draft, celebrant: event.target.value })} placeholder='e.g. Fr. Joseph' className={field} />
                </label>
              </>
            )}
          </div>
          <label className='block text-sm font-medium text-navy-900'>
            Office notes
            <textarea disabled={!editable} rows={4} value={draft.adminNotes} onChange={(event) => setDraft({ ...draft, adminNotes: event.target.value })} placeholder='Only visible to the admin team' className={field} />
          </label>

          {editable && (
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5'>
              <Button
                variant='ghost'
                className='gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                disabled={remove.isPending}
                onClick={() => window.confirm(`Delete this ${config.noun} permanently? This cannot be undone.`) && remove.mutate()}
              >
                <Trash2 className='h-4 w-4' /> Delete
              </Button>
              <Button
                disabled={save.isPending}
                onClick={() =>
                  save.mutate({
                    status: draft.status,
                    ...(config.payments && { paymentStatus: draft.paymentStatus }),
                    adminNotes: draft.adminNotes,
                    ...(kind === 'mass-intentions' && { scheduledFor: draft.scheduledFor || null, celebrant: draft.celebrant }),
                  })
                }
              >
                {save.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Save changes
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function RecordsManager({ kind }: { kind: Kind }) {
  const config = CONFIG[kind]
  const me = useAdminUser()
  const editable = canEdit(me, config.moduleId)
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<Row | null>(null)

  const filters = useMemo(
    () => ({
      status: searchParams.get('status') ?? 'all',
      payment: searchParams.get('payment') ?? 'all',
      q: searchParams.get('q') ?? '',
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
      page: searchParams.get('page') ?? '1',
    }),
    [searchParams],
  )
  const setFilter = useCallback(
    (key: keyof typeof filters, value: string) => {
      const next = new URLSearchParams(searchParams.toString())
      if (!value || value === 'all' || (key === 'page' && value === '1')) next.delete(key)
      else next.set(key, value)
      if (key !== 'page') next.delete('page')
      setSelected(new Set())
      router.replace(`?${next}`, { scroll: false })
    },
    [router, searchParams],
  )

  const query = useQuery({
    queryKey: ['records', kind, filters],
    queryFn: () => {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value && value !== 'all'))
      return api<ListResponse>(`/api/admin/records/${kind}?${params}`)
    },
    placeholderData: keepPreviousData,
  })

  const bulk = useMutation({
    mutationFn: (set: { status?: string; paymentStatus?: string }) =>
      api<{ data: { updated: number } }>(`/api/admin/records/${kind}/bulk`, { method: 'POST', body: JSON.stringify({ ids: Array.from(selected), ...set }) }),
    onSuccess: ({ data }) => {
      toast.success(`${data.updated} updated`)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['records', kind] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const openRow = (row: Row) => {
    setOpen(row)
    // Opening an unread message marks it read.
    if (kind === 'feedback' && row.status === 'new' && editable) {
      api(`/api/admin/records/feedback/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'read' }) })
        .then(() => queryClient.invalidateQueries({ queryKey: ['records', kind] }))
        .catch(() => null)
    }
  }

  const rows = query.data?.data ?? []
  const statusCounts = query.data?.summary.status ?? {}
  const allCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.pageSize)) : 1
  const page = Number(filters.page) || 1
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))

  return (
    <PageBody>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={<ExportButton dataset={kind} filters={{ status: filters.status, payment: filters.payment, q: filters.q, from: filters.from, to: filters.to }} />}
      />

      {query.data?.summary.giving && <GivingOverview giving={query.data.summary.giving} />}

      {kind === 'mass-intentions' && query.data?.summary.upcoming && (
        <Panel title='Coming up this week' description='Scheduled Masses in the next seven days' bodyClassName='p-0'>
          {query.data.summary.upcoming.length ? (
            <ul className='divide-y divide-border'>
              {query.data.summary.upcoming.map((item) => (
                <li key={item.id} className='flex items-center gap-4 px-5 py-3'>
                  <span className='flex w-14 shrink-0 flex-col items-center rounded-lg bg-gold-100 py-1 text-gold-700'>
                    <span className='text-[10px] font-semibold uppercase'>{new Date(item.scheduledFor).toLocaleString('en-GB', { weekday: 'short' })}</span>
                    <span className='text-lg font-semibold leading-none'>{new Date(item.scheduledFor).getDate()}</span>
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-navy-950'>
                      {INTENTION_TYPES[item.intentionType] ?? item.intentionType} · for {item.intentionFor}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Requested by {item.fullName}
                      {item.celebrant ? ` · ${item.celebrant}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CalendarClock} title='Nothing scheduled this week' description='Open a new intention and pick a Mass date to schedule it.' />
          )}
        </Panel>
      )}

      <div className='space-y-3'>
        <div role='tablist' aria-label='Status' className='flex gap-1 overflow-x-auto rounded-lg border border-border bg-white p-1'>
          {[{ value: 'all', label: 'All' }, ...config.statuses].map((tab) => {
            const active = filters.status === tab.value
            const count = tab.value === 'all' ? allCount : (statusCounts[tab.value] ?? 0)
            return (
              <button
                key={tab.value}
                role='tab'
                aria-selected={active}
                onClick={() => setFilter('status', tab.value)}
                className={cn('flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition', active ? 'bg-navy-900 text-white' : 'text-muted-foreground hover:bg-muted hover:text-navy-900')}
              >
                {tab.label}
                <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active ? 'bg-white/20' : 'bg-muted')}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className='flex flex-col gap-2 lg:flex-row'>
          <SearchInput value={filters.q} onChange={(value) => setFilter('q', value)} placeholder={config.search} className='flex-1' />
          {config.payments && (
            <FilterSelect label='Payment' value={filters.payment} onChange={(value) => setFilter('payment', value)} options={[{ value: 'all', label: 'Any payment' }, ...config.payments]} />
          )}
          <label className='flex items-center gap-2 text-sm text-muted-foreground'>
            From
            <input type='date' value={filters.from} onChange={(event) => setFilter('from', event.target.value)} className='h-10 rounded-lg border border-input bg-white px-2 text-sm text-navy-950' />
          </label>
          <label className='flex items-center gap-2 text-sm text-muted-foreground'>
            To
            <input type='date' value={filters.to} onChange={(event) => setFilter('to', event.target.value)} className='h-10 rounded-lg border border-input bg-white px-2 text-sm text-navy-950' />
          </label>
        </div>
      </div>

      {editable && selected.size > 0 && (
        <div className='sticky top-[4.5rem] z-10 flex flex-wrap items-center gap-2 rounded-xl bg-navy-950 px-4 py-3 text-white shadow-lg'>
          <span className='mr-2 text-sm font-medium'>{selected.size} selected</span>
          {config.quickActions.map((action) => (
            <Button key={action.label} size='sm' variant='gold' disabled={bulk.isPending} onClick={() => bulk.mutate(action.set)}>
              {action.label}
            </Button>
          ))}
          {bulk.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
          <button onClick={() => setSelected(new Set())} className='ml-auto rounded-md p-1.5 hover:bg-white/10' aria-label='Clear selection'>
            <X className='h-4 w-4' />
          </button>
        </div>
      )}

      <Panel bodyClassName='p-0'>
        {query.isLoading ? (
          <div className='flex justify-center py-16 text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin' />
          </div>
        ) : query.isError ? (
          <EmptyState title="Couldn't load this list" description={(query.error as Error).message} action={<Button variant='outline' onClick={() => query.refetch()}>Try again</Button>} />
        ) : rows.length ? (
          <div className={cn('overflow-x-auto transition-opacity', query.isFetching && 'opacity-60')}>
            <table className='w-full min-w-[820px] text-sm'>
              <thead>
                <tr className='border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  {editable && (
                    <th className='w-10 px-4 py-3'>
                      <input type='checkbox' aria-label='Select all on this page' checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))} className='h-4 w-4 accent-navy-900' />
                    </th>
                  )}
                  {config.columns.map((column) => (
                    <th key={column.header} className={cn('px-4 py-3', column.className)}>
                      {column.header}
                    </th>
                  ))}
                  <th className='px-4 py-3'>Received</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openRow(row)}
                    className={cn('cursor-pointer transition hover:bg-muted/40', selected.has(row.id) && 'bg-gold-50/60', kind === 'feedback' && row.status === 'new' && 'bg-navy-50/40')}
                  >
                    {editable && (
                      <td className='px-4 py-3' onClick={(event) => event.stopPropagation()}>
                        <input
                          type='checkbox'
                          aria-label={`Select ${nameOf(kind, row)}`}
                          checked={selected.has(row.id)}
                          onChange={() =>
                            setSelected((current) => {
                              const next = new Set(current)
                              if (next.has(row.id)) next.delete(row.id)
                              else next.add(row.id)
                              return next
                            })
                          }
                          className='h-4 w-4 accent-navy-900'
                        />
                      </td>
                    )}
                    {config.columns.map((column) => (
                      <td key={column.header} className={cn('px-4 py-3', column.className)}>
                        {column.render(row)}
                      </td>
                    ))}
                    <td className='whitespace-nowrap px-4 py-3 text-xs text-muted-foreground'>
                      <button type='button' className='text-left hover:underline' onClick={() => openRow(row)}>
                        {relativeTime(row.createdAt)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={config.icon} title={`No ${config.title.toLowerCase()} match these filters`} description='Try another status, date range or search.' />
        )}
      </Panel>

      {pages > 1 && (
        <nav aria-label='Pagination' className='flex items-center justify-between text-sm'>
          <p className='text-muted-foreground'>
            Page {page} of {pages} · {query.data?.total.toLocaleString()} {config.noun}s
          </p>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))} className='gap-1'>
              <ChevronLeft className='h-4 w-4' /> Previous
            </Button>
            <Button variant='outline' size='sm' disabled={page >= pages} onClick={() => setFilter('page', String(page + 1))} className='gap-1'>
              Next <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </nav>
      )}

      {open && <DetailSheet key={open.id} kind={kind} row={open} editable={editable} onClose={() => setOpen(null)} />}
    </PageBody>
  )
}
