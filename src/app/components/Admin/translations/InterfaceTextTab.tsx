'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Pencil, RotateCcw, Type } from 'lucide-react'
import toast from 'react-hot-toast'

import { FilterSelect, SearchInput } from '@/app/components/Admin/shell/fields'
import { EmptyState, Panel, StatCard } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { LOCALE_META, SOURCE_LOCALE, type Locale } from '@/i18n/config'
import { relativeTime } from '@/lib/admin/safe'
import { cn } from '@/lib/utils'
import { api, type UiEntry, type UiResponse } from './api'
import type { SetParams } from './TranslationsWorkspace'

type Props = { scope: 'web' | 'mobile'; locale: Locale; params: URLSearchParams; setParams: SetParams }

const PAGE = 60

const effective = (entry: UiEntry, locale: string) => {
  const cell = entry.locales[locale]
  return cell?.override ?? cell?.builtIn ?? null
}

/** Built-in text missing, or still identical to the English (often just untranslated). */
const untranslated = (entry: UiEntry, locale: string) => {
  const cell = entry.locales[locale]
  if (cell?.override) return false
  const english = effective(entry, SOURCE_LOCALE)
  return !cell?.builtIn || (cell.builtIn === english && /[a-z]{3,}/i.test(english ?? ''))
}

const humanise = (namespace: string) => namespace.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())

