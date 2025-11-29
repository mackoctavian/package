'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Loader2, PencilLine, Plus, Trash2, ImageIcon, Film, 
  Headphones, Disc3, Upload, X, Eye, Music, Clock, User
} from 'lucide-react'
import Image from 'next/image'

import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { cn } from '@/lib/utils'

type MediaType = 'image' | 'video' | 'audio' | 'cd'

type GalleryRecord = {
  id: string
  title: string
  slug: string
  summary?: string | null
  category?: string | null
  status: string
  mediaUrl?: string | null
  publishDate?: string | null
  body?: string | null
  metadata?: {
    mediaType?: MediaType
    orientation?: string
    duration?: string
    artist?: string
    album?: string
    coverArt?: string
    poster?: string
  } | null
  createdAt?: string
}

type GalleryForm = {
  id?: string
  title: string
  slug: string
  summary: string
  category: string
  status: 'draft' | 'published' | 'scheduled'
  mediaUrl: string
  publishDate: string
  body: string
  metadata: {
    mediaType: MediaType
    orientation: string
    duration: string
    artist: string
    album: string
    coverArt: string
    poster: string
  }
}

const emptyForm: GalleryForm = {
  title: '',
  slug: '',
  summary: '',
  category: '',
  status: 'draft',
  mediaUrl: '',
  publishDate: '',
  body: '',
  metadata: {
    mediaType: 'image',
    orientation: 'landscape',
    duration: '',
    artist: '',
    album: '',
    coverArt: '',
    poster: '',
  },
}

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  published: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-amber-100 text-amber-700',
}

