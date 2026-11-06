'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { UploadField } from '@/app/components/Admin/UploadField'
import { ModuleGate } from '@/app/components/Admin/ModuleGate'

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

type FlattenedQuickLink = QuickLink & {
  parentTitle?: string
  depth: number
}

type BrandingSettings = {
  primaryLogoUrl: string
  inverseLogoUrl?: string | null
  logoAlt?: string | null
}

const DEFAULT_BRANDING: BrandingSettings = {
  primaryLogoUrl: '/images/logo/dmrc.svg',
  inverseLogoUrl: '',
  logoAlt: 'DMRC logo',
}

const flattenQuickLinks = (nodes: QuickLink[] = [], trail: string[] = [], depth = 0): FlattenedQuickLink[] => {
  return [...nodes]
    .sort((a, b) => a.order - b.order)
    .flatMap((node) => {
      const current: FlattenedQuickLink = {
        ...node,
        parentTitle: trail[trail.length - 1],
        depth,
      }
      const children = flattenQuickLinks(node.children ?? [], [...trail, node.title], depth + 1)
      return [current, ...children]
    })
}

const findQuickLinkById = (nodes: QuickLink[] = [], id: string): QuickLink | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findQuickLinkById(node.children ?? [], id)
    if (found) return found
  }
  return undefined
}

const collectDescendantIds = (nodes: QuickLink[] = [], id: string): Set<string> => {
  const result = new Set<string>()
  const target = findQuickLinkById(nodes, id)
  if (!target) return result

  const stack = [...(target.children ?? [])]
  while (stack.length) {
    const current = stack.pop()
    if (!current) continue
    result.add(current.id)
    if (current.children?.length) {
      stack.push(...current.children)
    }
  }

  return result
}

