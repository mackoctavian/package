'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, ScanLine, Search, Users2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAdminUser } from '@dashboard/context/admin-user'
import { FilterSelect } from '@/app/components/Admin/shell/fields'
import { EmptyState, ExportButton, PageBody, PageHeader, Panel } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { relativeTime } from '@/lib/admin/safe'
import { canEdit, userHasModuleAccess } from '@/lib/auth/admin-shared'
import { cn } from '@/lib/utils'
import { QrScanner } from './QrScanner'

type LiveData = {
  bookings: number
  bookingsArrived: number
  guests: number
  guestsArrived: number
  pendingApproval: number
  recent: Array<{ id: string; fullName: string; ticketCode: string | null; checkedInAt: string; partySize: number }>
  expected: Array<{ id: string; fullName: string; ticketCode: string | null; phone: string; partySize: number }>
  updatedAt: string
}
type LiveResponse = { data: LiveData | null; retreats: Array<{ id: string; title: string; dateRange: string; status: string }> }

type ScanResult = {
  tone: 'success' | 'warning' | 'error'
  title: string
  detail?: string
  name?: string
  partySize?: number
  bookingId?: string
}

const beep = (ok: boolean) => {
  try {
    const AudioContext = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = ok ? 880 : 220
    gain.gain.value = 0.08
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + (ok ? 0.12 : 0.35))
    navigator.vibrate?.(ok ? 60 : [80, 60, 80])
  } catch {
    // Sound is a nicety; ignore failures.
  }
}

