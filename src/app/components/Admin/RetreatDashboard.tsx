'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Plus,
  ScanLine,
  Ticket,
  Trash2,
  Users2,
} from 'lucide-react'

import { RetreatType } from '@/app/types/retreat'
import { RetreatBooking } from '@/app/types/retreat-booking'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu'
import { formatCurrencyValue, getCurrencyConfig } from '@dashboard/lib/currency'
import { UploadField } from './UploadField'
import { PageHeader, StatCard } from './shell/primitives'
import { useAdminUser } from '@dashboard/context/admin-user'
import { canEdit } from '@/lib/auth/admin-shared'

const statusOptions: RetreatType['status'][] = ['Registration Open', 'Waitlist', 'Closed']
const defaultCategoryOptions = [
  { value: 'parish-retreat', label: 'Parish Retreats' },
  { value: 'residential-retreat', label: 'Residential Retreats' },
  { value: 'jesus-mission-retreat', label: 'Jesus Mission Retreats' },
  { value: 'special-retreat', label: 'Special Retreat' },
]

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export interface RetreatFormValues {
  title: string
  subtitle: string
  speaker: string
  conductor: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  category: string
  customCategory: string
  status: RetreatType['status']
  total: string
  male: string
  female: string
  splitByGender: boolean
  price: string
  isPaid: boolean
  imageSrc: string
}

export const emptyForm: RetreatFormValues = {
  title: '',
  subtitle: '',
  speaker: '',
  conductor: '',
  description: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  location: '',
  category: defaultCategoryOptions[0]?.value ?? 'parish-retreat',
  customCategory: '',
  status: 'Registration Open',
  total: '120',
  male: '60',
  female: '60',
  splitByGender: true,
  price: '2500',
  isPaid: true,
  imageSrc: '',
}

export const mapRetreatToForm = (retreat: RetreatType): RetreatFormValues => {
  const [startDate, endDate] = (retreat.dateRange || '').split('–').map((s) => s.trim())
  const [startTime, endTime] = (retreat.timeRange || '').split('–').map((s) => s.trim())
  const preset = defaultCategoryOptions.find((opt) => opt.value === retreat.category)

  return {
    title: retreat.title ?? '',
    subtitle: retreat.subtitle ?? '',
    speaker: retreat.speaker ?? '',
    conductor: retreat.conductor ?? '',
    description: retreat.description ?? '',
    startDate: startDate || '',
    endDate: endDate || '',
    startTime: startTime || '',
    endTime: endTime || '',
    location: retreat.location ?? '',
    category: preset ? preset.value : 'custom',
    customCategory: preset ? '' : (retreat.category ?? ''),
    status: retreat.status ?? 'Registration Open',
    total: String(retreat.availability.total ?? 0),
    male: String(retreat.availability.male ?? 0),
    female: String(retreat.availability.female ?? 0),
    splitByGender: true,
    price: retreat.price != null ? String(retreat.price) : '0',
    isPaid: retreat.isPaid ?? true,
    imageSrc: retreat.imageSrc ?? '',
  }
}

export const buildPayload = (form: RetreatFormValues) => ({
  slug: slugify(form.title),
  title: form.title,
  subtitle: form.subtitle || null,
  speaker: form.speaker,
  conductor: form.conductor,
  description: form.description,
  dateRange: `${form.startDate} – ${form.endDate}`,
  timeRange: form.startTime && form.endTime ? `${form.startTime} – ${form.endTime}` : form.startTime || form.endTime || '',
  location: form.location,
  category: form.category === 'custom' ? form.customCategory || 'custom' : form.category,
  status: form.status,
  imageSrc: form.imageSrc,
  detailHref: `/events/${slugify(form.title)}`,
  ctaHref: `/events/${slugify(form.title)}#booking`,
  price: form.price ? Number(form.price) : null,
  isPaid: form.isPaid,
  availability: {
    total: Number(form.total) || 0,
    male: form.splitByGender ? Number(form.male) || 0 : Number(form.total) || 0,
    female: form.splitByGender ? Number(form.female) || 0 : 0,
  },
})

type RetreatsQueryPayload = {
  data: RetreatType[]
  source: 'prisma' | 'static' | 'unknown'
}

const fetchRetreats = async (): Promise<RetreatsQueryPayload> => {
  const response = await fetch('/api/retreats', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Unable to fetch retreats.')
  }
  const payload = await response.json()
  return {
    data: payload.data ?? [],
    source: (payload.source as RetreatsQueryPayload['source']) ?? 'unknown',
  }
}