type SectionType = 'hero' | 'patrons' | 'testimonials' | 'quickLinks' | 'branding'

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

  const brandingQuery = useQuery({
    queryKey: ['site', 'branding'],
    queryFn: async () => {
      const res = await fetch('/api/site-settings/branding')
      if (!res.ok) throw new Error('Failed to fetch branding settings')
      const data = await res.json()
      return { ...DEFAULT_BRANDING, ...(data.data ?? {}) } as BrandingSettings
    },
  })

  const quickLinksData = quickLinksQuery.data ?? []
  const quickLinksFlat = useMemo(() => flattenQuickLinks(quickLinksData), [quickLinksData])

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ section, data }: { section: SectionType; data: any }) => {
      const endpoints: Record<Exclude<SectionType, 'branding'>, string> = {
        hero: '/api/homepage/hero',
        patrons: '/api/homepage/patrons',
        testimonials: '/api/homepage/testimonials',
        quickLinks: '/api/homepage/quick-links',
      }
      const res = await fetch(endpoints[section as Exclude<SectionType, 'branding'>], {
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
      const endpoints: Record<Exclude<SectionType, 'branding'>, string> = {
        hero: `/api/homepage/hero/${id}`,
        patrons: `/api/homepage/patrons/${id}`,
        testimonials: `/api/homepage/testimonials/${id}`,
        quickLinks: `/api/homepage/quick-links/${id}`,
      }
      const res = await fetch(endpoints[section as Exclude<SectionType, 'branding'>], {
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
      const endpoints: Record<Exclude<SectionType, 'branding'>, string> = {
        hero: `/api/homepage/hero/${id}`,
        patrons: `/api/homepage/patrons/${id}`,
        testimonials: `/api/homepage/testimonials/${id}`,
        quickLinks: `/api/homepage/quick-links/${id}`,
      }
      const res = await fetch(endpoints[section as Exclude<SectionType, 'branding'>], { method: 'DELETE' })
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

  const brandingMutation = useMutation({
    mutationFn: async (payload: BrandingSettings) => {
      const res = await fetch('/api/site-settings/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update branding')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', 'branding'] })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('branding-updated'))
      }
      toastSuccess('Brand assets updated')
    },
    onError: () => toastError('Failed to update branding assets'),
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
    { id: 'quickLinks' as SectionType, label: 'Quick Links', icon: Link2, count: quickLinksFlat.length },
    { id: 'branding' as SectionType, label: 'Site Branding', icon: LayoutDashboard, count: brandingQuery.data?.primaryLogoUrl ? 1 : 0 },
  ]

  const getItems = () => {
    switch (activeSection) {
      case 'hero': return heroQuery.data ?? []
      case 'patrons': return patronsQuery.data ?? []
      case 'testimonials': return testimonialsQuery.data ?? []
      case 'quickLinks': return quickLinksFlat
      case 'branding': return []
      default: return []
    }
  }

  const listIsLoading = heroQuery.isLoading || patronsQuery.isLoading || testimonialsQuery.isLoading || quickLinksQuery.isLoading
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <ModuleGate moduleId='homepage'>
      <div className='px-6 py-8 space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-blue-600'>Content Management</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Homepage CMS</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>
            Manage the content displayed on the homepage including hero carousel, leadership section, testimonials, quick navigation links,
            and global branding assets.
          </p>
        </div>
        {activeSection !== 'branding' && (
          <Button className='gap-2 bg-blue-600 hover:bg-blue-700' onClick={handleCreate}>
            <Plus className='h-4 w-4' /> Add New
          </Button>
        )}
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
            {activeSection === 'branding' && 'Upload and preview the site logos used for the header, footer, and transactional surfaces.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSection === 'branding' ? (
            <BrandingSettingsCard
              data={brandingQuery.data ?? DEFAULT_BRANDING}
              isSaving={brandingMutation.isPending}
              onSave={(payload) => brandingMutation.mutate(payload)}
              showLoader={!brandingQuery.data && brandingQuery.isLoading}
            />
          ) : listIsLoading ? (
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
            quickLinks={quickLinksData}
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
    </ModuleGate>
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
            <div className='text-xs text-slate-500 mt-2 space-y-1'>
              <p>{item.parentTitle ? `Sublink of ${item.parentTitle}` : 'Top-level card'}</p>
              {item.children?.length > 0 && <p>{item.children.length} sublink(s)</p>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Item Form Component
function ItemForm({ section, initialData, onSave, onCancel, isSaving, quickLinks = [] }: {
  section: SectionType
  initialData: any
  onSave: (data: any) => void
  onCancel: () => void
  isSaving: boolean
  quickLinks?: QuickLink[]
}) {
  const [formData, setFormData] = useState(initialData || getDefaultData(section))
  const parentOptions = useMemo(() => flattenQuickLinks(quickLinks), [quickLinks])
  const descendantIds = useMemo(() => {
    if (!formData?.id) return new Set<string>()
    return collectDescendantIds(quickLinks, formData.id)
  }, [formData?.id, quickLinks])

  useEffect(() => {
    setFormData(initialData || getDefaultData(section))
  }, [initialData, section])

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
          <UploadField
            label='Image *'
            value={formData.imageUrl || ''}
            onChange={(url) => update('imageUrl', url)}
            folder='homepage/hero'
            placeholder='Paste a 1920×900 image URL or upload (max 3MB)'
            hint='Use a 1920×900 px (or larger) JPG/PNG with the subject centered. Wider files keep the hero carousel crisp.'
          />
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
          <UploadField
            label='Image *'
            value={formData.imageUrl || ''}
            onChange={(url) => update('imageUrl', url)}
            folder='homepage/patrons'
            placeholder='Square headshot · 800×800px or larger'
            hint='Upload a square 800×800 px photo with space around the shoulders for best cropping.'
          />
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
          <UploadField
            label='Image *'
            value={formData.imageUrl || ''}
            onChange={(url) => update('imageUrl', url)}
            folder='homepage/testimonials'
          placeholder='Square portrait · 600×600px'
          hint='Square 600×600 px portrait keeps the testimonial cards balanced on desktop & mobile.'
          />
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
          <UploadField
            label='Image *'
            value={formData.imageUrl || ''}
            onChange={(url) => update('imageUrl', url)}
            folder='homepage/quick-links'
          placeholder='Landscape graphic · 900×600px'
          hint='Use a 3:2 or 4:3 landscape (≈900×600 px) so grid cards stay sharp.'
          />
          <Field label='Link URL (optional)'>
            <Input value={formData.href || ''} onChange={(e) => update('href', e.target.value)} placeholder='/retreats' />
          </Field>
          <Field label='Parent link (optional)'>
            <select
              className='h-10 w-full rounded-lg border border-slate-200 px-3 text-sm'
              value={formData.parentId ?? ''}
              onChange={(e) => update('parentId', e.target.value ? e.target.value : null)}
            >
              <option value=''>Show as top-level card</option>
              {parentOptions.map((link) => {
                if (link.id === formData.id) return null
                const disabled = descendantIds.has(link.id)
                return (
                  <option key={link.id} value={link.id} disabled={disabled}>
                    {`${'— '.repeat(link.depth)}${link.title}`}
                  </option>
                )
              })}
            </select>
            <p className='text-xs text-slate-500'>Choose a parent to turn this into a sublink. Leave blank to display as a primary card.</p>
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

function BrandingSettingsCard({
  data,
  isSaving,
  onSave,
  showLoader = false,
}: {
  data: BrandingSettings
  isSaving: boolean
  onSave: (payload: BrandingSettings) => void
  showLoader?: boolean
}) {
  const [form, setForm] = useState<BrandingSettings>(data ?? DEFAULT_BRANDING)

  useEffect(() => {
    setForm(data ?? DEFAULT_BRANDING)
  }, [data])

  const update = (field: keyof BrandingSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleReset = () => setForm(data ?? DEFAULT_BRANDING)
  const handleSave = () => {
    onSave({
      primaryLogoUrl: form.primaryLogoUrl?.trim() || DEFAULT_BRANDING.primaryLogoUrl,
      inverseLogoUrl: form.inverseLogoUrl?.trim() || '',
      logoAlt: form.logoAlt?.trim() || 'Site logo',
    })
  }

  if (showLoader) {
    return (
      <div className='flex h-48 items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-slate-400' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        <UploadField
          label='Primary logo (light backgrounds)'
          value={form.primaryLogoUrl}
          onChange={(url) => update('primaryLogoUrl', url)}
          folder='branding/primary'
          placeholder='PNG/SVG · 240×80px minimum'
          hint='Displayed in the header, auth screens, PDFs, and receipts. Upload a transparent PNG or SVG at least 240×80 px.'
        />
        <UploadField
          label='Inverse logo (dark backgrounds)'
          value={form.inverseLogoUrl || ''}
          onChange={(url) => update('inverseLogoUrl', url)}
          folder='branding/inverse'
          placeholder='PNG/SVG · 240×80px minimum'
          hint='Used on dark sections like the footer. Leave empty to reuse the primary logo.'
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 p-4 bg-white shadow-sm'>
          <p className='text-sm font-semibold text-slate-800 mb-2'>Light surface preview</p>
          <div className='relative flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50'>
            {form.primaryLogoUrl ? (
              <Image
                src={form.primaryLogoUrl}
                alt={form.logoAlt || 'Logo preview'}
                fill
                sizes='200px'
                className='object-contain p-4'
              />
            ) : (
              <span className='text-xs text-slate-400'>Upload a primary logo to preview</span>
            )}
          </div>
          <p className='mt-2 text-xs text-slate-500'>Displayed on white / light gray backgrounds.</p>
        </div>

        <div className='rounded-2xl border border-slate-800/40 p-4 bg-slate-900 shadow-inner'>
          <p className='text-sm font-semibold text-white mb-2'>Dark surface preview</p>
          <div className='relative flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/70'>
            {(form.inverseLogoUrl || form.primaryLogoUrl) ? (
              <Image
                src={form.inverseLogoUrl || form.primaryLogoUrl}
                alt={form.logoAlt || 'Logo preview'}
                fill
                sizes='200px'
                className='object-contain p-4'
              />
            ) : (
              <span className='text-xs text-slate-400'>Upload an inverse logo for dark areas</span>
            )}
          </div>
          <p className='mt-2 text-xs text-slate-400'>Shown on the footer, overlays, and hero banners.</p>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <Field label='Accessible alt text'>
          <Input
            value={form.logoAlt || ''}
            onChange={(e) => update('logoAlt', e.target.value)}
            placeholder='Divine Mercy Retreat Center logo'
          />
        </Field>
        <div className='rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600'>
          <p className='font-semibold text-slate-800'>Pro tip</p>
          <p className='mt-1 text-xs text-slate-500'>
            Transparent PNG/SVG at 240×80 px keeps the carousel + navigation crisp. Larger files are automatically resized on the frontend.
          </p>
        </div>
      </div>

      <div className='flex justify-end gap-3'>
        <Button type='button' variant='ghost' onClick={handleReset} disabled={isSaving}>
          Reset
        </Button>
        <Button
          type='button'
          className='bg-blue-600 hover:bg-blue-700'
          onClick={handleSave}
          disabled={isSaving || !form.primaryLogoUrl}>
          {isSaving ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <PencilLine className='h-4 w-4 mr-2' />}
          Save branding
        </Button>
      </div>
    </div>
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
      return { title: '', imageUrl: '', href: '', parentId: null, order: 0, isActive: true }
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