export function InterfaceTextTab({ scope, locale, params, setParams }: Props) {
  const queryClient = useQueryClient()
  const queryKey = ['translations', 'ui', scope]
  const query = useQuery({ queryKey, queryFn: () => api<UiResponse>(`/api/admin/translations/ui?scope=${scope}`) })

  const search = params.get('q') ?? ''
  const namespace = params.get('ns') ?? ''
  const show = params.get('show') ?? ''
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<{ key: string; locale: string; value: string } | null>(null)

  const target = LOCALE_META[locale].name
  const area = scope === 'web' ? 'website' : 'mobile app'
  const entries = useMemo(() => query.data?.entries ?? [], [query.data])

  const namespaces = useMemo(() => [...new Set(entries.map((entry) => entry.namespace))].sort(), [entries])
  const stats = useMemo(
    () => ({
      total: entries.length,
      changed: entries.filter((entry) => Object.values(entry.locales).some((cell) => cell.override)).length,
      untranslated: entries.filter((entry) => untranslated(entry, locale)).length,
    }),
    [entries, locale],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (namespace && entry.namespace !== namespace) return false
      if (show === 'changed' && !Object.values(entry.locales).some((cell) => cell.override)) return false
      if (show === 'untranslated' && !untranslated(entry, locale)) return false
      if (!needle) return true
      return [entry.key, effective(entry, SOURCE_LOCALE), effective(entry, locale)].some((text) => text?.toLowerCase().includes(needle))
    })
  }, [entries, locale, namespace, search, show])

  const save = useMutation({
    mutationFn: (change: { locale: string; key: string; value: string | null }) =>
      api<{ saved: number }>('/api/admin/translations/ui', { method: 'PUT', body: JSON.stringify({ scope, changes: [change] }) }),
    onSuccess: (_, change) => {
      setEditing(null)
      queryClient.invalidateQueries({ queryKey })
      toast.success(change.value === null ? 'Restored the original text' : 'Text saved')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (query.isLoading) {
    return (
      <div className='flex items-center gap-2 py-16 text-sm text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin' /> Loading {area} text…
      </div>
    )
  }
  if (query.error) {
    return (
      <Panel>
        <EmptyState icon={AlertTriangle} title="Couldn't load interface text" description={(query.error as Error).message} action={<Button variant='outline' onClick={() => query.refetch()}>Try again</Button>} />
      </Panel>
    )
  }

  const canEdit = Boolean(query.data?.canEdit)
  const columns = [SOURCE_LOCALE, locale]

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard label={`${scope === 'web' ? 'Website' : 'App'} texts`} value={stats.total} hint='Buttons, menus, labels and messages' icon={Type} />
        <StatCard label='Changed here' value={stats.changed} hint='Edited in the admin panel' icon={Pencil} tone='gold' />
        <StatCard label={`Same as English in ${target}`} value={stats.untranslated} hint='Worth a look; some words are the same in both' icon={AlertTriangle} tone='rose' />
      </div>

      <Panel
        title={`${scope === 'web' ? 'Website' : 'Mobile app'} interface text`}
        description={
          scope === 'web'
            ? 'Changes show on the website straight away.'
            : 'Changes reach the app the next time it is opened. The app works offline with its built-in text.'
        }
        bodyClassName='p-0'
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <SearchInput value={search} onChange={(value) => { setLimit(PAGE); setParams({ q: value || null }) }} placeholder='Search text or key' className='w-56' />
            <FilterSelect
              label='Section'
              value={namespace}
              onChange={(value) => { setLimit(PAGE); setParams({ ns: value || null }) }}
              options={[{ value: '', label: 'Every section' }, ...namespaces.map((value) => ({ value, label: humanise(value) }))]}
            />
            <FilterSelect
              label='Show'
              value={show}
              onChange={(value) => { setLimit(PAGE); setParams({ show: value || null }) }}
              options={[
                { value: '', label: 'All text' },
                { value: 'changed', label: 'Changed here' },
                { value: 'untranslated', label: `Same as English in ${target}` },
              ]}
            />
          </div>
        }
      >
        {!filtered.length ? (
          <EmptyState icon={Type} title='Nothing matches these filters' />
        ) : (
          <>
            <div className='hidden grid-cols-[minmax(0,14rem)_1fr_1fr] gap-4 border-b border-border bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid'>
              <span>Where</span>
              {columns.map((column) => (
                <span key={column}>{LOCALE_META[column].name}</span>
              ))}
            </div>
            <ul className='divide-y divide-border'>
              {filtered.slice(0, limit).map((entry) => (
                <li key={entry.key} className='grid gap-3 px-5 py-3.5 lg:grid-cols-[minmax(0,14rem)_1fr_1fr] lg:gap-4'>
                  <div className='min-w-0'>
                    <p className='text-xs font-medium text-navy-700'>{humanise(entry.namespace)}</p>
                    <p className='break-all font-mono text-[11px] text-muted-foreground'>{entry.key.slice(entry.namespace.length + 1)}</p>
                    {entry.placeholders.length > 0 && <p className='mt-1 text-[11px] text-muted-foreground'>Keep: {entry.placeholders.join(' ')}</p>}
                  </div>
                  {columns.map((column) => {
                    const cell = entry.locales[column]
                    const isEditing = editing?.key === entry.key && editing.locale === column
                    const value = effective(entry, column)
                    if (isEditing) {
                      return (
                        <div key={column} className='space-y-2'>
                          <span className='text-xs font-medium text-muted-foreground lg:hidden'>{LOCALE_META[column].name}</span>
                          <textarea
                            autoFocus
                            aria-label={`${entry.key} in ${LOCALE_META[column].name}`}
                            value={editing.value}
                            onChange={(event) => setEditing({ ...editing, value: event.target.value })}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') setEditing(null)
                              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) save.mutate({ locale: column, key: entry.key, value: editing.value.trim() || null })
                            }}
                            rows={Math.max(2, Math.ceil(editing.value.length / 60))}
                            className='w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                          />
                          {cell?.builtIn && cell.override && <p className='text-xs text-muted-foreground'>Original: {cell.builtIn}</p>}
                          <div className='flex flex-wrap gap-2'>
                            <Button size='sm' onClick={() => save.mutate({ locale: column, key: entry.key, value: editing.value.trim() || null })} disabled={save.isPending}>
                              {save.isPending && <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />}Save
                            </Button>
                            <Button size='sm' variant='outline' onClick={() => setEditing(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={column} className='group min-w-0'>
                        <span className='text-xs font-medium text-muted-foreground lg:hidden'>{LOCALE_META[column].name}</span>
                        <div className='flex items-start gap-2'>
                          <p className={cn('min-w-0 flex-1 whitespace-pre-line text-sm', value ? 'text-navy-950' : 'italic text-muted-foreground', column !== SOURCE_LOCALE && untranslated(entry, column) && 'text-rose-700')}>
                            {value ?? 'Shows in English'}
                          </p>
                          {canEdit && (
                            <div className='flex shrink-0 gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100'>
                              <button type='button' aria-label='Edit' className='rounded p-1 text-muted-foreground hover:bg-slate-100 hover:text-navy-950' onClick={() => setEditing({ key: entry.key, locale: column, value: value ?? '' })}>
                                <Pencil className='h-3.5 w-3.5' />
                              </button>
                              {cell?.override && (
                                <button
                                  type='button'
                                  aria-label='Restore original text'
                                  title='Restore original text'
                                  className='rounded p-1 text-muted-foreground hover:bg-slate-100 hover:text-navy-950'
                                  onClick={() => save.mutate({ locale: column, key: entry.key, value: null })}
                                >
                                  <RotateCcw className='h-3.5 w-3.5' />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {cell?.override && (
                          <p className='mt-1 text-[11px] text-gold-700'>
                            Changed{cell.updatedAt ? ` ${relativeTime(cell.updatedAt)}` : ''}
                            {cell.updatedBy ? ` by ${cell.updatedBy}` : ''}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </li>
              ))}
            </ul>
            <div className='flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground'>
              <span>
                Showing {Math.min(limit, filtered.length)} of {filtered.length}
              </span>
              {limit < filtered.length && (
                <Button variant='outline' size='sm' onClick={() => setLimit(limit + PAGE * 2)}>
                  Show more
                </Button>
              )}
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
