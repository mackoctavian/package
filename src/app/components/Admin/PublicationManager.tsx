'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Textarea } from '@/app/components/ui/textarea'
import { UploadField } from '@/app/components/Admin/UploadField'
import { Loader2, PencilLine, Plus, Trash2 } from 'lucide-react'

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
}

type PublicationForm = {
  id?: string
  title: string
  slug: string
  subtitle: string
  category: string
  format: string
  author: string
  badge: string
  status: 'draft' | 'published' | 'scheduled'
  publishDate: string
  coverImage: string
  description: string
  price: string
  originalPrice: string
  downloadUrl: string
  inStock: boolean
}

const formatOptions = ['Hardcover', 'Paperback', 'Digital', 'Audio', 'Video', 'CD', 'Calendar']

const emptyForm: PublicationForm = {
  title: '',
  slug: '',
  subtitle: '',
  category: '',
  format: 'Paperback',
  author: '',
  badge: '',
  status: 'draft',
  publishDate: '',
  coverImage: '',
  description: '',
  price: '',
  originalPrice: '',
  downloadUrl: '',
  inStock: true,
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const mapRecordToForm = (record: ContentRecord): PublicationForm => {
  const meta = record.metadata ?? {}
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    subtitle: record.summary ?? '',
    category: record.category ?? '',
    format: (meta['format'] as string) || 'Paperback',
    author: (meta['author'] as string) || '',
    badge: (meta['badge'] as string) || '',
    status: (record.status as PublicationForm['status']) || 'draft',
    publishDate: record.publishDate ? record.publishDate.slice(0, 10) : '',
    coverImage: record.mediaUrl || '',
    description: record.body || '',
    price: meta['price'] != null ? String(meta['price']) : '',
    originalPrice: meta['originalPrice'] != null ? String(meta['originalPrice']) : '',
    downloadUrl: (meta['downloadUrl'] as string) || '',
    inStock: meta['inStock'] !== undefined ? Boolean(meta['inStock']) : true,
  }
}

const normalizePayload = (form: PublicationForm) => ({
  title: form.title,
  slug: form.slug || slugify(form.title),
  summary: form.subtitle,
  category: form.category,
  status: form.status,
  mediaUrl: form.coverImage,
  publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : null,
  body: form.description,
  metadata: {
    author: form.author,
    format: form.format,
    badge: form.badge || undefined,
    price: form.price ? Number(form.price) : undefined,
    originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
    downloadUrl: form.downloadUrl || undefined,
    inStock: form.inStock,
  },
})

