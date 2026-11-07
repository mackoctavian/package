'use client'

import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, ChevronLeft, Languages, Loader2, PenLine } from 'lucide-react'

import { FilterSelect, SearchInput } from '@/app/components/Admin/shell/fields'
import { EmptyState, Panel, StatCard } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { LOCALE_META, type Locale } from '@/i18n/config'
import { relativeTime } from '@/lib/admin/safe'
import { cn } from '@/lib/utils'
import { api, STATUS_LABELS, STATUS_TONES, type GroupItem, type GroupSummary, type Status } from './api'
import { RecordEditor } from './RecordEditor'
import type { SetParams } from './TranslationsWorkspace'

type Props = { locale: Locale; params: URLSearchParams; setParams: SetParams }

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Every status' },
  { value: 'todo', label: 'Needs work' },
  { value: 'missing', label: STATUS_LABELS.missing },
  { value: 'partial', label: STATUS_LABELS.partial },
  { value: 'outdated', label: STATUS_LABELS.outdated },
  { value: 'complete', label: STATUS_LABELS.complete },
]

export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', STATUS_TONES[status])}>{STATUS_LABELS[status]}</span>
}

const percent = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 100)

function ProgressBar({ counts, total }: { counts: Record<Status, number>; total: number }) {
  if (!total) return <div className='h-1.5 rounded-full bg-slate-100' />
  const segments: Array<[Status, string]> = [
    ['complete', 'bg-emerald-500'],
    ['outdated', 'bg-rose-400'],
    ['partial', 'bg-amber-400'],
  ]
  return (
    <div className='flex h-1.5 overflow-hidden rounded-full bg-slate-100'>
      {segments.map(([status, tone]) => (counts[status] ? <span key={status} className={tone} style={{ width: `${(counts[status] / total) * 100}%` }} /> : null))}
    </div>
  )
}

export function ContentTab({ locale, params, setParams }: Props) {
  const groupId = params.get('group')
  const target = LOCALE_META[locale].name

  const overview = useQuery({
    queryKey: ['translations', 'content', locale],
    queryFn: () => api<{ groups: GroupSummary[] }>(`/api/admin/translations/content?locale=${locale}`),
  })

  const totals = useMemo(() => {
    const groups = overview.data?.groups ?? []
    const sum = (status: Status) => groups.reduce((total, group) => total + group.counts[status], 0)
    return { total: groups.reduce((total, group) => total + group.total, 0), complete: sum('complete'), outdated: sum('outdated'), todo: sum('missing') + sum('partial') }
  }, [overview.data])

  if (overview.isLoading) {
    return (
      <div className='flex items-center gap-2 py-16 text-sm text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin' /> Loading translation progress…
      </div>
    )
  }
  if (overview.error) {
    return (
      <Panel>
        <EmptyState icon={AlertTriangle} title="Couldn't load translations" description={(overview.error as Error).message} action={<Button variant='outline' onClick={() => overview.refetch()}>Try again</Button>} />
      </Panel>
    )
  }

  const groups = overview.data?.groups ?? []
  const group = groupId ? groups.find((candidate) => candidate.id === groupId) : undefined
  if (group) return <GroupView group={group} locale={locale} params={params} setParams={setParams} />

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Items to translate' value={totals.total} icon={Languages} />
        <StatCard label={`Fully in ${target}`} value={totals.complete} hint={`${percent(totals.complete, totals.total)}% of everything`} icon={CheckCircle2} tone='green' />
        <StatCard label='Not finished' value={totals.todo} hint='Not started, or some fields left' icon={PenLine} tone='gold' />
        <StatCard label='Needs review' value={totals.outdated} hint='The English changed after translating' icon={AlertTriangle} tone='rose' />
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {groups.map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => setParams({ group: item.id, status: null, q: null })}
            className='group flex flex-col gap-3 rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:border-navy-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='font-semibold text-navy-950'>{item.label}</p>
                <p className='mt-0.5 text-sm text-muted-foreground'>{item.description}</p>
              </div>
              <span className='shrink-0 text-sm font-semibold tabular-nums text-navy-950'>{percent(item.counts.complete, item.total)}%</span>
            </div>
            <ProgressBar counts={item.counts} total={item.total} />
            <div className='flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground'>
              <span>
                {item.counts.complete} of {item.total} translated
              </span>
              {item.counts.outdated > 0 && <span className='text-rose-700'>{item.counts.outdated} need review</span>}
              {!item.canEdit && <span>View only</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function GroupView({ group, locale, params, setParams }: { group: GroupSummary; locale: Locale; params: URLSearchParams; setParams: SetParams }) {
  const status = params.get('status') ?? ''
  const search = params.get('q') ?? ''
  const openId = params.get('item')

  const query = useQuery({
    queryKey: ['translations', 'content', locale, group.id],
    queryFn: () => api<{ items: GroupItem[] }>(`/api/admin/translations/content?locale=${locale}&group=${group.id}`),
    placeholderData: keepPreviousData,
  })

  const items = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (query.data?.items ?? []).filter((item) => {
      if (status === 'todo' ? !['missing', 'partial', 'outdated'].includes(item.status) : status && item.status !== status) return false
      if (needle && !`${item.label} ${item.detail ?? ''}`.toLowerCase().includes(needle)) return false
      return true
    })
  }, [query.data, search, status])

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <Button variant='ghost' size='sm' onClick={() => setParams({ group: null, item: null, status: null, q: null })} className='-ml-2 gap-1'>
          <ChevronLeft className='h-4 w-4' /> All content
        </Button>
      </div>

      <Panel
        title={group.label}
        description={`${group.counts.complete} of ${group.total} translated${group.canEdit ? '' : ' · view only'}`}
        bodyClassName='p-0'
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <SearchInput value={search} onChange={(value) => setParams({ q: value || null })} placeholder={`Search ${group.label.toLowerCase()}`} className='w-56' />
            <FilterSelect label='Status' value={status} onChange={(value) => setParams({ status: value || null })} options={STATUS_FILTERS} />
          </div>
        }
      >
        {query.isLoading ? (
          <div className='flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground'>
            <Loader2 className='h-4 w-4 animate-spin' /> Loading…
          </div>
        ) : query.error ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load this list" description={(query.error as Error).message} action={<Button variant='outline' onClick={() => query.refetch()}>Try again</Button>} />
        ) : !items.length ? (
          <EmptyState icon={Languages} title={query.data?.items.length ? 'Nothing matches these filters' : `No ${group.label.toLowerCase()} yet`} />
        ) : (
          <ul className='divide-y divide-border'>
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type='button'
                  onClick={() => setParams({ item: item.id })}
                  className='flex w-full flex-col gap-2 px-5 py-3.5 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium text-navy-950'>{item.label}</p>
                    {item.detail && <p className='truncate text-sm text-muted-foreground'>{item.detail}</p>}
                  </div>
                  <div className='flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                    {item.required > 0 && (
                      <span className='tabular-nums'>
                        {item.translated}/{item.required} fields
                      </span>
                    )}
                    {item.updatedAt && (
                      <span title={new Date(item.updatedAt).toLocaleString('en-GB')}>
                        {relativeTime(item.updatedAt)}
                        {item.updatedBy ? ` · ${item.updatedBy}` : ''}
                      </span>
                    )}
                    <StatusBadge status={item.status} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <RecordEditor groupId={group.id} id={openId} locale={locale} onClose={() => setParams({ item: null })} />
    </div>
  )
}
