'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, CheckCheck, ChevronLeft, ChevronRight, CircleDollarSign, Loader2, ScanLine, Ticket, UserCheck, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAdminUser } from '@dashboard/context/admin-user'
import { FilterSelect, SearchInput, StatusPill } from '@/app/components/Admin/shell/fields'
import { EmptyState, ExportButton, PageBody, PageHeader, Panel } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { relativeTime } from '@/lib/admin/safe'
import { canEdit } from '@/lib/auth/admin-shared'
import { cn } from '@/lib/utils'

type BookingRow = {
  id: string
  retreatId: string
  retreatTitle: string
  fullName: string
  email: string
  phone: string
  partySize: number
  status: string
  paymentStatus: string
  ticketCode: string | null
  attended: boolean
  checkedInAt: string | null
  createdAt: string
}

type BookingsResponse = {
  data: BookingRow[]
  page: number
  pageSize: number
  total: number
  summary: { all: number; status: Record<string, number>; payment: Record<string, number>; checkedIn: number }
  retreats: Array<{ id: string; title: string; dateRange: string; status: string }>
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'cancelled', label: 'Cancelled' },
]

const FILTER_KEYS = ['status', 'retreatId', 'payment', 'attended', 'q', 'page'] as const

export function BookingsManager() {
  const me = useAdminUser()
  const editable = canEdit(me, 'retreats')
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filters = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? (key === 'page' ? '1' : key === 'q' ? '' : 'all')])) as Record<(typeof FILTER_KEYS)[number], string>,
    [searchParams],
  )

  const setFilter = useCallback(
    (key: (typeof FILTER_KEYS)[number], value: string) => {
      const next = new URLSearchParams(searchParams.toString())
      if (!value || value === 'all' || (key === 'page' && value === '1')) next.delete(key)
      else next.set(key, value)
      if (key !== 'page') next.delete('page')
      setSelected(new Set())
      router.replace(`/admin/bookings${next.size ? `?${next}` : ''}`, { scroll: false })
    },
    [router, searchParams],
  )

  const query = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => value && value !== 'all' && params.set(key, value))
      const response = await fetch(`/api/admin/bookings?${params}`)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load bookings.')
      return payload as BookingsResponse
    },
    placeholderData: keepPreviousData,
  })

  const bulk = useMutation({
    mutationFn: async (action: string) => {
      const response = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selected) }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Update failed.')
      return payload.data as { updated: number; skipped: number }
    },
    onSuccess: ({ updated, skipped }) => {
      toast.success(`${updated} booking${updated === 1 ? '' : 's'} updated${skipped ? `, ${skipped} skipped` : ''}`)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const rows = query.data?.data ?? []
  const summary = query.data?.summary
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.pageSize)) : 1
  const page = Number(filters.page) || 1
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <PageBody>
      <PageHeader
        eyebrow='Retreats'
        title='Bookings'
        description='Every retreat booking in one place. Approve, record payments, check guests in and export.'
        actions={
          <>
            <ExportButton
              dataset='bookings'
              filters={{ retreatId: filters.retreatId, status: filters.status, payment: filters.payment, attended: filters.attended, q: filters.q }}
            />
            <Button asChild className='gap-2'>
              <Link href={`/admin/check-in${filters.retreatId !== 'all' ? `?retreat=${filters.retreatId}` : ''}`}>
                <ScanLine className='h-4 w-4' /> Open check-in
              </Link>
            </Button>
          </>
        }
      />

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {[
          { label: 'Total bookings', value: summary?.all ?? '—', hint: filters.retreatId !== 'all' ? 'For this retreat' : 'All retreats' },
          { label: 'Waiting for approval', value: summary?.status.pending ?? 0, hint: 'Need a decision' },
          { label: 'Paid', value: summary?.payment.paid ?? 0, hint: `${summary?.payment.pending ?? 0} still unpaid` },
          { label: 'Checked in', value: summary?.checkedIn ?? 0, hint: `of ${summary?.status.approved ?? 0} approved` },
        ].map((card) => (
          <div key={card.label} className='rounded-xl border border-border bg-white px-4 py-3 shadow-sm'>
            <p className='text-xs font-medium text-muted-foreground'>{card.label}</p>
            <p className='mt-1 text-2xl font-semibold tabular-nums text-navy-950'>{card.value}</p>
            <p className='text-xs text-muted-foreground'>{card.hint}</p>
          </div>
        ))}
      </div>

      <div className='space-y-3'>
        <div role='tablist' aria-label='Booking status' className='flex gap-1 overflow-x-auto rounded-lg border border-border bg-white p-1'>
          {STATUS_TABS.map((tab) => {
            const count = tab.value === 'all' ? summary?.all : summary?.status[tab.value]
            const active = filters.status === tab.value
            return (
              <button
                key={tab.value}
                role='tab'
                aria-selected={active}
                onClick={() => setFilter('status', tab.value)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition',
                  active ? 'bg-navy-900 text-white' : 'text-muted-foreground hover:bg-muted hover:text-navy-900',
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active ? 'bg-white/20' : 'bg-muted')}>{count ?? 0}</span>
              </button>
            )
          })}
        </div>
        <div className='flex flex-col gap-2 lg:flex-row'>
          <SearchInput value={filters.q} onChange={(value) => setFilter('q', value)} placeholder='Search name, email, phone or ticket' className='flex-1' />
          <FilterSelect
            label='Retreat'
            value={filters.retreatId}
            onChange={(value) => setFilter('retreatId', value)}
            options={[{ value: 'all', label: 'All retreats' }, ...(query.data?.retreats ?? []).map((retreat) => ({ value: retreat.id, label: retreat.title }))]}
            className='lg:w-64'
          />
          <FilterSelect
            label='Payment'
            value={filters.payment}
            onChange={(value) => setFilter('payment', value)}
            options={[
              { value: 'all', label: 'Any payment' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Unpaid' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
          <FilterSelect
            label='Attendance'
            value={filters.attended}
            onChange={(value) => setFilter('attended', value)}
            options={[
              { value: 'all', label: 'Any attendance' },
              { value: 'yes', label: 'Checked in' },
              { value: 'no', label: 'Not checked in' },
            ]}
          />
        </div>
      </div>

      {editable && selected.size > 0 && (
        <div className='sticky top-[4.5rem] z-10 flex flex-wrap items-center gap-2 rounded-xl bg-navy-950 px-4 py-3 text-white shadow-lg'>
          <span className='mr-2 text-sm font-medium'>{selected.size} selected</span>
          {[
            { action: 'approve', label: 'Approve', icon: CheckCheck },
            { action: 'mark_paid', label: 'Mark paid', icon: CircleDollarSign },
            { action: 'check_in', label: 'Check in', icon: UserCheck },
          ].map((item) => (
            <Button key={item.action} size='sm' variant='gold' disabled={bulk.isPending} onClick={() => bulk.mutate(item.action)} className='gap-1.5'>
              <item.icon className='h-4 w-4' /> {item.label}
            </Button>
          ))}
          <Button
            size='sm'
            variant='outline-light'
            disabled={bulk.isPending}
            onClick={() => window.confirm(`Cancel ${selected.size} booking${selected.size === 1 ? '' : 's'}? Guests are not emailed automatically.`) && bulk.mutate('cancel')}
            className='gap-1.5'
          >
            <Ban className='h-4 w-4' /> Cancel bookings
          </Button>
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
          <EmptyState title="Couldn't load bookings" description={(query.error as Error).message} action={<Button variant='outline' onClick={() => query.refetch()}>Try again</Button>} />
        ) : rows.length ? (
          <div className={cn('overflow-x-auto transition-opacity', query.isFetching && 'opacity-60')}>
            <table className='w-full min-w-[960px] text-sm'>
              <thead>
                <tr className='border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  {editable && (
                    <th className='w-10 px-4 py-3'>
                      <input
                        type='checkbox'
                        aria-label='Select all on this page'
                        checked={allSelected}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))}
                        className='h-4 w-4 accent-navy-900'
                      />
                    </th>
                  )}
                  <th className='px-4 py-3'>Guest</th>
                  <th className='px-4 py-3'>Retreat</th>
                  <th className='px-4 py-3 text-center'>Party</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Payment</th>
                  <th className='px-4 py-3'>Ticket</th>
                  <th className='px-4 py-3'>Arrived</th>
                  <th className='px-4 py-3'>Booked</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {rows.map((row) => (
                  <tr key={row.id} className={cn('transition hover:bg-muted/30', selected.has(row.id) && 'bg-gold-50/60')}>
                    {editable && (
                      <td className='px-4 py-3'>
                        <input type='checkbox' aria-label={`Select ${row.fullName}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} className='h-4 w-4 accent-navy-900' />
                      </td>
                    )}
                    <td className='px-4 py-3'>
                      <Link href={`/admin/retreats/${row.retreatId}/bookings/${row.id}`} className='font-medium text-navy-950 hover:underline'>
                        {row.fullName}
                      </Link>
                      <p className='text-xs text-muted-foreground'>
                        {row.email} · {row.phone}
                      </p>
                    </td>
                    <td className='max-w-[220px] truncate px-4 py-3 text-navy-800' title={row.retreatTitle}>
                      {row.retreatTitle}
                    </td>
                    <td className='px-4 py-3 text-center tabular-nums'>{row.partySize}</td>
                    <td className='px-4 py-3'>
                      <StatusPill status={row.status} />
                    </td>
                    <td className='px-4 py-3'>
                      <StatusPill status={row.paymentStatus} label={row.paymentStatus === 'pending' ? 'Unpaid' : undefined} />
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-navy-800'>{row.ticketCode ?? '—'}</td>
                    <td className='px-4 py-3 text-xs'>
                      {row.attended ? <span className='font-medium text-emerald-700'>{row.checkedInAt ? relativeTime(row.checkedInAt) : 'Yes'}</span> : <span className='text-muted-foreground'>—</span>}
                    </td>
                    <td className='px-4 py-3 text-xs text-muted-foreground'>{relativeTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Ticket} title='No bookings match these filters' description='Try a different status, retreat or search.' />
        )}
      </Panel>

      {pages > 1 && (
        <nav aria-label='Pagination' className='flex items-center justify-between text-sm'>
          <p className='text-muted-foreground'>
            Page {page} of {pages} · {query.data?.total.toLocaleString()} bookings
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
    </PageBody>
  )
}
