'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Copy, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { EmptyState } from '@/app/components/Admin/shell/primitives'
import { Button } from '@/app/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/app/components/ui/sheet'
import { LOCALE_META, type Locale } from '@/i18n/config'
import { relativeTime } from '@/lib/admin/safe'
import { cn } from '@/lib/utils'
import { api, type EditorField, type EditorRecord, type ListItem } from './api'
import { StatusBadge } from './ContentTab'

type Draft = Record<string, string | ListItem[]>

const inputClass = 'w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-slate-50'

/** A list translation lines up with the English list item by item. */
const alignList = (field: EditorField, value: string | ListItem[]) => {
  const source = Array.isArray(field.source) ? field.source : []
  const current = Array.isArray(value) ? value : []
  return source.map((_, index) => current[index] ?? {})
}

const toDraft = (record: EditorRecord): Draft =>
  Object.fromEntries(record.fields.map((field) => [field.key, field.kind === 'list' ? alignList(field, field.value) : (field.value as string)]))

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function Box({ value, onChange, long, disabled, placeholder, label }: { value: string; onChange: (value: string) => void; long: boolean; disabled: boolean; placeholder?: string; label: string }) {
  return long ? (
    <textarea aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} rows={Math.min(14, Math.max(3, Math.ceil(value.length / 70)))} disabled={disabled} placeholder={placeholder} className={cn(inputClass, 'resize-y leading-relaxed')} />
  ) : (
    <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} className={cn(inputClass, 'h-10')} />
  )
}

function Source({ text }: { text: string }) {
  return <p className='whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700'>{text || <span className='italic text-muted-foreground'>No English text</span>}</p>
}

