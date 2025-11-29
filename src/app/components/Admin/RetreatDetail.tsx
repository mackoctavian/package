'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  PencilLine,
  Users2,
  ScanLine,
  UserCheck,
  QrCode,
} from 'lucide-react'

import type { RetreatType } from '@/app/types/retreat'
import type { RetreatBooking } from '@/app/types/retreat-booking'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  buildPayload,
  emptyForm,
  mapRetreatToForm,
  RetreatFormFields,
  type RetreatFormValues,
} from '@/app/components/Admin/RetreatDashboard'
import { formatCurrencyValue, getCurrencyConfig } from '@dashboard/lib/currency'

type RetreatDetailPayload = {
  data?: RetreatType
}

const fetchRetreatDetail = async (retreatId: string): Promise<RetreatDetailPayload> => {
  const response = await fetch(`/api/retreats/${retreatId}`, { cache: 'no-store' })
  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message.error ?? 'Unable to load retreat details.')
  }
  return response.json()
}

const formatPhone = (value: string | null | undefined) => (value && value.trim().length ? value : '—')

interface RetreatDetailProps {
  retreatId: string
}

const RetreatDetail = ({ retreatId }: RetreatDetailProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currencyConfig = useMemo(() => getCurrencyConfig(), [])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [form, setForm] = useState<RetreatFormValues>({ ...emptyForm })

  const {
    data: payload,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['retreat', retreatId],
    queryFn: () => fetchRetreatDetail(retreatId),
  })

  const retreat = payload?.data

  useEffect(() => {
    if (retreat) {
      setForm(mapRetreatToForm(retreat))
    }
  }, [retreat])

  const updateMutation = useMutation({
    mutationFn: async (values: RetreatFormValues) => {
      const response = await fetch(`/api/retreats/${retreatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(values)),
      })
      if (!response.ok) {
        const message = await response.json().catch(() => ({}))
        throw new Error(message.error ?? 'Unable to update retreat.')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Retreat updated')
      queryClient.invalidateQueries({ queryKey: ['retreats'] })
      queryClient.invalidateQueries({ queryKey: ['retreat', retreatId] })
      setIsEditOpen(false)
    },
    onError: (mutationError: unknown) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Update failed')
    },
  })

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Button variant='ghost' size='sm' className='w-fit' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to retreats
        </Button>
        <Card>
          <CardContent className='flex h-48 items-center justify-center text-sm text-slate-500'>Loading retreat…</CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !retreat) {
    return (
      <div className='space-y-6'>
        <Button variant='ghost' size='sm' className='w-fit' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to retreats
        </Button>
        <Card>
          <CardContent className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-red-600'>
            <p>{error instanceof Error ? error.message : 'Unable to load this retreat.'}</p>
            <Button variant='outline' size='sm' onClick={() => queryClient.invalidateQueries({ queryKey: ['retreat', retreatId] })}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bookings = (retreat.bookings ?? []) as RetreatBooking[]
  const confirmedCount = bookings.filter((booking) => booking.status === 'confirmed').length
  const paidCount = bookings.filter((booking) => booking.paymentStatus === 'paid').length

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Button variant='ghost' size='sm' className='w-fit px-0 text-primary hover:text-primary/80' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to retreats
          </Button>
          <div>
            <h1 className='text-3xl font-semibold text-slate-900'>{retreat.title}</h1>
            <p className='text-sm text-slate-500'>Manage every detail, booking, and update for this retreat.</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Badge variant='outline' className='uppercase tracking-[0.25em] text-xs'>
            {retreat.status}
          </Badge>
          <Button className='gap-2' onClick={() => setIsEditOpen(true)}>
            <PencilLine className='h-4 w-4' /> Edit retreat
          </Button>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
        <Card>
          <CardHeader className='pb-4'>
            <CardTitle className='text-lg'>Retreat summary</CardTitle>
            <CardDescription>Dates, pricing, and logistics surfaced for quick reference.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2'>
            <div className='flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4'>
              <CalendarDays className='mt-1 h-4 w-4 text-primary' />
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Schedule</p>
                <p className='text-sm font-semibold text-slate-900'>{retreat.dateRange}</p>
                <p className='text-xs text-slate-500'>{retreat.timeRange}</p>
              </div>
            </div>
            <div className='flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4'>
              <MapPin className='mt-1 h-4 w-4 text-primary' />
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Venue</p>
                <p className='text-sm font-semibold text-slate-900'>{retreat.location}</p>
                <p className='text-xs text-slate-500 capitalize'>{retreat.category} retreat</p>
              </div>
            </div>
            <div className='flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4'>
              <CircleDollarSign className='mt-1 h-4 w-4 text-primary' />
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Investment</p>
                <p className='text-sm font-semibold text-slate-900'>
                  {retreat.isPaid === false
                    ? 'Sponsored / Free'
                    : formatCurrencyValue(retreat.price ?? 0, currencyConfig)}
                </p>
                <p className='text-xs text-slate-500'>Capacity {retreat.availability.total} guests</p>
              </div>
            </div>
            <div className='flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4'>
              <Users2 className='mt-1 h-4 w-4 text-primary' />
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Bookings</p>
                <p className='text-sm font-semibold text-slate-900'>{bookings.length} reservations</p>
                <p className='text-xs text-slate-500'>{paidCount} paid · {confirmedCount} confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='h-full'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-lg'>Quick actions</CardTitle>
            <CardDescription>Helpful shortcuts for retreat operations.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button className='w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700' asChild>
              <Link href={`/admin/retreats/${retreat.id}/attendees`}>
                <UserCheck className='h-4 w-4' /> Manage Attendees & Check-in
              </Link>
            </Button>
            <Button variant='outline' className='w-full justify-start gap-3' asChild>
              <Link href={`/admin/retreats/${retreat.id}/attendees`}>
                <ScanLine className='h-4 w-4' /> Scan QR Codes
              </Link>
            </Button>
            <Button variant='outline' className='w-full justify-start gap-3' asChild>
              <Link href={retreat.detailHref} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-4 w-4' /> View public retreat page
              </Link>
            </Button>
            <Button variant='outline' className='w-full justify-start gap-3' asChild>
              <Link href={retreat.ctaHref} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-4 w-4' /> Open registration form
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>Bookings for this retreat</CardTitle>
            <CardDescription>Every submission, payment update, and attendance status in one place.</CardDescription>
          </div>
          <Badge variant='outline'>Total {bookings.length}</Badge>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className='rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm text-slate-500'>
              No bookings yet. Once guests register, they will appear here automatically.
            </p>
          ) : (
            <div className='overflow-hidden rounded-xl border border-slate-200'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className='font-medium'>{booking.fullName}</TableCell>
                      <TableCell>{booking.email}</TableCell>
                      <TableCell>{formatPhone(booking.phone)}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className='uppercase tracking-[0.2em] text-xs'>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Edit retreat</DialogTitle>
            <DialogDescription>Update copy, logistics, and pricing for this retreat.</DialogDescription>
          </DialogHeader>
          <RetreatFormFields form={form} onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))} />
          <DialogFooter>
            <Button variant='ghost' onClick={() => setIsEditOpen(false)} disabled={updateMutation.isLoading}>
              Cancel
            </Button>
            <Button className='gap-2' onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <PencilLine className='h-4 w-4' />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RetreatDetail