export function CheckInDesk() {
  const me = useAdminUser()
  const editable = canEdit(me, 'check-in') || canEdit(me, 'retreats')
  const router = useRouter()
  const searchParams = useSearchParams()
  const retreatId = searchParams.get('retreat') ?? ''
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [search, setSearch] = useState('')

  const live = useQuery({
    queryKey: ['check-in', retreatId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/check-in${retreatId ? `?retreatId=${retreatId}` : ''}`)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load check-in data.')
      return payload as LiveResponse
    },
    refetchInterval: retreatId ? 4000 : false,
    refetchIntervalInBackground: false,
  })

  const scan = useMutation({
    mutationFn: async (input: { ticketCode?: string; bookingId?: string; undo?: boolean }) => {
      const response = await fetch('/api/retreats/bookings/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, retreatId: input.undo ? undefined : retreatId || undefined }),
      })
      return { ok: response.ok, payload: await response.json().catch(() => ({})), input }
    },
    onSuccess: ({ ok, payload, input }) => {
      queryClient.invalidateQueries({ queryKey: ['check-in', retreatId] })
      const booking = payload.booking as { id: string; fullName: string; partySize: number } | undefined
      if (input.undo) {
        toast.success(`Check-in undone for ${booking?.fullName ?? 'guest'}`)
        return
      }
      if (ok && payload.alreadyCheckedIn) {
        beep(false)
        setResult({ tone: 'warning', title: 'Already checked in', name: booking?.fullName, partySize: booking?.partySize, detail: payload.checkedInAt ? `Arrived ${relativeTime(payload.checkedInAt)}` : undefined })
      } else if (ok) {
        beep(true)
        setResult({ tone: 'success', title: 'Welcome!', name: booking?.fullName, partySize: booking?.partySize, bookingId: booking?.id, detail: 'Checked in' })
      } else {
        beep(false)
        setResult({ tone: 'error', title: payload.error ?? 'Ticket not accepted', name: booking?.fullName })
      }
    },
    onError: () => {
      beep(false)
      setResult({ tone: 'error', title: 'Network problem. Check the connection and scan again.' })
    },
  })

  const onScan = useCallback((value: string) => scan.mutate({ ticketCode: value }), [scan])

  const selectRetreat = (value: string) => {
    setResult(null)
    router.replace(value && value !== 'all' ? `/admin/check-in?retreat=${value}` : '/admin/check-in', { scroll: false })
  }

  const data = live.data?.data
  const percent = data && data.guests ? Math.round((data.guestsArrived / data.guests) * 100) : 0
  const expected = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (data?.expected ?? []).filter((guest) => !term || `${guest.fullName} ${guest.ticketCode ?? ''} ${guest.phone}`.toLowerCase().includes(term))
  }, [data, search])

  const retreatOptions = [{ value: 'all', label: 'Choose a retreat…' }, ...(live.data?.retreats ?? []).map((retreat) => ({ value: retreat.id, label: `${retreat.title} · ${retreat.dateRange}` }))]

  return (
    <PageBody>
      <PageHeader
        eyebrow='Retreats'
        title='Check-in desk'
        description='Scan tickets at the door. Numbers update live across every device at the desk.'
        actions={retreatId && userHasModuleAccess(me, 'retreats') ? <ExportButton dataset='bookings' label='Export attendance' filters={{ retreatId, status: 'approved' }} /> : undefined}
      />

      <FilterSelect label='Retreat' value={retreatId || 'all'} onChange={selectRetreat} options={retreatOptions} className='w-full sm:max-w-md' />

      {!retreatId ? (
        <Panel>
          <EmptyState icon={ScanLine} title='Choose a retreat to start' description='Pick the retreat that is starting so tickets for other retreats are flagged.' />
        </Panel>
      ) : (
        <div className='grid gap-6 xl:grid-cols-5'>
          <div className='space-y-4 xl:col-span-3'>
            {editable ? (
              <Panel title='Scan a ticket'>
                <div className='grid gap-5 md:grid-cols-2'>
                  <QrScanner onScan={onScan} paused={scan.isPending} />
                  <div className='flex flex-col gap-4'>
                    <div
                      role='status'
                      aria-live='assertive'
                      className={cn(
                        'flex min-h-40 flex-1 flex-col items-center justify-center rounded-xl border-2 p-5 text-center transition-colors',
                        !result && 'border-dashed border-border text-muted-foreground',
                        result?.tone === 'success' && 'border-emerald-300 bg-emerald-50',
                        result?.tone === 'warning' && 'border-amber-300 bg-amber-50',
                        result?.tone === 'error' && 'border-rose-300 bg-rose-50',
                      )}
                    >
                      {scan.isPending ? (
                        <Loader2 className='h-8 w-8 animate-spin text-navy-700' />
                      ) : result ? (
                        <>
                          {result.tone === 'success' && <CheckCircle2 className='h-10 w-10 text-emerald-600' />}
                          {result.tone === 'warning' && <AlertTriangle className='h-10 w-10 text-amber-600' />}
                          {result.tone === 'error' && <XCircle className='h-10 w-10 text-rose-600' />}
                          <p className='mt-2 text-lg font-semibold text-navy-950'>{result.title}</p>
                          {result.name && <p className='text-2xl font-semibold text-navy-950'>{result.name}</p>}
                          {result.partySize && result.partySize > 1 && (
                            <p className='mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-sm font-medium text-navy-800'>
                              <Users2 className='h-4 w-4' /> Party of {result.partySize}
                            </p>
                          )}
                          {result.detail && <p className='mt-1 text-sm text-muted-foreground'>{result.detail}</p>}
                          {result.bookingId && (
                            <button onClick={() => scan.mutate({ bookingId: result.bookingId, undo: true })} className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy-700 underline-offset-2 hover:underline'>
                              <RotateCcw className='h-3.5 w-3.5' /> Undo
                            </button>
                          )}
                        </>
                      ) : (
                        <p className='text-sm'>The result of each scan appears here.</p>
                      )}
                    </div>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (code.trim()) scan.mutate({ ticketCode: code.trim() })
                        setCode('')
                      }}
                      className='flex gap-2'
                    >
                      <input
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        placeholder='Ticket code'
                        aria-label='Ticket code'
                        autoCapitalize='characters'
                        className='h-10 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                      />
                      <Button type='submit' disabled={!code.trim() || scan.isPending}>
                        Check in
                      </Button>
                    </form>
                  </div>
                </div>
              </Panel>
            ) : (
              <p className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>You have view-only access, so you can watch arrivals but not check guests in.</p>
            )}

            <Panel title='Still expected' description={`${expected.length} booking${expected.length === 1 ? '' : 's'} not yet arrived`} bodyClassName='p-0'>
              <div className='border-b border-border p-3'>
                <div className='relative'>
                  <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder='Find a guest without a ticket: name, phone or code'
                    aria-label='Find a guest'
                    className='h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                  />
                </div>
              </div>
              {expected.length ? (
                <ul className='max-h-[420px] divide-y divide-border overflow-y-auto'>
                  {expected.map((guest) => (
                    <li key={guest.id} className='flex items-center gap-3 px-4 py-2.5'>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-navy-950'>
                          {guest.fullName}
                          {guest.partySize > 1 && <span className='ml-2 text-xs font-normal text-muted-foreground'>+{guest.partySize - 1}</span>}
                        </p>
                        <p className='truncate font-mono text-xs text-muted-foreground'>
                          {guest.ticketCode ?? 'No ticket'} · {guest.phone}
                        </p>
                      </div>
                      {editable && (
                        <Button size='sm' variant='outline' disabled={scan.isPending} onClick={() => scan.mutate({ bookingId: guest.id })}>
                          Check in
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={CheckCircle2} title={search ? 'No guest matches that search' : 'Everyone has arrived'} />
              )}
            </Panel>
          </div>

          <div className='space-y-4 xl:col-span-2'>
            <Panel
              title='Live attendance'
              actions={
                <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <span className='h-2 w-2 animate-pulse rounded-full bg-emerald-500' /> Live
                </span>
              }
            >
              {data ? (
                <>
                  <div className='flex items-end justify-between'>
                    <p className='text-4xl font-semibold tabular-nums text-navy-950'>
                      {data.guestsArrived}
                      <span className='text-xl text-muted-foreground'> / {data.guests}</span>
                    </p>
                    <p className='text-sm font-medium text-navy-800'>{percent}%</p>
                  </div>
                  <p className='text-sm text-muted-foreground'>guests arrived</p>
                  <div className='mt-3 h-3 overflow-hidden rounded-full bg-muted'>
                    <div className='h-full rounded-full bg-emerald-500 transition-all duration-500' style={{ width: `${percent}%` }} />
                  </div>
                  <dl className='mt-5 grid grid-cols-3 gap-3 text-center'>
                    {[
                      ['Bookings', `${data.bookingsArrived}/${data.bookings}`],
                      ['Still due', data.guests - data.guestsArrived],
                      ['Unapproved', data.pendingApproval],
                    ].map(([label, value]) => (
                      <div key={label as string} className='rounded-lg bg-muted/60 px-2 py-2'>
                        <dt className='text-xs text-muted-foreground'>{label}</dt>
                        <dd className='text-lg font-semibold tabular-nums text-navy-950'>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <div className='flex justify-center py-8'>
                  <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                </div>
              )}
            </Panel>

            <Panel title='Latest arrivals' bodyClassName='p-0'>
              {data?.recent.length ? (
                <ul className='divide-y divide-border'>
                  {data.recent.map((guest) => (
                    <li key={guest.id} className='flex items-center gap-3 px-4 py-2.5'>
                      <CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-600' />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-navy-950'>
                          {guest.fullName}
                          {guest.partySize > 1 && <span className='ml-2 text-xs font-normal text-muted-foreground'>party of {guest.partySize}</span>}
                        </p>
                        <p className='text-xs text-muted-foreground'>{relativeTime(guest.checkedInAt)}</p>
                      </div>
                      {editable && (
                        <button
                          onClick={() => window.confirm(`Undo check-in for ${guest.fullName}?`) && scan.mutate({ bookingId: guest.id, undo: true })}
                          className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-navy-900'
                          aria-label={`Undo check-in for ${guest.fullName}`}
                        >
                          <RotateCcw className='h-4 w-4' />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title='No one has checked in yet' />
              )}
            </Panel>
          </div>
        </div>
      )}
    </PageBody>
  )
}
