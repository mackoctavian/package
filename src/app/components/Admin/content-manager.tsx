"use client"

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, PencilLine, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Textarea } from '@/app/components/ui/textarea'
import { cn } from '@/lib/utils'

type ContentRecord = {
  id: string
  title: string
  slug: string
  summary?: string | null
  category?: string | null
  status: string
  mediaUrl?: string | null
  publishDate?: string | null
  body?: string | null
  metadata?: Record<string, unknown> | null
  createdAt?: string
}

type MetadataField = {
  key: string
  label: string
  placeholder?: string
}

export type ContentManagerProps = {
  type: string
  title: string
  description: string
  emptyState?: string
  metadataFields?: MetadataField[]
}

type ContentForm = {
  id?: string
  title: string
  slug: string
  summary: string
  category: string
  status: 'draft' | 'published' | 'scheduled'
  mediaUrl: string
  publishDate: string
  body: string
  metadata: Record<string, string>
}

const emptyForm: ContentForm = {
  title: '',
  slug: '',
  summary: '',
  category: '',
  status: 'draft',
  mediaUrl: '',
  publishDate: '',
  body: '',
  metadata: {},
}

const statusColors: Record<string, string> = {
  drafted: 'bg-zinc-100 text-zinc-600',
  draft: 'bg-zinc-100 text-zinc-600',
  published: 'bg-black text-white',
  scheduled: 'bg-zinc-200 text-zinc-700',
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

export function ContentManager({ type, title, description, emptyState, metadataFields = [] }: ContentManagerProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ContentForm>(emptyForm)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['content', type],
    queryFn: async (): Promise<ContentRecord[]> => {
      const response = await fetch(`/api/content/${type}`)
      if (!response.ok) throw new Error('Unable to load content.')
      const payload = await response.json()
      return payload.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: ContentForm) => {
      const response = await fetch(`/api/content/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizePayload(payload)),
      })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to create content')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Entry created')
      queryClient.invalidateQueries({ queryKey: ['content', type] })
      closeEditor()
    },
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: ContentForm) => {
      if (!payload.id) throw new Error('Missing identifier')
      const response = await fetch(`/api/content/${type}/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizePayload(payload)),
      })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to update content')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Entry updated')
      queryClient.invalidateQueries({ queryKey: ['content', type] })
      closeEditor()
    },
    onError: handleError,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content/${type}/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to delete entry')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Entry removed')
      queryClient.invalidateQueries({ queryKey: ['content', type] })
      setIsDeleteOpen(false)
      setDeleteId(null)
    },
    onError: handleError,
  })

  const stats = useMemo(() => {
    const items = listQuery.data ?? []
    return {
      total: items.length,
      published: items.filter((item) => item.status === 'published').length,
      draft: items.filter((item) => item.status === 'draft').length,
    }
  }, [listQuery.data])

  const handleEdit = (record?: ContentRecord) => {
    if (!record) {
      setForm(emptyForm)
    } else {
      setForm({
        id: record.id,
        title: record.title,
        slug: record.slug,
        summary: record.summary ?? '',
        category: record.category ?? '',
        status: (record.status as ContentForm['status']) || 'draft',
        mediaUrl: record.mediaUrl ?? '',
        publishDate: record.publishDate ? record.publishDate.slice(0, 10) : '',
        body: record.body ?? '',
        metadata: Object.fromEntries(
          Object.entries(record.metadata ?? {}).map(([key, value]) => [key, String(value ?? '')]),
        ),
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (form.id) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const closeEditor = () => {
    setIsDialogOpen(false)
    setForm(emptyForm)
  }

  const handleDelete = (record: ContentRecord) => {
    setDeleteId(record.id)
    setIsDeleteOpen(true)
  }

  const isSaving = createMutation.isLoading || updateMutation.isLoading

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Content control</p>
          <h1 className='text-3xl font-semibold text-slate-900'>{title}</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>{description}</p>
        </div>
        <Button className='gap-2' onClick={() => handleEdit()}>
          <Plus className='h-4 w-4' /> New entry
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total entries</CardDescription>
            <CardTitle className='text-3xl'>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Published</CardDescription>
            <CardTitle className='text-3xl'>{stats.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Drafts</CardDescription>
            <CardTitle className='text-3xl'>{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Entries</CardTitle>
          <CardDescription>Manage published, scheduled, and draft content for {type}.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Loading entries…
            </div>
          ) : (listQuery.data?.length ?? 0) === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500'>
              <p>{emptyState ?? 'No content yet. Create your first entry.'}</p>
              <Button size='sm' onClick={() => handleEdit()}>
                Create entry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish date</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.data?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className='font-semibold text-slate-900'>{record.title}</p>
                      <p className='text-xs text-slate-500'>{record.summary ?? '—'}</p>
                    </TableCell>
                    <TableCell className='text-sm text-slate-500'>{record.category || '—'}</TableCell>
                    <TableCell>
                      <Badge className={cn('capitalize', statusColors[record.status] ?? 'bg-slate-100 text-slate-600')}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-sm text-slate-500'>{formatDate(record.publishDate)}</TableCell>
                    <TableCell className='text-right space-x-2'>
                      <Button variant='ghost' size='icon' onClick={() => handleEdit(record)}>
                        <PencilLine className='h-4 w-4 text-slate-600' />
                        <span className='sr-only'>Edit</span>
                      </Button>
                      <Button variant='ghost' size='icon' onClick={() => handleDelete(record)}>
                        <Trash2 className='h-4 w-4 text-red-600' />
                        <span className='sr-only'>Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeEditor() : setIsDialogOpen(true))}>
        <DialogContent className='max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit content' : 'Create content'}</DialogTitle>
            <DialogDescription>Manage the metadata, imagery, and editorial details for this entry.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Title *'>
                <Input value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
              </Field>
              <Field label='Slug'>
                <Input value={form.slug} onChange={(event) => updateForm('slug', slugify(event.target.value))} />
              </Field>
            </div>
            <Field label='Summary'>
              <Textarea rows={3} value={form.summary} onChange={(event) => updateForm('summary', event.target.value)} />
            </Field>
            <Field label='Detailed body'>
              <Textarea rows={5} value={form.body} onChange={(event) => updateForm('body', event.target.value)} />
            </Field>
            <div className='grid gap-4 sm:grid-cols-3'>
              <Field label='Category'>
                <Input value={form.category} onChange={(event) => updateForm('category', event.target.value)} />
              </Field>
              <Field label='Status'>
                <select
                  className='h-10 rounded-lg border border-slate-200 px-3 text-sm'
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value as ContentForm['status'])}>
                  <option value='draft'>Draft</option>
                  <option value='published'>Published</option>
                  <option value='scheduled'>Scheduled</option>
                </select>
              </Field>
              <Field label='Publish date'>
                <Input type='date' value={form.publishDate} onChange={(event) => updateForm('publishDate', event.target.value)} />
              </Field>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Media URL'>
                <Input value={form.mediaUrl} onChange={(event) => updateForm('mediaUrl', event.target.value)} />
              </Field>
            </div>
            {metadataFields.length > 0 && (
              <div className='space-y-3 rounded-xl border border-dashed border-slate-200 p-4'>
                <p className='text-sm font-semibold text-slate-800'>Additional metadata</p>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {metadataFields.map((field) => (
                    <Field key={field.key} label={field.label}>
                      <Input
                        value={form.metadata[field.key] ?? ''}
                        placeholder={field.placeholder}
                        onChange={(event) => updateMetadata(field.key, event.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='ghost' onClick={closeEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className='gap-2'>
              {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <PencilLine className='h-4 w-4' />}
              Save entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => (!open ? setIsDeleteOpen(false) : setIsDeleteOpen(true))}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete entry</DialogTitle>
            <DialogDescription>This action cannot be undone. The entry will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsDeleteOpen(false)} disabled={deleteMutation.isLoading}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              className='gap-2'
              disabled={deleteMutation.isLoading}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function updateForm<K extends keyof ContentForm>(key: K, value: ContentForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateMetadata(key: string, value: string) {
    setForm((prev) => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }))
  }

  function normalizePayload(payload: ContentForm) {
    return {
      title: payload.title,
      slug: payload.slug || slugify(payload.title),
      summary: payload.summary,
      category: payload.category,
      status: payload.status,
      mediaUrl: payload.mediaUrl,
      publishDate: payload.publishDate ? new Date(payload.publishDate).toISOString() : null,
      body: payload.body,
      metadata: payload.metadata,
    }
  }
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-1.5'>
    <Label className='text-sm text-slate-700'>{label}</Label>
    {children}
  </div>
)

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  toastError(message)
}

function toastSuccess(message: string) {
  if (typeof window !== 'undefined') {
    import('react-hot-toast').then(({ toast }) => toast.success(message))
  }
}

function toastError(message: string) {
  if (typeof window !== 'undefined') {
    import('react-hot-toast').then(({ toast }) => toast.error(message))
  }
}