const fetchBookings = async (): Promise<RetreatBooking[]> => {
  const response = await fetch('/api/retreats/bookings', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Unable to fetch bookings.')
  }
  const payload = await response.json()
  return payload.data ?? []
}

interface RetreatFormFieldsProps {
  form: RetreatFormValues
  onChange: <K extends keyof RetreatFormValues>(field: K, value: RetreatFormValues[K]) => void
}

export const RetreatFormFields = ({ form, onChange }: RetreatFormFieldsProps) => {
  const isCustomCategory = form.category === 'custom'

  return (
    <div className='grid gap-6 pb-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-title'>Retreat title *</Label>
          <Input
            id='retreat-title'
            placeholder='Divine Mercy Encounter'
            value={form.title}
            onChange={(event) => onChange('title', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-subtitle'>Subtitle</Label>
          <Input
            id='retreat-subtitle'
            placeholder='Optional subtitle'
            value={form.subtitle}
            onChange={(event) => onChange('subtitle', event.target.value)}
          />
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-speaker'>Speaker *</Label>
          <Input
            id='retreat-speaker'
            placeholder='Fr. Christo Thekkanath'
            value={form.speaker}
            onChange={(event) => onChange('speaker', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-conductor'>Conductor *</Label>
          <Input
            id='retreat-conductor'
            placeholder='DMRC Worship Collective'
            value={form.conductor}
            onChange={(event) => onChange('conductor', event.target.value)}
          />
        </div>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='retreat-description'>Description *</Label>
        <Textarea
          id='retreat-description'
          rows={4}
          placeholder='Share the key experience, prayer moments, and focus of this retreat.'
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
        />
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-start-date'>Start date</Label>
          <Input
            id='retreat-start-date'
            type='date'
            value={form.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-end-date'>End date</Label>
          <Input id='retreat-end-date' type='date' value={form.endDate} onChange={(event) => onChange('endDate', event.target.value)} />
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-start-time'>Start time</Label>
          <Input
            id='retreat-start-time'
            type='time'
            value={form.startTime}
            onChange={(event) => onChange('startTime', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-end-time'>End time</Label>
          <Input id='retreat-end-time' type='time' value={form.endTime} onChange={(event) => onChange('endTime', event.target.value)} />
        </div>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='retreat-location'>Location</Label>
        <Input
          id='retreat-location'
          placeholder='Divine Mercy Retreat Center'
          value={form.location}
          onChange={(event) => onChange('location', event.target.value)}
        />
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-category'>Category</Label>
          <select
            id='retreat-category'
            value={form.category}
            onChange={(event) => onChange('category', event.target.value)}
            className='h-10 rounded-lg border border-slate-200 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
          >
            {defaultCategoryOptions.map((option) => (
              <option key={option.value} value={option.value} className='capitalize'>
                {option.label}
              </option>
            ))}
            <option value='custom'>Custom category</option>
          </select>
        </div>
        {isCustomCategory && (
          <div className='space-y-2'>
            <Label htmlFor='retreat-custom-category'>Custom category</Label>
            <Input
              id='retreat-custom-category'
              placeholder='e.g., Youth Formation'
              value={form.customCategory}
              onChange={(event) => onChange('customCategory', event.target.value)}
            />
          </div>
        )}
        <div className='space-y-2'>
          <Label htmlFor='retreat-status'>Status</Label>
          <select
            id='retreat-status'
            value={form.status}
            onChange={(event) => onChange('status', event.target.value as RetreatType['status'])}
            className='h-10 rounded-lg border border-slate-200 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-3'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-total'>Total seats</Label>
          <Input id='retreat-total' type='number' min={0} value={form.total} onChange={(event) => onChange('total', event.target.value)} />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-male'>Male seats</Label>
          <Input
            id='retreat-male'
            type='number'
            min={0}
            value={form.male}
            onChange={(event) => onChange('male', event.target.value)}
            disabled={!form.splitByGender}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-female'>Female seats</Label>
          <Input
            id='retreat-female'
            type='number'
            min={0}
            value={form.female}
            onChange={(event) => onChange('female', event.target.value)}
            disabled={!form.splitByGender}
          />
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-price'>Price (TSh)</Label>
          <Input id='retreat-price' type='number' min={0} value={form.price} onChange={(event) => onChange('price', event.target.value)} />
        </div>
        <UploadField
          label='Retreat image'
          value={form.imageSrc}
          onChange={(url) => onChange('imageSrc', url)}
          folder='retreats'
          placeholder='Landscape banner · 1600×900px'
          hint='Use a 1600×900 px (16:9) landscape photo so retreat cards look consistent on the homepage.'
        />
      </div>
      <div className='flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3'>
        <div>
          <p className='text-sm font-semibold text-slate-800'>Track gender capacity</p>
          <p className='text-xs text-slate-500'>Toggle off for retreats without gender-specific counts.</p>
        </div>
        <Switch checked={form.splitByGender} onCheckedChange={(value) => onChange('splitByGender', value)} />
      </div>
      <div className='flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3'>
        <div>
          <p className='text-sm font-semibold text-slate-800'>Paid retreat</p>
          <p className='text-xs text-slate-500'>Toggle this on if the retreat requires payment.</p>
        </div>
        <Switch checked={form.isPaid} onCheckedChange={(value) => onChange('isPaid', value)} />
      </div>
    </div>
  )
}

const RetreatDashboard = () => {
  const queryClient = useQueryClient()
  const editable = canEdit(useAdminUser(), 'retreats')
  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<RetreatFormValues>(emptyForm)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RetreatFormValues>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<RetreatType | null>(null)

  const { data: retreatsPayload, isLoading: retreatsLoading } = useQuery({
    queryKey: ['retreats'],
    queryFn: fetchRetreats,
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['retreatBookings'],
    queryFn: fetchBookings,
  })

  const retreats = retreatsPayload?.data ?? []
  const retreatSource = retreatsPayload?.source ?? 'unknown'
  const isReadOnlyData = retreatSource !== 'prisma'

  const guardReadOnlyAction = () => {
    if (!isReadOnlyData) {
      return true
    }
    toast.error('Sample retreats are read-only until the database connection is restored.')
    return false
  }

  const validateFormValues = (form: RetreatFormValues) => {
    const errors: string[] = []
    if (!form.title.trim()) errors.push('Title is required')
    if (!form.speaker.trim()) errors.push('Speaker is required')
    if (!form.conductor.trim()) errors.push('Conductor is required')
    if (!form.description.trim()) errors.push('Description is required')
    if (!form.startDate) errors.push('Start date is required')
    if (!form.endDate) errors.push('End date is required')
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      errors.push('Start date must be before end date')
    }
    if (!form.startTime) errors.push('Start time is required')
    if (!form.endTime) errors.push('End time is required')
    if (!form.location.trim()) errors.push('Location is required')
    if (form.category === 'custom' && !form.customCategory.trim()) {
      errors.push('Custom category is required')
    }
    if (!form.total || Number.isNaN(Number(form.total))) errors.push('Total capacity is required')
    if (form.splitByGender) {
      if (!form.male || Number.isNaN(Number(form.male))) errors.push('Male capacity is required')
      if (!form.female || Number.isNaN(Number(form.female))) errors.push('Female capacity is required')
    }
    if (!form.imageSrc) {
      errors.push('Retreat image is required')
    } else if (!/^https?:\/\//i.test(form.imageSrc)) {
      errors.push('Please upload a retreat image (it will be stored in the Supabase Storage bucket).')
    }
    return errors
  }

  const createMutation = useMutation({
    mutationFn: async (payload: RetreatFormValues) => {
      const response = await fetch('/api/retreats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Unable to create retreat')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Retreat created')
      queryClient.invalidateQueries({ queryKey: ['retreats'] })
      queryClient.invalidateQueries({ queryKey: ['retreat'] })
      setIsCreateOpen(false)
      setCreateForm(emptyForm)
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to create retreat')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RetreatFormValues }) => {
      const response = await fetch(`/api/retreats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Unable to update retreat')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Retreat updated')
      queryClient.invalidateQueries({ queryKey: ['retreats'] })
      queryClient.invalidateQueries({ queryKey: ['retreat'] })
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['retreat', editId] })
      }
      setIsEditOpen(false)
      setEditId(null)
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to update retreat')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/retreats/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Unable to delete retreat')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Retreat deleted')
      queryClient.invalidateQueries({ queryKey: ['retreats'] })
      queryClient.invalidateQueries({ queryKey: ['retreat'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unable to delete retreat')
    },
  })

  const isLoading = retreatsLoading || bookingsLoading

  const totalCapacity = useMemo(() => retreats.reduce((acc, retreat) => acc + (retreat.availability.total ?? 0), 0), [retreats])
  const totalBooked = useMemo(() => bookings.filter((booking) => booking.status !== 'cancelled').length, [bookings])
  const paidBookings = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'paid' && booking.status !== 'cancelled').length,
    [bookings],
  )
  const openRetreats = retreats.filter((retreat) => retreat.status !== 'Closed').length
  const bookedByRetreat = useMemo(() => {
    const counts = new Map<string, number>()
    for (const booking of bookings) {
      if (booking.status === 'cancelled') continue
      counts.set(booking.retreatId, (counts.get(booking.retreatId) ?? 0) + 1 + (booking.familyMembers?.length ?? 0))
    }
    return counts
  }, [bookings])

  const handleOpenCreate = () => {
    if (!guardReadOnlyAction()) return
    setCreateForm(emptyForm)
    setIsCreateOpen(true)
  }

  const handleSaveNew = () => {
    if (createMutation.isPending || !guardReadOnlyAction()) return
    const errors = validateFormValues(createForm)
    if (errors.length) {
      toast.error(errors[0])
      return
    }
    createMutation.mutate(createForm)
  }

  const handleOpenEdit = (retreat: RetreatType) => {
    if (!guardReadOnlyAction()) return
    setEditId(retreat.id)
    setEditForm(mapRetreatToForm(retreat))
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editId || updateMutation.isPending || !guardReadOnlyAction()) return
    const errors = validateFormValues(editForm)
    if (errors.length) {
      toast.error(errors[0])
      return
    }
    updateMutation.mutate({ id: editId, payload: editForm })
  }

  const handleDuplicate = (retreat: RetreatType) => {
    if (!guardReadOnlyAction()) return
    const next = mapRetreatToForm(retreat)
    next.title = `${retreat.title} (Copy)`
    setCreateForm(next)
    setIsCreateOpen(true)
  }

  const handleRequestDelete = (retreat: RetreatType) => {
    if (!guardReadOnlyAction()) return
    setDeleteTarget(retreat)
  }

  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow='Retreats'
        title='Retreats'
        description='Plan retreat sessions, set capacity and pricing, and keep an eye on how full each one is.'
        actions={
          <>
            <Button asChild variant='outline' className='gap-2'>
              <Link href='/admin/bookings'>
                <Ticket className='h-4 w-4' /> All bookings
              </Link>
            </Button>
            {editable && (
              <Button className='gap-2' onClick={handleOpenCreate} disabled={isReadOnlyData}>
                <Plus className='h-4 w-4' />
                New retreat
              </Button>
            )}
          </>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Retreats' value={retreats.length} hint={`${openRetreats} open for registration`} icon={CalendarDays} />
        <StatCard label='Seats offered' value={totalCapacity} hint='Across all retreats' icon={Users2} tone='gold' />
        <StatCard label='Active bookings' value={totalBooked} hint='Not counting cancellations' icon={Ticket} tone='green' />
        <StatCard label='Paid bookings' value={paidBookings} hint='Payment recorded' icon={CircleDollarSign} tone='navy' />
      </div>

      {isReadOnlyData ? (
        <Alert variant='destructive'>
          <AlertTitle>Read-only sample data</AlertTitle>
          <AlertDescription>
            The database connection could not be reached, so you are viewing sample retreats. Create, edit, and delete actions are disabled
            until the connection is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-lg font-semibold text-slate-900'>Retreat inventory</CardTitle>
            <CardDescription>Track capacity, financials, and booking health for each retreat.</CardDescription>
          </div>
          <Badge variant='outline'>Capacity {totalCapacity}</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Fetching retreats…
            </div>
          ) : retreats.length === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-sm text-slate-500'>
              <p>No retreats yet. Create your first retreat to get started.</p>
              <Button size='sm' onClick={handleOpenCreate} className='gap-2' disabled={isReadOnlyData}>
                <Plus className='h-4 w-4' /> New retreat
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[22%]'>Retreat</TableHead>
                  <TableHead className='w-[20%]'>Schedule</TableHead>
                  <TableHead className='w-[16%]'>Capacity</TableHead>
                  <TableHead className='w-[16%]'>Pricing</TableHead>
                  <TableHead className='w-[14%]'>Status</TableHead>
                  <TableHead className='w-[12%] text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retreats.map((retreat) => (
                  <TableRow key={retreat.id}>
                    <TableCell className='align-top'>
                      <div className='space-y-1.5'>
                        <div className='flex items-center gap-2'>
                          {isReadOnlyData ? (
                            <span className='font-semibold text-slate-900'>{retreat.title}</span>
                          ) : (
                            <Link
                              href={`/admin/retreats/${retreat.id}`}
                              className='font-semibold text-slate-900 transition-colors hover:text-primary'
                            >
                              {retreat.title}
                            </Link>
                          )}
                          <Badge variant='outline' className='capitalize'>
                            {retreat.category}
                          </Badge>
                        </div>
                        {retreat.subtitle ? <p className='text-xs text-slate-500 line-clamp-1'>{retreat.subtitle}</p> : null}
                        <p className='text-xs text-slate-500'>Facilitator: {retreat.speaker}</p>
                      </div>
                    </TableCell>
                    <TableCell className='align-top text-sm text-slate-600'>
                      <div className='flex flex-col gap-1'>
                        <span className='flex items-center gap-2 text-xs text-slate-500'>
                          <CalendarDays className='h-3 w-3 text-primary' /> {retreat.dateRange || 'TBC'}
                        </span>
                        <span className='flex items-center gap-2 text-xs text-slate-500'>
                          <MapPin className='h-3 w-3 text-primary' /> {retreat.location || 'TBC'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='align-top text-sm text-slate-600'>
                      <div className='space-y-1'>
                        <p className='font-semibold text-slate-800'>
                          {bookedByRetreat.get(retreat.id) ?? 0} / {retreat.availability.total} booked
                        </p>
                        <div className='h-1.5 w-28 overflow-hidden rounded-full bg-muted'>
                          <div
                            className='h-full bg-navy-700'
                            style={{
                              width: `${Math.min(100, Math.round(((bookedByRetreat.get(retreat.id) ?? 0) / Math.max(1, retreat.availability.total)) * 100))}%`,
                            }}
                          />
                        </div>
                        <p className='text-xs text-slate-500'>
                          Male {retreat.availability.male} • Female {retreat.availability.female}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className='align-top text-sm text-slate-600'>
                      {retreat.isPaid === false ? (
                        <Badge variant='success'>Sponsored</Badge>
                      ) : (
                        <div className='space-y-1'>
                          <p className='font-semibold text-slate-800'>{formatCurrencyValue(retreat.price ?? 0, currencyConfig)}</p>
                          <p className='text-xs text-slate-500'>Standard contribution</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='align-top'>
                      <Badge variant={retreat.status === 'Waitlist' ? 'warning' : retreat.status === 'Closed' ? 'outline' : 'default'}>
                        {retreat.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='align-top text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem asChild className='gap-2' disabled={isReadOnlyData}>
                            <Link href={`/admin/retreats/${retreat.id}`}>
                              <ExternalLink className='h-4 w-4 text-primary' /> View details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className='gap-2'>
                            <Link href={`/admin/bookings?retreatId=${retreat.id}`}>
                              <Ticket className='h-4 w-4 text-primary' /> Bookings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className='gap-2'>
                            <Link href={`/admin/check-in?retreat=${retreat.id}`}>
                              <ScanLine className='h-4 w-4 text-primary' /> Check-in desk
                            </Link>
                          </DropdownMenuItem>
                          {editable && (
                            <>
                              <DropdownMenuItem onSelect={() => handleOpenEdit(retreat)} className='gap-2' disabled={isReadOnlyData}>
                                <PencilLine className='h-4 w-4 text-primary' /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDuplicate(retreat)} className='gap-2' disabled={isReadOnlyData}>
                                <Users2 className='h-4 w-4 text-slate-500' /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleRequestDelete(retreat)}
                                className='gap-2 text-red-600 focus:bg-red-100/80'
                                disabled={isReadOnlyData}
                              >
                                <Trash2 className='h-4 w-4' /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            setCreateForm(emptyForm)
          }
        }}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Create a new retreat</DialogTitle>
            <DialogDescription>Share the essentials of your retreat and publish immediately to the site.</DialogDescription>
          </DialogHeader>
          <RetreatFormFields form={createForm} onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))} />
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveNew} disabled={createMutation.isPending} className='gap-2'>
              {createMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Plus className='h-4 w-4' />}
              Save retreat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            setEditForm(emptyForm)
            setEditId(null)
          }
        }}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Edit retreat details</DialogTitle>
            <DialogDescription>Update schedules, pricing, and availability in real-time.</DialogDescription>
          </DialogHeader>
          <RetreatFormFields form={editForm} onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))} />
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsEditOpen(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className='gap-2'>
              {updateMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <PencilLine className='h-4 w-4' />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete retreat</DialogTitle>
            <DialogDescription>
              This action permanently removes <span className='font-semibold text-slate-900'>{deleteTarget?.title}</span> and all associated
              bookings. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              className='gap-2'
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return
                if (!guardReadOnlyAction()) return
                deleteMutation.mutate(deleteTarget.id)
              }}
            >
              {deleteMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
              Delete retreat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RetreatDashboard
