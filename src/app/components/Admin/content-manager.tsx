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
import { useAdminUser } from '@dashboard/context/admin-user'
import { FilterSelect, SearchInput } from './shell/fields'
import { PageHeader, StatCard } from './shell/primitives'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { canEdit } from '@/lib/auth/admin-shared'
import { UploadField } from './UploadField'
import { MultiImageUpload } from './MultiImageUpload'

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
  metadata: Record<string, string | string[]>
}

type FieldConfig = {
  titleLabel: string
  summaryLabel: string
  categoryLabel: string
  mediaLabel: string
  showSummary: boolean
  showBody: boolean
  showCategory: boolean
  showPublishDate: boolean
  showMedia: boolean
  mediaRequired: boolean
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
  const editable = canEdit(useAdminUser(), type as AdminModuleId)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState<ContentForm>(emptyForm)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const presets: Record<string, FieldConfig> = {
    patrons: {
      titleLabel: 'Name *',
      summaryLabel: 'Bio',
      categoryLabel: 'Category',
      mediaLabel: 'Photo',
      showSummary: true,
      showBody: false,
      showCategory: false,
      showPublishDate: false,
      showMedia: true,
      mediaRequired: true,
    },
    publications: {
      titleLabel: 'Title *',
      summaryLabel: 'Subtitle / blurb',
      categoryLabel: 'Category',
      mediaLabel: 'Cover image',
      showSummary: true,
      showBody: true,
      showCategory: true,
      showPublishDate: true,
      showMedia: true,
      mediaRequired: true,
    },
    news: {
      titleLabel: 'Title *',
      summaryLabel: 'Summary',
      categoryLabel: 'Category / type',
      mediaLabel: 'Hero image',
      showSummary: true,
      showBody: true,
      showCategory: true,
      showPublishDate: true,
      showMedia: true,
      mediaRequired: false,
    },
    events: {
      titleLabel: 'Title *',
      summaryLabel: 'Summary',
      categoryLabel: 'Category / type',
      mediaLabel: 'Hero image',
      showSummary: true,
      showBody: true,
      showCategory: true,
      showPublishDate: true,
      showMedia: true,
      mediaRequired: false,
    },
    articles: {
      titleLabel: 'Title *',
      summaryLabel: 'Summary',
      categoryLabel: 'Category',
      mediaLabel: 'Hero image',
      showSummary: true,
      showBody: true,
      showCategory: true,
      showPublishDate: true,
      showMedia: true,
      mediaRequired: false,
    },
    default: {
      titleLabel: 'Title *',
      summaryLabel: 'Summary',
      categoryLabel: 'Category',
      mediaLabel: 'Media',
      showSummary: true,
      showBody: true,
      showCategory: true,
      showPublishDate: true,
      showMedia: true,
      mediaRequired: false,
    },
  }

  const mediaGuidance: Record<
    string,
    {
      placeholder: string
      hint: string
    }
  > = {
    patrons: {
      placeholder: 'Portrait headshot · 800×1000px',
      hint: 'Square or portrait 800×1000 px keeps clergy headshots sharp.',
    },
    publications: {
      placeholder: 'Cover illustration · 1200×1600px',
      hint: 'Upload a tall cover (≈1200×1600 px) for magazines or PDFs.',
    },
    news: {
      placeholder: 'Hero image · 1500×1000px',
      hint: 'Use a 3:2 hero (≈1500×1000 px) so homepage cards stay crisp.',
    },
    events: {
      placeholder: 'Event banner · 1400×900px',
      hint: 'Landscape 1400×900 px keeps schedule highlights consistent.',
    },
    articles: {
      placeholder: 'Feature image · 1600×900px',
      hint: 'Wide 16:9 image that works across blog layouts.',
    },
    default: {
      placeholder: 'Upload or paste an image URL (min width 1200px)',
      hint: 'High-resolution images (≥1200 px wide) look best on retina screens.',
    },
  }

  const fieldConfig = presets[type] ?? presets.default

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
          Object.entries(record.metadata ?? {}).map(([key, value]) => {
            if (Array.isArray(value)) {
              return [
                key,
                value.filter((item): item is string => typeof item === 'string'),
              ]
            }
            if (typeof value === 'string') {
              return [key, value]
            }
            return [key, value != null ? String(value) : '']
          }),
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

  const term = search.trim().toLowerCase()
  const visibleRecords = (listQuery.data ?? []).filter(
    (record) =>
      (statusFilter === 'all' || record.status === statusFilter) &&
      (!term || `${record.title} ${record.summary ?? ''} ${record.category ?? ''}`.toLowerCase().includes(term)),
  )
  const isSaving = createMutation.isPending || updateMutation.isPending

  const renderForm = () => {
    if (type === 'news') {
      return <NewsForm form={form} updateForm={updateForm} updateMetadata={updateMetadata} type={type} />
    }
    if (type === 'events') {
      return <EventsForm form={form} updateForm={updateForm} updateMetadata={updateMetadata} type={type} />
    }
    return (
      <DefaultForm
        type={type}
        form={form}
        fieldConfig={fieldConfig}
        metadataFields={metadataFields}
        mediaGuidance={mediaGuidance[type] ?? mediaGuidance.default}
        updateForm={updateForm}
        updateMetadata={updateMetadata}
      />
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Website'
        title={title}
        description={description}
        actions={
          editable ? (
            <Button className='gap-2' onClick={() => handleEdit()}>
              <Plus className='h-4 w-4' /> New entry
            </Button>
          ) : null
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard label='Total entries' value={stats.total} />
        <StatCard label='Published' value={stats.published} tone='green' />
        <StatCard label='Drafts' value={stats.draft} tone='gold' />
      </div>

      <div className='flex flex-col gap-2 sm:flex-row'>
        <SearchInput value={search} onChange={setSearch} placeholder='Search titles and summaries' className='flex-1' />
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
        />
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
              {editable && (
                <Button size='sm' onClick={() => handleEdit()}>
                  Create entry
                </Button>
              )}
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
                {visibleRecords.map((record) => (
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
                      {editable && (<>
                      <Button variant='ghost' size='icon' onClick={() => handleEdit(record)}>
                        <PencilLine className='h-4 w-4 text-slate-600' />
                        <span className='sr-only'>Edit</span>
                      </Button>
                      <Button variant='ghost' size='icon' onClick={() => handleDelete(record)}>
                        <Trash2 className='h-4 w-4 text-red-600' />
                        <span className='sr-only'>Delete</span>
                      </Button>
                      </>)}
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
          {renderForm()}
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
            <Button variant='ghost' onClick={() => setIsDeleteOpen(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              className='gap-2'
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
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

  function updateMetadata(key: string, value: string | string[]) {
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

type BaseFormProps = {
  form: ContentForm
  type: string
  updateForm: <K extends keyof ContentForm>(key: K, value: ContentForm[K]) => void
  updateMetadata: (key: string, value: string | string[]) => void
}

type DefaultFormProps = BaseFormProps & {
  fieldConfig: FieldConfig
  metadataFields: MetadataField[]
  mediaGuidance: {
    placeholder: string
    hint: string
  }
}

const DefaultForm = ({ form, fieldConfig, metadataFields, updateForm, updateMetadata, type, mediaGuidance }: DefaultFormProps) => (
  <div className='space-y-4'>
    <div className='grid gap-4 sm:grid-cols-2'>
      <Field label={fieldConfig.titleLabel}>
        <Input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />
      </Field>
      <Field label='Slug'>
        <Input value={form.slug} onChange={(event) => updateForm('slug', slugify(event.target.value))} />
      </Field>
    </div>
    {fieldConfig.showSummary && (
      <Field label={fieldConfig.summaryLabel}>
        <Textarea rows={3} value={form.summary} onChange={(event) => updateForm('summary', event.target.value)} />
      </Field>
    )}
    {fieldConfig.showBody && (
      <Field label='Detailed body'>
        <Textarea rows={5} value={form.body} onChange={(event) => updateForm('body', event.target.value)} />
      </Field>
    )}
    <div className='grid gap-4 sm:grid-cols-3'>
      {fieldConfig.showCategory && (
        <Field label={fieldConfig.categoryLabel}>
          <Input value={form.category} onChange={(event) => updateForm('category', event.target.value)} />
        </Field>
      )}
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
      {fieldConfig.showPublishDate && (
        <Field label='Publish date'>
          <Input type='date' value={form.publishDate} onChange={(event) => updateForm('publishDate', event.target.value)} />
        </Field>
      )}
    </div>
    {fieldConfig.showMedia && (
      <div className='grid gap-4 sm:grid-cols-2'>
        <UploadField
          label={fieldConfig.mediaLabel}
          value={form.mediaUrl}
          onChange={(url) => updateForm('mediaUrl', url)}
          folder={`content/${type}`}
          accept='image/*,.pdf'
          placeholder={mediaGuidance.placeholder}
          hint={mediaGuidance.hint}
        />
      </div>
    )}
    {metadataFields.length > 0 && (
      <div className='space-y-3 rounded-xl border border-dashed border-slate-200 p-4'>
        <p className='text-sm font-semibold text-slate-800'>Additional metadata</p>
        <div className='grid gap-4 sm:grid-cols-2'>
          {metadataFields.map((field) => {
            const value = form.metadata[field.key]
            return (
              <Field key={field.key} label={field.label}>
                <Input
                  value={typeof value === 'string' ? value : ''}
                  placeholder={field.placeholder}
                  onChange={(event) => updateMetadata(field.key, event.target.value)}
                />
              </Field>
            )
          })}
        </div>
      </div>
    )}
  </div>
)

const NewsForm = ({ form, type, updateForm, updateMetadata }: BaseFormProps) => {
  const author = typeof form.metadata.author === 'string' ? form.metadata.author : ''
  const readingTime = typeof form.metadata.readingTime === 'string' ? form.metadata.readingTime : ''
  const ctaLabel = typeof form.metadata.ctaLabel === 'string' ? form.metadata.ctaLabel : ''
  const ctaHref = typeof form.metadata.ctaHref === 'string' ? form.metadata.ctaHref : ''
  const gallery = Array.isArray(form.metadata.gallery)
    ? form.metadata.gallery.filter((item): item is string => typeof item === 'string')
    : []

  const categoryOptions = ['', 'Announcement', 'Event', 'Testimony', 'Press']

  return (
    <div className='space-y-5'>
      <SectionCard
        title='Story basics'
        description='Define the essentials that appear on the homepage cards and newsletters.'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Title *'>
            <Input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />
          </Field>
          <Field label='Slug'>
            <Input value={form.slug} onChange={(event) => updateForm('slug', slugify(event.target.value))} />
          </Field>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <Field label='Status'>
            <select
              className='h-10 w-full rounded-lg border border-slate-200 px-3 text-sm'
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
          <Field label='Tag / category'>
            <select
              className='h-10 w-full rounded-lg border border-slate-200 px-3 text-sm capitalize'
              value={form.category}
              onChange={(event) => updateForm('category', event.target.value)}>
              {categoryOptions.map((option) => (
                <option key={option || 'default'} value={option}>
                  {option ? option : 'Select tag'}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title='Editorial copy' description='Craft the short deck and detailed narrative for this update.'>
        <Field label='Short summary'>
          <Textarea
            rows={3}
            value={form.summary}
            maxLength={300}
            placeholder='One or two sentences that explain the highlight.'
            onChange={(event) => updateForm('summary', event.target.value)}
          />
        </Field>
        <Field label='Full story'>
          <Textarea
            rows={6}
            value={form.body}
            placeholder='Add the main article content, testimonies, or bullet points.'
            onChange={(event) => updateForm('body', event.target.value)}
          />
        </Field>
      </SectionCard>

      <SectionCard title='Attribution & actions' description='Credit the author and drive readers to next steps.'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Author / source'>
            <Input value={author} placeholder='DMRC Communications Team' onChange={(event) => updateMetadata('author', event.target.value)} />
          </Field>
          <Field label='Reading time'>
            <Input value={readingTime} placeholder='4 min read' onChange={(event) => updateMetadata('readingTime', event.target.value)} />
          </Field>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='CTA label'>
            <Input
              value={ctaLabel}
              placeholder='Read full story'
              onChange={(event) => updateMetadata('ctaLabel', event.target.value)}
            />
          </Field>
          <Field label='CTA link'>
            <Input
              type='url'
              value={ctaHref}
              placeholder='https://example.org/news/...'
              onChange={(event) => updateMetadata('ctaHref', event.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title='Media & gallery' description='Highlight a hero image and optional supporting gallery.'>
        <UploadField
          label='Hero image'
          value={form.mediaUrl}
          onChange={(url) => updateForm('mediaUrl', url)}
          folder={`content/${type}`}
          accept='image/*'
          placeholder='Hero image · 1500×1000px'
          hint='Use a 3:2 hero (≈1500×1000 px) for homepage cards and article headers.'
        />
        <MultiImageUpload
          label='Supporting gallery'
          values={gallery}
          onChange={(urls) => updateMetadata('gallery', urls)}
          folder={`content/${type}/gallery`}
          hint='Optional. Upload up to six images that can be used across the site.'
        />
      </SectionCard>
    </div>
  )
}

const EventsForm = ({ form, type, updateForm, updateMetadata }: BaseFormProps) => {
  const startDate = typeof form.metadata.startDate === 'string' ? form.metadata.startDate : ''
  const startTime = typeof form.metadata.startTime === 'string' ? form.metadata.startTime : ''
  const endDate = typeof form.metadata.endDate === 'string' ? form.metadata.endDate : ''
  const endTime = typeof form.metadata.endTime === 'string' ? form.metadata.endTime : ''
  const location = typeof form.metadata.location === 'string' ? form.metadata.location : ''
  const timezone = typeof form.metadata.timezone === 'string' ? form.metadata.timezone : ''
  const ctaLabel = typeof form.metadata.ctaLabel === 'string' ? form.metadata.ctaLabel : ''
  const ctaHref = typeof form.metadata.ctaHref === 'string' ? form.metadata.ctaHref : ''
  const contactEmail = typeof form.metadata.contactEmail === 'string' ? form.metadata.contactEmail : ''
  const contactPhone = typeof form.metadata.contactPhone === 'string' ? form.metadata.contactPhone : ''

  return (
    <div className='space-y-5'>
      <SectionCard title='Event overview' description='Give the event a clear identity and publishing status.'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Title *'>
            <Input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />
          </Field>
          <Field label='Slug'>
            <Input value={form.slug} onChange={(event) => updateForm('slug', slugify(event.target.value))} />
          </Field>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <Field label='Status'>
            <select
              className='h-10 w-full rounded-lg border border-slate-200 px-3 text-sm'
              value={form.status}
              onChange={(event) => updateForm('status', event.target.value as ContentForm['status'])}>
              <option value='draft'>Draft</option>
              <option value='published'>Published</option>
              <option value='scheduled'>Scheduled</option>
            </select>
          </Field>
          <Field label='Category / type'>
            <Input
              value={form.category}
              placeholder='Prayer vigil, leadership summit…'
              onChange={(event) => updateForm('category', event.target.value)}
            />
          </Field>
          <Field label='Publish date'>
            <Input type='date' value={form.publishDate} onChange={(event) => updateForm('publishDate', event.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title='Schedule' description='Capture the exact dates and times that guests should remember.'>
        <div className='grid gap-4 lg:grid-cols-4'>
          <Field label='Start date'>
            <Input type='date' value={startDate} onChange={(event) => updateMetadata('startDate', event.target.value)} />
          </Field>
          <Field label='Start time'>
            <Input type='time' value={startTime} onChange={(event) => updateMetadata('startTime', event.target.value)} />
          </Field>
          <Field label='End date'>
            <Input type='date' value={endDate} onChange={(event) => updateMetadata('endDate', event.target.value)} />
          </Field>
          <Field label='End time'>
            <Input type='time' value={endTime} onChange={(event) => updateMetadata('endTime', event.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title='Logistics' description='Help guests know where to be and whom to contact.'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Location'>
            <Input
              value={location}
              placeholder='DMRC Main Sanctuary / City, Country'
              onChange={(event) => updateMetadata('location', event.target.value)}
            />
          </Field>
          <Field label='Timezone / city'>
            <Input value={timezone} placeholder='GMT+3 · Dar es Salaam' onChange={(event) => updateMetadata('timezone', event.target.value)} />
          </Field>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Contact email'>
            <Input type='email' value={contactEmail} placeholder='events@dmrc.org' onChange={(event) => updateMetadata('contactEmail', event.target.value)} />
          </Field>
          <Field label='Contact phone'>
            <Input value={contactPhone} placeholder='+255 700 000 000' onChange={(event) => updateMetadata('contactPhone', event.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title='Description' description='Share the invitation copy that appears online.'>
        <Field label='Short summary'>
          <Textarea
            rows={3}
            value={form.summary}
            placeholder='One paragraph overview for cards and previews.'
            onChange={(event) => updateForm('summary', event.target.value)}
          />
        </Field>
        <Field label='Detailed description'>
          <Textarea
            rows={5}
            value={form.body}
            placeholder='Agenda, ministry schedule, or speaker highlights.'
            onChange={(event) => updateForm('body', event.target.value)}
          />
        </Field>
      </SectionCard>

      <SectionCard title='Call to action' description='Guide visitors to register or learn more.'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='CTA label'>
            <Input value={ctaLabel} placeholder='Reserve seat' onChange={(event) => updateMetadata('ctaLabel', event.target.value)} />
          </Field>
          <Field label='CTA link'>
            <Input
              type='url'
              value={ctaHref}
              placeholder='https://dmrc.org/events/registration'
              onChange={(event) => updateMetadata('ctaHref', event.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title='Hero media' description='Upload the banner that will appear on cards and highlights.'>
        <UploadField
          label='Hero image'
          value={form.mediaUrl}
          onChange={(url) => updateForm('mediaUrl', url)}
          folder={`content/${type}`}
          accept='image/*'
          placeholder='Event banner · 1400×900px'
          hint='Landscape (≈1400×900 px) keeps event promos sharp on the homepage.'
        />
      </SectionCard>
    </div>
  )
}

const SectionCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <div className='rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm'>
    <div className='mb-4 space-y-1'>
      <p className='text-sm font-semibold text-slate-900'>{title}</p>
      {description ? <p className='text-xs text-slate-500'>{description}</p> : null}
    </div>
    <div className='space-y-4'>{children}</div>
  </div>
)

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

