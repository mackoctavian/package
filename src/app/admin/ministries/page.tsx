'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, 
  Search, ChevronDown, MoreVertical, GripVertical,
  Church, Users, Calendar, MapPin, Mail, Phone
} from 'lucide-react'
import Image from 'next/image'

type Ministry = {
  id: string
  slug: string
  title: string
  shortTitle?: string
  subtitle?: string
  description: string
  shortDescription?: string
  heroImage: string
  icon?: string
  focusAreas?: string[]
  schedule?: string
  location?: string
  coordinator?: string
  coordinatorImage?: string
  coordinatorBio?: string
  contactEmail?: string
  contactPhone?: string
  galleryImages?: string[]
  faqs?: { question: string; answer: string }[]
  order: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

const DEFAULT_MINISTRIES = [
  { title: 'Residential Retreats', slug: 'residential-retreats', shortTitle: 'Residential' },
  { title: 'Saturday Service', slug: 'saturday-service', shortTitle: 'Saturday' },
  { title: 'Special Retreats', slug: 'special-retreats', shortTitle: 'Special' },
  { title: 'Bible Convention', slug: 'bible-convention', shortTitle: 'Bible Conv.' },
  { title: 'Bible Children', slug: 'bible-children', shortTitle: 'Children' },
  { title: 'Spiritual Counselling', slug: 'spiritual-counselling', shortTitle: 'Counselling' },
  { title: 'Parish Retreat', slug: 'parish-retreat', shortTitle: 'Parish' },
  { title: 'Jesus Mission Retreat', slug: 'jesus-mission-retreat', shortTitle: 'Jesus Mission' },
  { title: 'Team Members Ministries', slug: 'team-members', shortTitle: 'Team' },
  { title: 'Spiritual Partners', slug: 'spiritual-partners', shortTitle: 'Partners' },
  { title: 'DMRC Benefactors', slug: 'dmrc-benefactors', shortTitle: 'Benefactors' },
  { title: 'Media Ministries', slug: 'media-ministries', shortTitle: 'Media' },
  { title: 'Religious Articles', slug: 'religious-articles', shortTitle: 'Articles' },
]

export default function MinistriesAdminPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    shortTitle: '',
    slug: '',
    subtitle: '',
    description: '',
    shortDescription: '',
    heroImage: '',
    icon: '',
    focusAreas: '',
    schedule: '',
    location: '',
    coordinator: '',
    coordinatorImage: '',
    coordinatorBio: '',
    contactEmail: '',
    contactPhone: '',
    order: 0,
    isActive: true,
    isFeatured: false,
  })

  useEffect(() => {
    fetchMinistries()
  }, [showInactive])

  const fetchMinistries = async () => {
    try {
      const res = await fetch(`/api/ministries?active=${!showInactive}`)
      const data = await res.json()
      if (data.success) {
        setMinistries(data.data)
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDefault = async () => {
    setLoading(true)
    for (const ministry of DEFAULT_MINISTRIES) {
      try {
        await fetch('/api/ministries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...ministry,
            description: `Welcome to ${ministry.title}. This ministry is dedicated to serving the community through various spiritual programs and activities.`,
            shortDescription: `Join our ${ministry.title} ministry and grow in faith.`,
            heroImage: '/images/ministries/default.jpg',
            order: DEFAULT_MINISTRIES.indexOf(ministry),
            isActive: true,
          }),
        })
      } catch (error) {
        console.error(`Error creating ${ministry.title}:`, error)
      }
    }
    fetchMinistries()
  }

  const openCreateDialog = () => {
    setFormData({
      title: '',
      shortTitle: '',
      slug: '',
      subtitle: '',
      description: '',
      shortDescription: '',
      heroImage: '',
      icon: '',
      focusAreas: '',
      schedule: '',
      location: '',
      coordinator: '',
      coordinatorImage: '',
      coordinatorBio: '',
      contactEmail: '',
      contactPhone: '',
      order: ministries.length,
      isActive: true,
      isFeatured: false,
    })
    setEditingMinistry(null)
    setIsCreating(true)
    setIsDialogOpen(true)
  }

  const openEditDialog = (ministry: Ministry) => {
    setFormData({
      title: ministry.title,
      shortTitle: ministry.shortTitle || '',
      slug: ministry.slug,
      subtitle: ministry.subtitle || '',
      description: ministry.description,
      shortDescription: ministry.shortDescription || '',
      heroImage: ministry.heroImage,
      icon: ministry.icon || '',
      focusAreas: ministry.focusAreas?.join(', ') || '',
      schedule: ministry.schedule || '',
      location: ministry.location || '',
      coordinator: ministry.coordinator || '',
      coordinatorImage: ministry.coordinatorImage || '',
      coordinatorBio: ministry.coordinatorBio || '',
      contactEmail: ministry.contactEmail || '',
      contactPhone: ministry.contactPhone || '',
      order: ministry.order,
      isActive: ministry.isActive,
      isFeatured: ministry.isFeatured,
    })
    setEditingMinistry(ministry)
    setIsCreating(false)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      focusAreas: formData.focusAreas.split(',').map(s => s.trim()).filter(Boolean),
    }

    try {
      if (isCreating) {
        await fetch('/api/ministries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else if (editingMinistry) {
        await fetch(`/api/ministries/${editingMinistry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setIsDialogOpen(false)
      fetchMinistries()
    } catch (error) {
      console.error('Error saving ministry:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ministry?')) return

    try {
      await fetch(`/api/ministries/${id}`, { method: 'DELETE' })
      fetchMinistries()
    } catch (error) {
      console.error('Error deleting ministry:', error)
    }
  }

  const toggleActive = async (ministry: Ministry) => {
    try {
      await fetch(`/api/ministries/${ministry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ministry.isActive }),
      })
      fetchMinistries()
    } catch (error) {
      console.error('Error toggling active:', error)
    }
  }

  const toggleFeatured = async (ministry: Ministry) => {
    try {
      await fetch(`/api/ministries/${ministry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !ministry.isFeatured }),
      })
      fetchMinistries()
    } catch (error) {
      console.error('Error toggling featured:', error)
    }
  }

  const filteredMinistries = ministries.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className='px-6 py-8 space-y-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Ministry Management</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Ministries</h1>
          <p className='text-sm text-slate-500'>Manage all ministry programs and their content</p>
        </div>
        <div className='flex items-center gap-3'>
          {ministries.length === 0 && !loading && (
            <button
              onClick={handleCreateDefault}
              className='px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium'
            >
              Create Default Ministries
            </button>
          )}
          <button
            onClick={openCreateDialog}
            className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2'
          >
            <Plus className='w-4 h-4' />
            Add Ministry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <input
            type='text'
            placeholder='Search ministries...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
          />
        </div>
        <label className='flex items-center gap-2 text-sm text-slate-600 cursor-pointer'>
          <input
            type='checkbox'
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className='rounded border-slate-300 text-primary focus:ring-primary'
          />
          Show inactive
        </label>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-xl border border-slate-200 p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Church className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{ministries.length}</p>
              <p className='text-xs text-slate-500'>Total Ministries</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl border border-slate-200 p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <Eye className='w-5 h-5 text-green-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{ministries.filter(m => m.isActive).length}</p>
              <p className='text-xs text-slate-500'>Active</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl border border-slate-200 p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-amber-100 rounded-lg'>
              <Star className='w-5 h-5 text-amber-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{ministries.filter(m => m.isFeatured).length}</p>
              <p className='text-xs text-slate-500'>Featured</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl border border-slate-200 p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-slate-100 rounded-lg'>
              <EyeOff className='w-5 h-5 text-slate-600' />
            </div>
            <div>
              <p className='text-2xl font-bold text-slate-900'>{ministries.filter(m => !m.isActive).length}</p>
              <p className='text-xs text-slate-500'>Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ministries Grid */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse'>
              <div className='h-40 bg-slate-200' />
              <div className='p-4 space-y-3'>
                <div className='h-5 bg-slate-200 rounded w-3/4' />
                <div className='h-4 bg-slate-200 rounded w-full' />
                <div className='h-4 bg-slate-200 rounded w-1/2' />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMinistries.length === 0 ? (
        <div className='text-center py-16 bg-white rounded-xl border border-slate-200'>
          <Church className='w-12 h-12 text-slate-300 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-slate-900 mb-2'>No ministries found</h3>
          <p className='text-sm text-slate-500 mb-4'>Create your first ministry to get started</p>
          <button
            onClick={handleCreateDefault}
            className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium'
          >
            Create Default Ministries
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredMinistries.map((ministry) => (
            <div
              key={ministry.id}
              className={`bg-white rounded-xl border overflow-hidden group transition-all hover:shadow-lg ${
                ministry.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className='relative h-40 bg-slate-100'>
                {ministry.heroImage && (
                  <Image
                    src={ministry.heroImage}
                    alt={ministry.title}
                    fill
                    className='object-cover'
                  />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
                <div className='absolute top-3 right-3 flex gap-2'>
                  {ministry.isFeatured && (
                    <span className='px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full'>
                      Featured
                    </span>
                  )}
                  {!ministry.isActive && (
                    <span className='px-2 py-1 bg-slate-500 text-white text-xs font-medium rounded-full'>
                      Inactive
                    </span>
                  )}
                </div>
                <div className='absolute bottom-3 left-3'>
                  <span className='text-xs text-white/80 font-medium'>Order: {ministry.order}</span>
                </div>
              </div>
              <div className='p-4'>
                <h3 className='font-semibold text-slate-900 mb-1'>{ministry.title}</h3>
                {ministry.shortTitle && (
                  <p className='text-xs text-primary font-medium mb-2'>Nav: {ministry.shortTitle}</p>
                )}
                <p className='text-sm text-slate-500 line-clamp-2 mb-4'>
                  {ministry.shortDescription || ministry.description}
                </p>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-slate-400'>/{ministry.slug}</span>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => toggleFeatured(ministry)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ministry.isFeatured
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-400 hover:text-amber-600'
                      }`}
                      title={ministry.isFeatured ? 'Unfeature' : 'Feature'}
                    >
                      {ministry.isFeatured ? <Star className='w-4 h-4' /> : <StarOff className='w-4 h-4' />}
                    </button>
                    <button
                      onClick={() => toggleActive(ministry)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ministry.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-slate-100 text-slate-400 hover:text-green-600'
                      }`}
                      title={ministry.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {ministry.isActive ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
                    </button>
                    <button
                      onClick={() => openEditDialog(ministry)}
                      className='p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors'
                      title='Edit'
                    >
                      <Edit2 className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => handleDelete(ministry.id)}
                      className='p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors'
                      title='Delete'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      {isDialogOpen && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between'>
              <h2 className='text-xl font-semibold text-slate-900'>
                {isCreating ? 'Create Ministry' : 'Edit Ministry'}
              </h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className='p-6 space-y-6'>
              {/* Basic Info */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Title *</label>
                  <input
                    type='text'
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Short Title (for nav)</label>
                  <input
                    type='text'
                    value={formData.shortTitle}
                    onChange={(e) => setFormData({ ...formData, shortTitle: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    placeholder='e.g., Retreats'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Slug</label>
                  <input
                    type='text'
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    placeholder='auto-generated-from-title'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Subtitle</label>
                  <input
                    type='text'
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Short Description</label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  rows={2}
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  placeholder='Brief description for cards and previews'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Full Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  required
                />
              </div>

              {/* Images */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Hero Image URL</label>
                  <input
                    type='text'
                    value={formData.heroImage}
                    onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    placeholder='/images/ministries/example.jpg'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Icon Name</label>
                  <input
                    type='text'
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    placeholder='e.g., church, users, book'
                  />
                </div>
              </div>

              {/* Contact & Location */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Schedule</label>
                  <input
                    type='text'
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    placeholder='e.g., Every Saturday 9AM-12PM'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Location</label>
                  <input
                    type='text'
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    placeholder='DMRC Vikindu Main Hall'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Contact Email</label>
                  <input
                    type='email'
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Contact Phone</label>
                  <input
                    type='text'
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  />
                </div>
              </div>

              {/* Coordinator */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Coordinator Name</label>
                  <input
                    type='text'
                    value={formData.coordinator}
                    onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Coordinator Image URL</label>
                  <input
                    type='text'
                    value={formData.coordinatorImage}
                    onChange={(e) => setFormData({ ...formData, coordinatorImage: e.target.value })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Coordinator Bio</label>
                <textarea
                  value={formData.coordinatorBio}
                  onChange={(e) => setFormData({ ...formData, coordinatorBio: e.target.value })}
                  rows={2}
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                />
              </div>

              {/* Focus Areas */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Focus Areas (comma-separated)</label>
                <input
                  type='text'
                  value={formData.focusAreas}
                  onChange={(e) => setFormData({ ...formData, focusAreas: e.target.value })}
                  className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  placeholder='Prayer, Formation, Community, Outreach'
                />
              </div>

              {/* Order & Status */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Display Order</label>
                  <input
                    type='number'
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  />
                </div>
                <div className='flex items-center gap-4 pt-6'>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className='rounded border-slate-300 text-primary focus:ring-primary'
                    />
                    <span className='text-sm text-slate-700'>Active</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className='rounded border-slate-300 text-primary focus:ring-primary'
                    />
                    <span className='text-sm text-slate-700'>Featured</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className='flex justify-end gap-3 pt-4 border-t border-slate-200'>
                <button
                  type='button'
                  onClick={() => setIsDialogOpen(false)}
                  className='px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors'
                >
                  {isCreating ? 'Create Ministry' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