export function PublicationManager() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PublicationForm>(emptyForm)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['content', 'publications'],
    queryFn: async (): Promise<ContentRecord[]> => {
      const response = await fetch('/api/content/publications')
      if (!response.ok) throw new Error('Unable to load publications.')
      const payload = await response.json()
      return payload.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: PublicationForm) => {
      const response = await fetch('/api/content/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizePayload(payload)),
      })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to create publication')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Publication created')
      queryClient.invalidateQueries({ queryKey: ['content', 'publications'] })
      closeEditor()
    },
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: PublicationForm) => {
      if (!payload.id) throw new Error('Missing identifier')
      const response = await fetch(`/api/content/publications/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizePayload(payload)),
      })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to update publication')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Publication updated')
      queryClient.invalidateQueries({ queryKey: ['content', 'publications'] })
      closeEditor()
    },
    onError: handleError,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content/publications/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to delete publication')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Publication removed')
      queryClient.invalidateQueries({ queryKey: ['content', 'publications'] })
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
      setForm(mapRecordToForm(record))
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
    <div className='space-y-6 px-6 py-8'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Publications</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Publications library</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>
            Manage covers, pricing, formats, and downloadable resources. Keep your library consistent with professional metadata.
          </p>
        </div>
        <Button className='gap-2' onClick={() => handleEdit()}>
          <Plus className='h-4 w-4' /> New publication
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total</CardDescription>
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
          <CardTitle className='text-lg'>Publications</CardTitle>
          <CardDescription>Curate products and downloadable materials.</CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Loading publications…
            </div>
          ) : (listQuery.data?.length ?? 0) === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500'>
              <p>No publications yet. Create your first entry.</p>
              <Button size='sm' onClick={() => handleEdit()}>
                Create publication
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.data?.map((record) => {
                  const meta = record.metadata ?? {}
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <p className='font-semibold text-slate-900'>{record.title}</p>
                        <p className='text-xs text-slate-500'>{record.summary ?? '—'}</p>
                      </TableCell>
                      <TableCell className='text-sm text-slate-500'>{meta['author'] || '—'}</TableCell>
                      <TableCell className='text-sm text-slate-500'>{meta['format'] || '—'}</TableCell>
                      <TableCell>
                        <Badge className='capitalize'>{record.status}</Badge>
                      </TableCell>
                      <TableCell className='text-sm text-slate-600'>
                        {meta['price'] != null ? `TSh ${meta['price']}` : '—'}
                      </TableCell>
                      <TableCell className='text-sm text-slate-500'>
                        {record.publishDate ? new Date(record.publishDate).toLocaleDateString() : '—'}
                      </TableCell>
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
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeEditor() : setIsDialogOpen(true))}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit publication' : 'Create publication'}</DialogTitle>
            <DialogDescription>Capture full product metadata for a professional catalog entry.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Title *'>
                <Input value={form.title} onChange={(e) => updateForm('title', e.target.value)} required />
              </Field>
              <Field label='Slug'>
                <Input value={form.slug} onChange={(e) => updateForm('slug', slugify(e.target.value))} />
              </Field>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Author *'>
                <Input value={form.author} onChange={(e) => updateForm('author', e.target.value)} required />
              </Field>
              <Field label='Format'>
                <select
                  className='h-10 rounded-lg border border-slate-200 px-3 text-sm'
                  value={form.format}
                  onChange={(e) => updateForm('format', e.target.value)}>
                  {formatOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label='Subtitle / short blurb'>
              <Input value={form.subtitle} onChange={(e) => updateForm('subtitle', e.target.value)} />
            </Field>
            <Field label='Description'>
              <Textarea rows={4} value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
            </Field>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Category'>
                <Input value={form.category} onChange={(e) => updateForm('category', e.target.value)} placeholder='Books, CDs, Calendars…' />
              </Field>
              <Field label='Badge'>
                <Input value={form.badge} onChange={(e) => updateForm('badge', e.target.value)} placeholder='Bestseller, New, Staff Pick' />
              </Field>
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              <Field label='Price (TSh)'>
                <Input type='number' value={form.price} onChange={(e) => updateForm('price', e.target.value)} min={0} />
              </Field>
              <Field label='Original price (TSh)'>
                <Input type='number' value={form.originalPrice} onChange={(e) => updateForm('originalPrice', e.target.value)} min={0} />
              </Field>
              <Field label='In stock'>
                <div className='flex items-center gap-2 h-10'>
                  <input
                    type='checkbox'
                    checked={form.inStock}
                    onChange={(e) => updateForm('inStock', e.target.checked)}
                    className='rounded border-slate-300 text-primary focus:ring-primary'
                  />
                  <span className='text-sm text-slate-600'>Available</span>
                </div>
              </Field>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Publish date'>
                <Input type='date' value={form.publishDate} onChange={(e) => updateForm('publishDate', e.target.value)} />
              </Field>
              <Field label='Status'>
                <select
                  className='h-10 rounded-lg border border-slate-200 px-3 text-sm'
                  value={form.status}
                  onChange={(e) => updateForm('status', e.target.value as PublicationForm['status'])}>
                  <option value='draft'>Draft</option>
                  <option value='published'>Published</option>
                  <option value='scheduled'>Scheduled</option>
                </select>
              </Field>
            </div>
            <UploadField
              label='Cover image'
              value={form.coverImage}
              onChange={(url) => updateForm('coverImage', url)}
              folder='content/publications'
              accept='image/*'
              hint='Upload a high-quality cover image.'
            />
            <Field label='Download URL (optional)'>
              <Input
                type='url'
                value={form.downloadUrl}
                onChange={(e) => updateForm('downloadUrl', e.target.value)}
                placeholder='https://example.com/publication.pdf'
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant='ghost' onClick={closeEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className='gap-2'>
              {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <PencilLine className='h-4 w-4' />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => (!open ? setIsDeleteOpen(false) : setIsDeleteOpen(true))}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete publication</DialogTitle>
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

  function updateForm<K extends keyof PublicationForm>(key: K, value: PublicationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-1.5'>
    <Label className='text-sm text-slate-700'>{label}</Label>
    {children}
  </div>
)

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