const mediaTypeConfig = {
  image: { icon: ImageIcon, label: 'Photos', color: 'bg-blue-500' },
  video: { icon: Film, label: 'Videos', color: 'bg-purple-500' },
  audio: { icon: Headphones, label: 'Audio', color: 'bg-amber-500' },
  cd: { icon: Disc3, label: 'CDs', color: 'bg-rose-500' },
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function GalleryAdminPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<GalleryForm>(emptyForm)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MediaType | 'all'>('all')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['content', 'gallery'],
    queryFn: async (): Promise<GalleryRecord[]> => {
      const response = await fetch('/api/content/gallery')
      if (!response.ok) throw new Error('Unable to load gallery items.')
      const payload = await response.json()
      return payload.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: GalleryForm) => {
      const response = await fetch('/api/content/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizePayload(payload)),
      })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to create gallery item')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Gallery item created')
      queryClient.invalidateQueries({ queryKey: ['content', 'gallery'] })
      closeEditor()
    },
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: GalleryForm) => {
      if (!payload.id) throw new Error('Missing identifier')
      const response = await fetch(`/api/content/gallery/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizePayload(payload)),
      })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to update gallery item')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Gallery item updated')
      queryClient.invalidateQueries({ queryKey: ['content', 'gallery'] })
      closeEditor()
    },
    onError: handleError,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content/gallery/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to delete gallery item')
      }
      return response.json()
    },
    onSuccess: () => {
      toastSuccess('Gallery item removed')
      queryClient.invalidateQueries({ queryKey: ['content', 'gallery'] })
      setIsDeleteOpen(false)
      setDeleteId(null)
    },
    onError: handleError,
  })

  // Filter items by media type
  const filteredItems = useMemo(() => {
    const items = listQuery.data ?? []
    if (activeTab === 'all') return items
    return items.filter((item) => item.metadata?.mediaType === activeTab)
  }, [listQuery.data, activeTab])

  // Stats by media type
  const stats = useMemo(() => {
    const items = listQuery.data ?? []
    return {
      total: items.length,
      image: items.filter((item) => item.metadata?.mediaType === 'image').length,
      video: items.filter((item) => item.metadata?.mediaType === 'video').length,
      audio: items.filter((item) => item.metadata?.mediaType === 'audio').length,
      cd: items.filter((item) => item.metadata?.mediaType === 'cd').length,
      published: items.filter((item) => item.status === 'published').length,
      draft: items.filter((item) => item.status === 'draft').length,
    }
  }, [listQuery.data])

  const handleEdit = (record?: GalleryRecord) => {
    if (!record) {
      setForm({ ...emptyForm, metadata: { ...emptyForm.metadata, mediaType: activeTab === 'all' ? 'image' : activeTab } })
    } else {
      setForm({
        id: record.id,
        title: record.title,
        slug: record.slug,
        summary: record.summary ?? '',
        category: record.category ?? '',
        status: (record.status as GalleryForm['status']) || 'draft',
        mediaUrl: record.mediaUrl ?? '',
        publishDate: record.publishDate ? record.publishDate.slice(0, 10) : '',
        body: record.body ?? '',
        metadata: {
          mediaType: (record.metadata?.mediaType as MediaType) || 'image',
          orientation: record.metadata?.orientation ?? 'landscape',
          duration: record.metadata?.duration ?? '',
          artist: record.metadata?.artist ?? '',
          album: record.metadata?.album ?? '',
          coverArt: record.metadata?.coverArt ?? '',
          poster: record.metadata?.poster ?? '',
        },
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

  const handleDelete = (record: GalleryRecord) => {
    setDeleteId(record.id)
    setIsDeleteOpen(true)
  }

  const updateForm = <K extends keyof GalleryForm>(key: K, value: GalleryForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateMetadata = <K extends keyof GalleryForm['metadata']>(key: K, value: GalleryForm['metadata'][K]) => {
    setForm((prev) => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }))
  }

  const normalizePayload = (payload: GalleryForm) => ({
    title: payload.title,
    slug: payload.slug || slugify(payload.title),
    summary: payload.summary,
    category: payload.category,
    status: payload.status,
    mediaUrl: payload.mediaUrl,
    publishDate: payload.publishDate ? new Date(payload.publishDate).toISOString() : null,
    body: payload.body,
    metadata: payload.metadata,
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const tabs = [
    { id: 'all' as const, label: 'All Media', count: stats.total, icon: Eye },
    { id: 'image' as const, label: 'Photos', count: stats.image, icon: ImageIcon },
    { id: 'video' as const, label: 'Videos', count: stats.video, icon: Film },
    { id: 'audio' as const, label: 'Audio', count: stats.audio, icon: Headphones },
    { id: 'cd' as const, label: 'CDs', count: stats.cd, icon: Disc3 },
  ]

  return (
    <div className='px-6 py-8 space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-amber-600'>Media Management</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Gallery Dashboard</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>
            Manage all gallery media including photos, videos, audio recordings, and CDs. Only administrators can add or modify content.
          </p>
        </div>
        <Button className='gap-2 bg-amber-600 hover:bg-amber-700' onClick={() => handleEdit()}>
          <Plus className='h-4 w-4' /> Add Media
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {tabs.map((tab) => (
          <Card 
            key={tab.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              activeTab === tab.id && 'ring-2 ring-amber-500'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardDescription className='flex items-center gap-2'>
                  <tab.icon className='w-4 h-4' />
                  {tab.label}
                </CardDescription>
                {tab.id !== 'all' && (
                  <div className={cn('w-2 h-2 rounded-full', mediaTypeConfig[tab.id].color)} />
                )}
              </div>
              <CardTitle className='text-3xl'>{tab.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className='grid gap-4 sm:grid-cols-2'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Published</CardDescription>
            <CardTitle className='text-2xl text-emerald-600'>{stats.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Drafts</CardDescription>
            <CardTitle className='text-2xl text-zinc-500'>{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Gallery Items Grid */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-lg'>
                {activeTab === 'all' ? 'All Media' : mediaTypeConfig[activeTab].label}
              </CardTitle>
              <CardDescription>
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} in gallery
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Loading gallery items…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500'>
              <div className='w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2'>
                {activeTab === 'all' ? (
                  <ImageIcon className='w-8 h-8 text-slate-400' />
                ) : (
                  (() => {
                    const Icon = mediaTypeConfig[activeTab].icon
                    return <Icon className='w-8 h-8 text-slate-400' />
                  })()
                )}
              </div>
              <p>No {activeTab === 'all' ? 'media items' : mediaTypeConfig[activeTab].label.toLowerCase()} yet.</p>
              <Button size='sm' onClick={() => handleEdit()}>
                Add {activeTab === 'all' ? 'Media' : mediaTypeConfig[activeTab].label.slice(0, -1)}
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {filteredItems.map((record) => {
                const mediaType = (record.metadata?.mediaType as MediaType) || 'image'
                const config = mediaTypeConfig[mediaType]
                const Icon = config.icon

                return (
                  <div
                    key={record.id}
                    className='group relative bg-slate-50 rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 transition-all'
                  >
                    {/* Media Preview */}
                    <div className='relative aspect-square bg-slate-200'>
                      {record.mediaUrl || record.metadata?.coverArt || record.metadata?.poster ? (
                        <Image
                          src={record.metadata?.coverArt || record.metadata?.poster || record.mediaUrl || ''}
                          alt={record.title}
                          fill
                          className='object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <Icon className='w-12 h-12 text-slate-300' />
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <div className={cn('absolute top-2 left-2 px-2 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1', config.color)}>
                        <Icon className='w-3 h-3' />
                        {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                      </div>

                      {/* Status Badge */}
                      <Badge className={cn('absolute top-2 right-2 capitalize', statusColors[record.status] ?? 'bg-slate-100 text-slate-600')}>
                        {record.status}
                      </Badge>

                      {/* Hover Actions */}
                      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100'>
                        <Button
                          variant='secondary'
                          size='icon'
                          className='rounded-full'
                          onClick={() => handleEdit(record)}
                        >
                          <PencilLine className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='destructive'
                          size='icon'
                          className='rounded-full'
                          onClick={() => handleDelete(record)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className='p-3'>
                      <h3 className='font-semibold text-slate-900 truncate text-sm'>{record.title}</h3>
                      <p className='text-xs text-slate-500 truncate mt-0.5'>
                        {record.metadata?.artist || record.category || 'No category'}
                      </p>
                      {record.metadata?.duration && (
                        <p className='text-xs text-slate-400 mt-1 flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          {record.metadata.duration}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeEditor() : setIsDialogOpen(true))}>
        <DialogContent className='max-h-[90vh] overflow-y-auto max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Gallery Item' : 'Add New Media'}</DialogTitle>
            <DialogDescription>
              {form.id ? 'Update the details for this gallery item.' : 'Add a new photo, video, audio, or CD to the gallery.'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Media Type Selection */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Media Type</Label>
              <div className='grid grid-cols-4 gap-2'>
                {(['image', 'video', 'audio', 'cd'] as MediaType[]).map((type) => {
                  const config = mediaTypeConfig[type]
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      type='button'
                      onClick={() => updateMetadata('mediaType', type)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        form.metadata.mediaType === type
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      )}
                    >
                      <Icon className='w-6 h-6' />
                      <span className='text-xs font-medium'>{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Basic Info */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Title *'>
                <Input 
                  value={form.title} 
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder='Enter title...'
                />
              </Field>
              <Field label='Slug'>
                <Input 
                  value={form.slug} 
                  onChange={(e) => updateForm('slug', slugify(e.target.value))}
                  placeholder='auto-generated-from-title'
                />
              </Field>
            </div>

            <Field label='Description'>
              <Textarea 
                rows={3} 
                value={form.summary} 
                onChange={(e) => updateForm('summary', e.target.value)}
                placeholder='Brief description of this media...'
              />
            </Field>

            {/* Media URL */}
            <Field label='Media URL *'>
              <Input 
                value={form.mediaUrl} 
                onChange={(e) => updateForm('mediaUrl', e.target.value)}
                placeholder={
                  form.metadata.mediaType === 'image' ? 'https://example.com/image.jpg' :
                  form.metadata.mediaType === 'video' ? 'https://example.com/video.mp4' :
                  form.metadata.mediaType === 'audio' ? '/audio/recording.mp3' :
                  '/store/cd-album'
                }
              />
            </Field>

            {/* Type-specific fields */}
            {form.metadata.mediaType === 'image' && (
              <Field label='Orientation'>
                <select
                  className='h-10 w-full rounded-lg border border-slate-200 px-3 text-sm'
                  value={form.metadata.orientation}
                  onChange={(e) => updateMetadata('orientation', e.target.value)}
                >
                  <option value='landscape'>Landscape</option>
                  <option value='portrait'>Portrait</option>
                  <option value='square'>Square</option>
                </select>
              </Field>
            )}

            {form.metadata.mediaType === 'video' && (
              <Field label='Poster/Thumbnail URL'>
                <Input 
                  value={form.metadata.poster} 
                  onChange={(e) => updateMetadata('poster', e.target.value)}
                  placeholder='https://example.com/thumbnail.jpg'
                />
              </Field>
            )}

            {(form.metadata.mediaType === 'audio' || form.metadata.mediaType === 'cd') && (
              <>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <Field label='Artist'>
                    <Input 
                      value={form.metadata.artist} 
                      onChange={(e) => updateMetadata('artist', e.target.value)}
                      placeholder='Artist or speaker name'
                    />
                  </Field>
                  {form.metadata.mediaType === 'audio' && (
                    <Field label='Duration'>
                      <Input 
                        value={form.metadata.duration} 
                        onChange={(e) => updateMetadata('duration', e.target.value)}
                        placeholder='e.g., 12:30'
                      />
                    </Field>
                  )}
                  {form.metadata.mediaType === 'cd' && (
                    <Field label='Album'>
                      <Input 
                        value={form.metadata.album} 
                        onChange={(e) => updateMetadata('album', e.target.value)}
                        placeholder='Album name'
                      />
                    </Field>
                  )}
                </div>
                <Field label='Cover Art URL'>
                  <Input 
                    value={form.metadata.coverArt} 
                    onChange={(e) => updateMetadata('coverArt', e.target.value)}
                    placeholder='https://example.com/cover.jpg'
                  />
                </Field>
              </>
            )}

            {/* Status and Category */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <Field label='Category'>
                <Input 
                  value={form.category} 
                  onChange={(e) => updateForm('category', e.target.value)}
                  placeholder='e.g., Worship, Testimony'
                />
              </Field>
              <Field label='Status'>
                <select
                  className='h-10 w-full rounded-lg border border-slate-200 px-3 text-sm'
                  value={form.status}
                  onChange={(e) => updateForm('status', e.target.value as GalleryForm['status'])}
                >
                  <option value='draft'>Draft</option>
                  <option value='published'>Published</option>
                  <option value='scheduled'>Scheduled</option>
                </select>
              </Field>
              <Field label='Publish Date'>
                <Input 
                  type='date' 
                  value={form.publishDate} 
                  onChange={(e) => updateForm('publishDate', e.target.value)} 
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button variant='ghost' onClick={closeEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className='gap-2 bg-amber-600 hover:bg-amber-700'>
              {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <PencilLine className='h-4 w-4' />}
              {form.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => (!open ? setIsDeleteOpen(false) : setIsDeleteOpen(true))}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Gallery Item</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The item will be permanently removed from the gallery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsDeleteOpen(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              className='gap-2'
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
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
