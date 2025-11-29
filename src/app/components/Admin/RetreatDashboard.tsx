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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { formatCurrencyValue, getCurrencyConfig } from '@dashboard/lib/currency'

const statusOptions: RetreatType['status'][] = ['Registration Open', 'Waitlist', 'Closed']
const categoryOptions: RetreatType['category'][] = ['youth', 'clergy', 'family', 'mission']

const defaultImage = '/images/dmrc/gallery/IMG_0299.JPG'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export interface RetreatFormValues {
  title: string
  slug: string
  subtitle: string
  speaker: string
  conductor: string
  description: string
  dateRange: string
  timeRange: string
  location: string
  category: RetreatType['category']
  status: RetreatType['status']
  total: string
  male: string
  female: string
  price: string
  isPaid: boolean
  imageSrc: string
  detailHref: string
  ctaHref: string
}

export const emptyForm: RetreatFormValues = {
  title: '',
  slug: '',
  subtitle: '',
  speaker: '',
  conductor: '',
  description: '',
  dateRange: '',
  timeRange: '',
  location: '',
  category: 'family',
  status: 'Registration Open',
  total: '120',
  male: '60',
  female: '60',
  price: '2500',
  isPaid: true,
  imageSrc: defaultImage,
  detailHref: '',
  ctaHref: '',
}

export const mapRetreatToForm = (retreat: RetreatType): RetreatFormValues => ({
  title: retreat.title ?? '',
  slug: retreat.slug ?? '',
  subtitle: retreat.subtitle ?? '',
  speaker: retreat.speaker ?? '',
  conductor: retreat.conductor ?? '',
  description: retreat.description ?? '',
  dateRange: retreat.dateRange ?? '',
  timeRange: retreat.timeRange ?? '',
  location: retreat.location ?? '',
  category: retreat.category ?? 'family',
  status: retreat.status ?? 'Registration Open',
  total: String(retreat.availability.total ?? 0),
  male: String(retreat.availability.male ?? 0),
  female: String(retreat.availability.female ?? 0),
  price: retreat.price != null ? String(retreat.price) : '0',
  isPaid: retreat.isPaid ?? true,
  imageSrc: retreat.imageSrc ?? defaultImage,
  detailHref: retreat.detailHref ?? '',
  ctaHref: retreat.ctaHref ?? '',
})

