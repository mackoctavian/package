'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Loader2, Plus, PencilLine, Trash2, Image as ImageIcon, 
  Quote, Users, Link2, GripVertical, Eye, EyeOff, Star,
  LayoutDashboard, ArrowUpDown, ExternalLink
} from 'lucide-react'
import Image from 'next/image'

import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Switch } from '@/app/components/ui/switch'
import { cn } from '@/lib/utils'

type HeroSlide = {
  id: string
  title?: string | null
  subtitle?: string | null
  imageUrl: string
  linkUrl?: string | null
  linkText?: string | null
  order: number
  isActive: boolean
}

type Patron = {
  id: string
  name: string
  title: string
  role?: string | null
  imageUrl: string
  bio?: string | null
  order: number
  isActive: boolean
}

type Testimonial = {
  id: string
  name: string
  role: string
  imageUrl: string
  quote: string
  rating: number
  order: number
  isActive: boolean
}

type QuickLink = {
  id: string
  title: string
  imageUrl: string
  href?: string | null
  parentId?: string | null
  order: number
  isActive: boolean
  children?: QuickLink[]
}

type SectionType = 'hero' | 'patrons' | 'testimonials' | 'quickLinks'

export default function HomepageCMSPage() {
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<SectionType>('hero')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Fetch all data
  const heroQuery = useQuery({
    queryKey: ['homepage', 'hero'],
    queryFn: async () => {
      const res = await fetch('/api/homepage/hero')
      const data = await res.json()
      return data.data as HeroSlide[]
    },
  })

  const patronsQuery = useQuery({
    queryKey: ['homepage', 'patrons'],
    queryFn: async () => {
      const res = await fetch('/api/homepage/patrons')
      const data = await res.json()
      return data.data as Patron[]
    },
  })

  const testimonialsQuery = useQuery({
    queryKey: ['homepage', 'testimonials'],
    queryFn: async () => {
      const res = await fetch('/api/homepage/testimonials')
      const data = await res.json()
      return data.data as Testimonial[]
    },
  })

  const quickLinksQuery = useQuery({
    queryKey: ['homepage', 'quickLinks'],
    queryFn: async () => {
      const res = await fetch('/api/homepage/quick-links')
      const data = await res.json()
      return data.data as QuickLink[]
    },
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ section, data }: { section: SectionType; data: any }) => {
      const endpoints = {
        hero: '/api/homepage/hero',
        patrons: '/api/homepage/patrons',
        testimonials: '/api/homepage/testimonials',
        quickLinks: '/api/homepage/quick-links',
      }
      const res = await fetch(endpoints[section], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: (_, { section }) => {
      queryClient.invalidateQueries({ queryKey: ['homepage', section] })
      setIsDialogOpen(false)
      setEditingItem(null)
      toastSuccess('Item created successfully')
    },
    onError: () => toastError('Failed to create item'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ section, id, data }: { section: SectionType; id: string; data: any }) => {
      const endpoints = {
        hero: `/api/homepage/hero/${id}`,
        patrons: `/api/homepage/patrons/${id}`,
        testimonials: `/api/homepage/testimonials/${id}`,
        quickLinks: `/api/homepage/quick-links/${id}`,
      }
      const res = await fetch(endpoints[section], {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: (_, { section }) => {
      queryClient.invalidateQueries({ queryKey: ['homepage', section] })
      setIsDialogOpen(false)
      setEditingItem(null)
      toastSuccess('Item updated successfully')
    },
    onError: () => toastError('Failed to update item'),
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ section, id }: { section: SectionType; id: string }) => {
      const endpoints = {
        hero: `/api/homepage/hero/${id}`,
        patrons: `/api/homepage/patrons/${id}`,
        testimonials: `/api/homepage/testimonials/${id}`,
        quickLinks: `/api/homepage/quick-links/${id}`,
      }
      const res = await fetch(endpoints[section], { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: (_, { section }) => {
      queryClient.invalidateQueries({ queryKey: ['homepage', section] })
      setIsDeleteOpen(false)
      setDeleteId(null)
      toastSuccess('Item deleted successfully')
    },
    onError: () => toastError('Failed to delete item'),
  })

  const handleCreate = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const handleSave = (data: any) => {
    if (editingItem?.id) {
      updateMutation.mutate({ section: activeSection, id: editingItem.id, data })
    } else {
      createMutation.mutate({ section: activeSection, data })
    }
  }

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ section: activeSection, id: deleteId })
    }
  }

  const sections = [
    { id: 'hero' as SectionType, label: 'Hero Carousel', icon: ImageIcon, count: heroQuery.data?.length ?? 0 },
    { id: 'patrons' as SectionType, label: 'Leadership/Patrons', icon: Users, count: patronsQuery.data?.length ?? 0 },
    { id: 'testimonials' as SectionType, label: 'Testimonials', icon: Quote, count: testimonialsQuery.data?.length ?? 0 },
    { id: 'quickLinks' as SectionType, label: 'Quick Links', icon: Link2, count: quickLinksQuery.data?.length ?? 0 },
  ]

  const getItems = () => {
    switch (activeSection) {
      case 'hero': return heroQuery.data ?? []
      case 'patrons': return patronsQuery.data ?? []
      case 'testimonials': return testimonialsQuery.data ?? []
      case 'quickLinks': return (quickLinksQuery.data ?? []).filter(l => !l.parentId)
      default: return []
    }
  }

  const isLoading = heroQuery.isLoading || patronsQuery.isLoading || testimonialsQuery.isLoading || quickLinksQuery.isLoading
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className='px-6 py-8 space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-blue-600'>Content Management</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Homepage CMS</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>
            Manage the content displayed on the homepage including hero carousel, leadership section, testimonials, and quick navigation links.
          </p>
        </div>
        <Button className='gap-2 bg-blue-600 hover:bg-blue-700' onClick={handleCreate}>
          <Plus className='h-4 w-4' /> Add New
        </Button>
      </div>

      {/* Section Tabs */}
      <div className='flex flex-wrap gap-3'>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all font-medium',
              activeSection === section.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <section.icon className='w-5 h-5' />
            <span>{section.label}</span>
            <Badge variant='secondary' className='ml-1'>{section.count}</Badge>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {sections.find(s => s.id === activeSection)?.icon && (
              <span className='p-2 rounded-lg bg-blue-100 text-blue-600'>
                {(() => {
                  const Icon = sections.find(s => s.id === activeSection)?.icon
                  return Icon ? <Icon className='w-5 h-5' /> : null
                })()}
              </span>
            )}
            {sections.find(s => s.id === activeSection)?.label}
          </CardTitle>
          <CardDescription>
            {activeSection === 'hero' && 'Manage the rotating images in the hero carousel at the top of the homepage.'}
            {activeSection === 'patrons' && 'Update the leadership and patrons displayed in the "Faithful Shepherds" section.'}
            {activeSection === 'testimonials' && 'Curate testimonials that appear in the "Stories of Transformation" section.'}
            {activeSection === 'quickLinks' && 'Configure the quick navigation cards in the "Explore" section.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-48 items-center justify-center'>
              <Loader2 className='h-6 w-6 animate-spin text-slate-400' />
            </div>
          ) : getItems().length === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-4 text-center'>
              <div className='w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center'>
                {(() => {
                  const Icon = sections.find(s => s.id === activeSection)?.icon
                  return Icon ? <Icon className='w-8 h-8 text-slate-400' /> : null
                })()}
              </div>
              <p className='text-slate-500'>No items yet. Create your first one.</p>
              <Button onClick={handleCreate}>
                <Plus className='h-4 w-4 mr-2' /> Add First Item
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {getItems().map((item: any) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  section={activeSection}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
            <DialogDescription>
              {activeSection === 'hero' && 'Add or update a hero carousel slide.'}
              {activeSection === 'patrons' && 'Add or update a patron/leader profile.'}
              {activeSection === 'testimonials' && 'Add or update a testimonial.'}
              {activeSection === 'quickLinks' && 'Add or update a quick navigation link.'}
            </DialogDescription>
          </DialogHeader>
          
          <ItemForm
            section={activeSection}
            initialData={editingItem}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The item will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant='destructive' onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <Trash2 className='h-4 w-4 mr-2' />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Item Card Component
function ItemCard({ item, section, onEdit, onDelete }: { item: any; section: SectionType; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className='group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all'>
      {/* Preview Image */}
      <div className='relative aspect-video bg-slate-100'>
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.title || item.name || 'Preview'}
            fill
            className='object-cover'
          />
        )}
        
        {/* Status Badge */}
        <div className='absolute top-2 left-2'>
          {item.isActive ? (
            <Badge className='bg-green-500 text-white gap-1'>
              <Eye className='w-3 h-3' /> Active
            </Badge>
          ) : (
            <Badge variant='secondary' className='gap-1'>
              <EyeOff className='w-3 h-3' /> Hidden
            </Badge>
          )}
        </div>

        {/* Order Badge */}
        <div className='absolute top-2 right-2'>
          <Badge variant='outline' className='bg-white/90 gap-1'>
            <ArrowUpDown className='w-3 h-3' /> {item.order}
          </Badge>
        </div>

        {/* Hover Actions */}
        <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
          <Button size='sm' variant='secondary' onClick={onEdit}>
            <PencilLine className='h-4 w-4 mr-1' /> Edit
          </Button>
          <Button size='sm' variant='destructive' onClick={onDelete}>
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='p-4'>
        {section === 'hero' && (
          <>
            <h3 className='font-semibold text-slate-900 truncate'>{item.title || 'Untitled Slide'}</h3>
            {item.subtitle && <p className='text-sm text-slate-500 truncate'>{item.subtitle}</p>}
            {item.linkUrl && (
              <a href={item.linkUrl} className='text-xs text-blue-600 flex items-center gap-1 mt-1'>
                <ExternalLink className='w-3 h-3' /> {item.linkText || 'Learn More'}
              </a>
            )}
          </>
        )}
        {section === 'patrons' && (
          <>
            <h3 className='font-semibold text-slate-900 truncate'>{item.name}</h3>
            <p className='text-sm text-blue-600'>{item.title}</p>
            {item.role && <p className='text-xs text-slate-500 truncate mt-1'>{item.role}</p>}
          </>
        )}
        {section === 'testimonials' && (
          <>
            <div className='flex items-center gap-1 mb-2'>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn('w-3 h-3', i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200')} />
              ))}
            </div>
            <h3 className='font-semibold text-slate-900 truncate'>{item.name}</h3>
            <p className='text-sm text-slate-500'>{item.role}</p>
            <p className='text-xs text-slate-600 line-clamp-2 mt-2 italic'>"{item.quote}"</p>
          </>
        )}
        {section === 'quickLinks' && (
          <>
            <h3 className='font-semibold text-slate-900 truncate'>{item.title}</h3>
            {item.href && (
              <a href={item.href} className='text-xs text-blue-600 flex items-center gap-1'>
                <Link2 className='w-3 h-3' /> {item.href}
              </a>
            )}
            {item.children?.length > 0 && (
              <p className='text-xs text-slate-500 mt-1'>{item.children.length} sub-items</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Item Form Component
function ItemForm({ section, initialData, onSave, onCancel, isSaving }: {
  section: SectionType
  initialData: any
  onSave: (data: any) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [formData, setFormData] = useState(initialData || getDefaultData(section))

  const update = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {section === 'hero' && (
        <>
          <Field label='Image URL *'>
            <Input value={formData.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder='https://example.com/image.jpg' required />
          </Field>
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Title (optional)'>
              <Input value={formData.title || ''} onChange={(e) => update('title', e.target.value)} placeholder='Slide title' />
            </Field>
            <Field label='Subtitle (optional)'>
              <Input value={formData.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} placeholder='Slide subtitle' />
            </Field>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Link URL (optional)'>
              <Input value={formData.linkUrl || ''} onChange={(e) => update('linkUrl', e.target.value)} placeholder='/retreats' />
            </Field>
            <Field label='Link Text (optional)'>
              <Input value={formData.linkText || ''} onChange={(e) => update('linkText', e.target.value)} placeholder='Learn More' />
            </Field>
          </div>
        </>
      )}

      {section === 'patrons' && (
        <>
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Name *'>
              <Input value={formData.name || ''} onChange={(e) => update('name', e.target.value)} placeholder='Fr. John Smith' required />
            </Field>
            <Field label='Title *'>
              <Input value={formData.title || ''} onChange={(e) => update('title', e.target.value)} placeholder='Mission Director' required />
            </Field>
          </div>
          <Field label='Role/Description'>
            <Input value={formData.role || ''} onChange={(e) => update('role', e.target.value)} placeholder='Oversees regional missions and supports parish outreach teams.' />
          </Field>
          <Field label='Image URL *'>
            <Input value={formData.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder='https://example.com/photo.jpg' required />
          </Field>
          <Field label='Bio (optional)'>
            <Textarea value={formData.bio || ''} onChange={(e) => update('bio', e.target.value)} placeholder='Extended biography...' rows={3} />
          </Field>
        </>
      )}

      {section === 'testimonials' && (
        <>
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Name *'>
              <Input value={formData.name || ''} onChange={(e) => update('name', e.target.value)} placeholder='Maria Josephat' required />
            </Field>
            <Field label='Role *'>
              <Input value={formData.role || ''} onChange={(e) => update('role', e.target.value)} placeholder='Youth Retreat Participant' required />
            </Field>
          </div>
          <Field label='Image URL *'>
            <Input value={formData.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder='https://example.com/photo.jpg' required />
          </Field>
          <Field label='Quote *'>
            <Textarea value={formData.quote || ''} onChange={(e) => update('quote', e.target.value)} placeholder='Their testimonial quote...' rows={4} required />
          </Field>
          <Field label='Rating'>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => update('rating', star)}
                  className='p-1'
                >
                  <Star className={cn('w-6 h-6 transition-colors', star <= (formData.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200')} />
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      {section === 'quickLinks' && (
        <>
          <Field label='Title *'>
            <Input value={formData.title || ''} onChange={(e) => update('title', e.target.value)} placeholder='Retreats' required />
          </Field>
          <Field label='Image URL *'>
            <Input value={formData.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder='https://example.com/image.jpg' required />
          </Field>
          <Field label='Link URL (optional)'>
            <Input value={formData.href || ''} onChange={(e) => update('href', e.target.value)} placeholder='/retreats' />
          </Field>
        </>
      )}

      {/* Common Fields */}
      <div className='grid grid-cols-2 gap-4'>
        <Field label='Display Order'>
          <Input type='number' value={formData.order ?? 0} onChange={(e) => update('order', parseInt(e.target.value) || 0)} />
        </Field>
        <Field label='Active'>
          <div className='flex items-center gap-3 h-10'>
            <Switch checked={formData.isActive ?? true} onCheckedChange={(checked) => update('isActive', checked)} />
            <span className='text-sm text-slate-600'>{formData.isActive ? 'Visible on site' : 'Hidden from site'}</span>
          </div>
        </Field>
      </div>

      <DialogFooter>
        <Button type='button' variant='ghost' onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button type='submit' disabled={isSaving} className='bg-blue-600 hover:bg-blue-700'>
          {isSaving ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <PencilLine className='h-4 w-4 mr-2' />}
          {initialData ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-slate-700'>{label}</Label>
      {children}
    </div>
  )
}

function getDefaultData(section: SectionType) {
  switch (section) {
    case 'hero':
      return { imageUrl: '', title: '', subtitle: '', linkUrl: '', linkText: '', order: 0, isActive: true }
    case 'patrons':
      return { name: '', title: '', role: '', imageUrl: '', bio: '', order: 0, isActive: true }
    case 'testimonials':
      return { name: '', role: '', imageUrl: '', quote: '', rating: 5, order: 0, isActive: true }
    case 'quickLinks':
      return { title: '', imageUrl: '', href: '', order: 0, isActive: true }
  }
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