export function RecordEditor({ groupId, id, locale, onClose }: { groupId: string; id: string | null; locale: Locale; onClose: () => void }) {
  const queryClient = useQueryClient()
  const target = LOCALE_META[locale].name
  const queryKey = ['translations', 'record', locale, groupId, id]

  const query = useQuery({
    queryKey,
    queryFn: () => api<EditorRecord>(`/api/admin/translations/content/${groupId}/${id}?locale=${locale}`),
    enabled: Boolean(id),
  })

  const initial = useMemo(() => (query.data ? toDraft(query.data) : {}), [query.data])
  const [draft, setDraft] = useState<Draft>(initial)
  // Reset the draft whenever a fresh copy of the record arrives (opened, or saved).
  const [draftFor, setDraftFor] = useState(initial)
  if (draftFor !== initial) {
    setDraftFor(initial)
    setDraft(initial)
  }

  const changed = useMemo(() => Object.keys(initial).filter((key) => !same(initial[key], draft[key])), [draft, initial])
  const canEdit = Boolean(query.data?.canEdit)

  const save = useMutation({
    mutationFn: () =>
      api<EditorRecord>(`/api/admin/translations/content/${groupId}/${id}`, {
        method: 'PUT',
        // Outdated fields are always sent, so saving marks them reviewed against the current English.
        body: JSON.stringify({
          locale,
          values: Object.fromEntries([...new Set([...changed, ...(query.data?.fields.filter((field) => field.outdated).map((field) => field.key) ?? [])])].map((key) => [key, draft[key]])),
        }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
      queryClient.invalidateQueries({ queryKey: ['translations', 'content', locale] })
      toast.success(`${target} translation saved`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const close = () => {
    if (changed.length && !window.confirm('You have unsaved changes. Close without saving?')) return
    onClose()
  }

  const setField = (key: string, value: string | ListItem[]) => setDraft((current) => ({ ...current, [key]: value }))
  const setListItem = (field: EditorField, index: number, sub: string, value: string) => {
    const list = [...((draft[field.key] as ListItem[]) ?? [])]
    list[index] = { ...(list[index] ?? {}), [sub]: value }
    setField(field.key, list)
  }

  const record = query.data

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && close()}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-3xl'>
        <SheetHeader className='border-b border-border px-6 py-5'>
          <SheetTitle className='pr-8 text-xl font-semibold text-navy-950'>{record?.record.label ?? 'Translation'}</SheetTitle>
          <SheetDescription className='flex flex-wrap items-center gap-2'>
            {record ? (
              <>
                <span>
                  {record.group.label} · English → {target}
                </span>
                <StatusBadge status={record.status} />
                {!canEdit && <span className='text-xs'>View only</span>}
              </>
            ) : (
              'Loading…'
            )}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-6 py-5'>
          {query.isLoading ? (
            <div className='flex items-center gap-2 py-10 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' /> Loading…
            </div>
          ) : query.error ? (
            <EmptyState icon={AlertTriangle} title="Couldn't load this item" description={(query.error as Error).message} />
          ) : record ? (
            <div className='space-y-7'>
              {record.outdated > 0 && (
                <p className='flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800'>
                  <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
                  The English text of {record.outdated === 1 ? 'one field' : `${record.outdated} fields`} changed after it was translated. Check the {target} and save to mark it reviewed.
                </p>
              )}
              {record.fields.map((field) => (
                <section key={field.key} className={cn('space-y-2', !field.required && !field.translated && 'opacity-60')}>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-sm font-semibold text-navy-950'>{field.label}</h3>
                      {field.outdated && <span className='rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200'>English changed</span>}
                      {!field.required && <span className='text-xs text-muted-foreground'>No English text</span>}
                    </div>
                    <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                      {field.updatedAt && (
                        <span>
                          Saved {relativeTime(field.updatedAt)}
                          {field.updatedBy ? ` by ${field.updatedBy}` : ''}
                        </span>
                      )}
                      {canEdit && field.required && (
                        <button
                          type='button'
                          className='inline-flex items-center gap-1 font-medium text-navy-700 hover:text-navy-950'
                          onClick={() => setField(field.key, field.kind === 'list' ? (field.source as ListItem[]).map((item) => ({ ...item })) : (field.source as string))}
                          title='Start from the English text'
                        >
                          <Copy className='h-3.5 w-3.5' /> Copy English
                        </button>
                      )}
                    </div>
                  </div>
                  {field.hint && <p className='text-xs text-muted-foreground'>{field.hint}</p>}

                  {field.kind === 'list' ? (
                    <ol className='space-y-4'>
                      {(field.source as ListItem[]).map((item, index) => (
                        <li key={index} className='rounded-lg border border-border p-3'>
                          <p className='mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>Item {index + 1}</p>
                          <div className='space-y-3'>
                            {(field.itemFields ?? [{ key: 'title', label: 'Text', kind: 'text' as const }]).map((sub) => (
                              <div key={sub.key} className='grid gap-2 md:grid-cols-2'>
                                <div>
                                  <p className='mb-1 text-xs text-muted-foreground'>{sub.label} · English</p>
                                  <Source text={String(item[sub.key] ?? '')} />
                                </div>
                                <div>
                                  <p className='mb-1 text-xs text-muted-foreground'>{sub.label} · {target}</p>
                                  <Box
                                    label={`${field.label} ${index + 1} ${sub.label} in ${target}`}
                                    value={String(((draft[field.key] as ListItem[]) ?? [])[index]?.[sub.key] ?? '')}
                                    onChange={(value) => setListItem(field, index, sub.key, value)}
                                    long={sub.kind === 'long'}
                                    disabled={!canEdit || !String(item[sub.key] ?? '').trim()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className='grid gap-3 md:grid-cols-2'>
                      <div>
                        <p className='mb-1 text-xs text-muted-foreground'>English</p>
                        <Source text={field.source as string} />
                      </div>
                      <div>
                        <p className='mb-1 text-xs text-muted-foreground'>{target}</p>
                        <Box
                          label={`${field.label} in ${target}`}
                          value={(draft[field.key] as string) ?? ''}
                          onChange={(value) => setField(field.key, value)}
                          long={field.kind === 'long'}
                          disabled={!canEdit || (!field.required && !field.translated)}
                          placeholder={field.required ? 'Shows in English until translated' : undefined}
                        />
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : null}
        </div>

        {record && canEdit && (
          <SheetFooter className='items-center'>
            <p className='mr-auto text-xs text-muted-foreground'>{changed.length ? `${changed.length} unsaved ${changed.length === 1 ? 'change' : 'changes'}` : 'Leave a field empty to show the English.'}</p>
            <Button variant='outline' onClick={close}>
              Close
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || (!changed.length && !record.outdated)}>
              {save.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {!changed.length && record.outdated ? 'Mark reviewed' : 'Save translation'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