export const buildPayload = (form: RetreatFormValues) => ({
  slug: form.slug || slugify(form.title),
  title: form.title,
  subtitle: form.subtitle || null,
  speaker: form.speaker,
  conductor: form.conductor,
  description: form.description,
  dateRange: form.dateRange,
  timeRange: form.timeRange,
  location: form.location,
  category: form.category,
  status: form.status,
  imageSrc: form.imageSrc || defaultImage,
  detailHref: form.detailHref || `/events/${form.slug || slugify(form.title)}`,
  ctaHref: form.ctaHref || `/events/${form.slug || slugify(form.title)}#booking`,
  price: form.price ? Number(form.price) : null,
  isPaid: form.isPaid,
  availability: {
    total: Number(form.total) || 0,
    male: Number(form.male) || 0,
    female: Number(form.female) || 0,
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
          <Label htmlFor='retreat-slug'>Slug</Label>
          <Input
            id='retreat-slug'
            placeholder='divine-mercy-encounter'
            value={form.slug}
            onChange={(event) => onChange('slug', slugify(event.target.value))}
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
          <Label htmlFor='retreat-date'>Date range</Label>
          <Input
            id='retreat-date'
            placeholder='Apr 10 – Apr 13, 2026'
            value={form.dateRange}
            onChange={(event) => onChange('dateRange', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-time'>Time range</Label>
          <Input
            id='retreat-time'
            placeholder='Thursday 9:00 AM – Sunday 6:00 PM'
            value={form.timeRange}
            onChange={(event) => onChange('timeRange', event.target.value)}
          />
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
            onChange={(event) => onChange('category', event.target.value as RetreatType['category'])}
            className='h-10 rounded-lg border border-slate-200 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'>
            {categoryOptions.map((option) => (
              <option key={option} value={option} className='capitalize'>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-status'>Status</Label>
          <select
            id='retreat-status'
            value={form.status}
            onChange={(event) => onChange('status', event.target.value as RetreatType['status'])}
            className='h-10 rounded-lg border border-slate-200 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'>
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
          <Input
            id='retreat-total'
            type='number'
            min={0}
            value={form.total}
            onChange={(event) => onChange('total', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-male'>Male seats</Label>
          <Input
            id='retreat-male'
            type='number'
            min={0}
            value={form.male}
            onChange={(event) => onChange('male', event.target.value)}
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
          />
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-price'>Price (TSh)</Label>
          <Input
            id='retreat-price'
            type='number'
            min={0}
            value={form.price}
            onChange={(event) => onChange('price', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-image'>Hero image</Label>
          <Input
            id='retreat-image'
            placeholder='/images/dmrc/gallery/IMG_0299.JPG'
            value={form.imageSrc}
            onChange={(event) => onChange('imageSrc', event.target.value)}
          />
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='retreat-detail'>Detail link</Label>
          <Input
            id='retreat-detail'
            placeholder='/events/divine-mercy-retreat'
            value={form.detailHref}
            onChange={(event) => onChange('detailHref', event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='retreat-cta'>CTA link</Label>
          <Input
            id='retreat-cta'
            placeholder='/events/divine-mercy-retreat#booking'
            value={form.ctaHref}
            onChange={(event) => onChange('ctaHref', event.target.value)}
          />
        </div>
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
  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<RetreatFormValues>(emptyForm)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RetreatFormValues>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<RetreatType | null>(null)

  const {
    data: retreatsPayload,
    isLoading: retreatsLoading,
  } = useQuery({ queryKey: ['retreats'], queryFn: fetchRetreats })

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

  const totalCapacity = useMemo(
    () => retreats.reduce((acc, retreat) => acc + (retreat.availability.total ?? 0), 0),
    [retreats],
  )
  const totalBooked = useMemo(
    () => bookings.filter((booking) => booking.status !== 'cancelled').length,
    [bookings],
  )
  const paidBookings = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'paid').length,
    [bookings],
  )

  const handleOpenCreate = () => {
    if (!guardReadOnlyAction()) return
    setCreateForm(emptyForm)
    setIsCreateOpen(true)
  }

  const handleSaveNew = () => {
    if (createMutation.isLoading || !guardReadOnlyAction()) return
    createMutation.mutate(createForm)
  }

  const handleOpenEdit = (retreat: RetreatType) => {
    if (!guardReadOnlyAction()) return
    setEditId(retreat.id)
    setEditForm(mapRetreatToForm(retreat))
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editId || updateMutation.isLoading || !guardReadOnlyAction()) return
    updateMutation.mutate({ id: editId, payload: editForm })
  }

  const handleDuplicate = (retreat: RetreatType) => {
    if (!guardReadOnlyAction()) return
    const next = mapRetreatToForm(retreat)
    next.slug = ''
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
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Retreat command center</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Retreats & attendance dashboard</h1>
          <p className='text-sm text-slate-500'>Curate retreat experiences, manage capacity, and verify attendance in one elegant workspace.</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' onClick={() => queryClient.invalidateQueries({ queryKey: ['retreats'] })} className='gap-2'>
            <Loader2 className='h-4 w-4 animate-spin text-slate-400' />
            Refresh
          </Button>
          <Button className='gap-2' onClick={handleOpenCreate} disabled={isReadOnlyData}>
            <Plus className='h-4 w-4' />
            New retreat
          </Button>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-semibold text-slate-800 flex items-center gap-2'>
              <Users2 className='h-4 w-4 text-primary' />
              Booked guests
            </CardTitle>
            <CardDescription>Guests registered across all retreats</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold text-slate-900'>{totalBooked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-semibold text-slate-800 flex items-center gap-2'>
              <CalendarDays className='h-4 w-4 text-primary' />
              Active retreats
            </CardTitle>
            <CardDescription>Retreats currently open for registration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold text-slate-900'>{retreats.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-semibold text-slate-800 flex items-center gap-2'>
              <CircleDollarSign className='h-4 w-4 text-primary' />
              Paid conversions
            </CardTitle>
            <CardDescription>Confirmed payments awaiting attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold text-slate-900'>{paidBookings}</p>
          </CardContent>
        </Card>
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
                        {retreat.subtitle ? (
                          <p className='text-xs text-slate-500 line-clamp-1'>{retreat.subtitle}</p>
                        ) : null}
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
                        <p className='font-semibold text-slate-800'>{retreat.availability.total} seats</p>
                        <p className='text-xs text-slate-500'>Male {retreat.availability.male} • Female {retreat.availability.female}</p>
                      </div>
                    </TableCell>
                    <TableCell className='align-top text-sm text-slate-600'>
                      {retreat.isPaid === false ? (
                        <Badge variant='success'>Sponsored</Badge>
                      ) : (
                        <div className='space-y-1'>
                          <p className='font-semibold text-slate-800'>
                            {formatCurrencyValue(retreat.price ?? 0, currencyConfig)}
                          </p>
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
                          <DropdownMenuItem onSelect={() => handleOpenEdit(retreat)} className='gap-2' disabled={isReadOnlyData}>
                            <PencilLine className='h-4 w-4 text-primary' /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDuplicate(retreat)} className='gap-2' disabled={isReadOnlyData}>
                            <Users2 className='h-4 w-4 text-slate-500' /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleRequestDelete(retreat)}
                            className='gap-2 text-red-600 focus:bg-red-100/80'
                            disabled={isReadOnlyData}>
                            <Trash2 className='h-4 w-4' /> Delete
                          </DropdownMenuItem>
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

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-lg font-semibold text-slate-900'>Booking + attendance queue</CardTitle>
            <CardDescription>Monitor payment progression, attendance confirmation, and reschedules.</CardDescription>
          </div>
          <Badge variant='outline'>Total {bookings.length}</Badge>
        </CardHeader>
        <CardContent className='space-y-4'>
          {bookings.length === 0 ? (
            <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500'>
              No bookings yet. Invite guests to experience the mercy weekend.
            </p>
          ) : (
            bookings.slice(0, 6).map((booking) => (
              <div key={booking.id} className='rounded-xl border border-slate-200 px-4 py-3 shadow-sm'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-slate-900'>{booking.fullName}</p>
                    <p className='text-xs text-slate-500'>{booking.email}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='uppercase tracking-[0.25em] text-xs'>
                      {booking.status}
                    </Badge>
                    <Badge variant={booking.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                <p className='mt-2 text-xs text-slate-500'>Retreat: {booking.retreatTitle}</p>
              </div>
            ))
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
        }}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Create a new retreat</DialogTitle>
            <DialogDescription>Share the essentials of your retreat and publish immediately to the site.</DialogDescription>
          </DialogHeader>
          <RetreatFormFields form={createForm} onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))} />
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsCreateOpen(false)} disabled={createMutation.isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveNew} disabled={createMutation.isLoading} className='gap-2'>
              {createMutation.isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Plus className='h-4 w-4' />}
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
        }}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Edit retreat details</DialogTitle>
            <DialogDescription>Update schedules, pricing, and availability in real-time.</DialogDescription>
          </DialogHeader>
          <RetreatFormFields form={editForm} onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))} />
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsEditOpen(false)} disabled={updateMutation.isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isLoading} className='gap-2'>
              {updateMutation.isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <PencilLine className='h-4 w-4' />}
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
        }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete retreat</DialogTitle>
            <DialogDescription>
              This action permanently removes <span className='font-semibold text-slate-900'>{deleteTarget?.title}</span> and all associated
              bookings. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isLoading}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              className='gap-2'
              disabled={deleteMutation.isLoading}
              onClick={() => {
                if (!deleteTarget) return
                if (!guardReadOnlyAction()) return
                deleteMutation.mutate(deleteTarget.id)
              }}>
              {deleteMutation.isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
              Delete retreat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RetreatDashboard

