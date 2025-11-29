'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Mail,
  Phone,
  QrCode,
  Search,
  ScanLine,
  UserCheck,
  UserX,
  Users2,
  X,
  XCircle,
  Camera,
  AlertTriangle,
  Ticket,
  CalendarDays,
  MapPin,
} from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Input } from '@/app/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { cn } from '@/lib/utils'

type Booking = {
  id: string
  retreatId: string
  retreatTitle: string
  fullName: string
  email: string
  phone: string
  whatsapp?: string
  status: string
  paymentStatus: string
  attended: boolean
  checkedInAt?: string
  ticketCode?: string
  approvedAt?: string
  createdAt: string
}

type RetreatInfo = {
  id: string
  title: string
  dateRange: string
  location: string
  availabilityTotal: number
}

type Stats = {
  total: number
  pending: number
  approved: number
  cancelled: number
  attended: number
  paid: number
}

export default function RetreatAttendeesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const retreatId = params.id as string

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [manualCode, setManualCode] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Fetch attendees
  const { data, isLoading, error } = useQuery({
    queryKey: ['retreat-attendees', retreatId],
    queryFn: async () => {
      const res = await fetch(`/api/retreats/${retreatId}/attendees`)
      if (!res.ok) throw new Error('Failed to fetch attendees')
      return res.json()
    },
  })

  const bookings: Booking[] = data?.data ?? []
  const retreat: RetreatInfo = data?.retreat
  const stats: Stats = data?.stats ?? { total: 0, pending: 0, approved: 0, cancelled: 0, attended: 0, paid: 0 }

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/retreats/bookings/${bookingId}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to approve')
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Booking approved! Ticket: ${data.ticketCode}`)
      queryClient.invalidateQueries({ queryKey: ['retreat-attendees', retreatId] })
    },
    onError: () => toast.error('Failed to approve booking'),
  })

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/retreats/bookings/${bookingId}/checkin`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to check in')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Check-in successful!')
      queryClient.invalidateQueries({ queryKey: ['retreat-attendees', retreatId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Undo check-in mutation
  const undoCheckinMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/retreats/bookings/${bookingId}/checkin`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to undo check-in')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Check-in undone')
      queryClient.invalidateQueries({ queryKey: ['retreat-attendees', retreatId] })
    },
    onError: () => toast.error('Failed to undo check-in'),
  })

  // Scan QR code mutation
  const scanMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      const res = await fetch('/api/retreats/bookings/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      setScanResult(data)
      if (data.valid && !data.alreadyCheckedIn) {
        toast.success(`${data.booking.fullName} checked in!`)
      } else if (data.alreadyCheckedIn) {
        toast.success(`${data.booking.fullName} was already checked in`)
      } else {
        toast.error(data.error || 'Invalid ticket')
      }
      queryClient.invalidateQueries({ queryKey: ['retreat-attendees', retreatId] })
    },
    onError: () => toast.error('Scan failed'),
  })

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone.includes(searchQuery) ||
      booking.ticketCode?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'pending' && booking.status === 'pending') ||
      (statusFilter === 'approved' && booking.status === 'approved') ||
      (statusFilter === 'attended' && booking.attended) ||
      (statusFilter === 'not-attended' && booking.status === 'approved' && !booking.attended)

    return matchesSearch && matchesStatus
  })

  const handleManualScan = () => {
    if (manualCode.trim()) {
      scanMutation.mutate(manualCode.trim())
      setManualCode('')
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-slate-400' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-96 flex-col items-center justify-center gap-4'>
        <XCircle className='h-12 w-12 text-red-400' />
        <p className='text-slate-600'>Failed to load attendees</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className='space-y-6 pb-10'>
      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <Link href='/admin/retreats' className='inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-2'>
            <ArrowLeft className='h-4 w-4' /> Back to Retreats
          </Link>
          <h1 className='text-2xl font-bold text-slate-900'>{retreat?.title || 'Retreat'} Attendees</h1>
          <div className='flex items-center gap-4 mt-1 text-sm text-slate-500'>
            {retreat?.dateRange && (
              <span className='flex items-center gap-1'>
                <CalendarDays className='h-4 w-4' /> {retreat.dateRange}
              </span>
            )}
            {retreat?.location && (
              <span className='flex items-center gap-1'>
                <MapPin className='h-4 w-4' /> {retreat.location}
              </span>
            )}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' onClick={() => setIsScannerOpen(true)} className='gap-2'>
            <ScanLine className='h-4 w-4' /> Scan QR
          </Button>
          <Button variant='outline' className='gap-2'>
            <Download className='h-4 w-4' /> Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        <StatCard label='Total' value={stats.total} icon={Users2} color='blue' />
        <StatCard label='Pending' value={stats.pending} icon={Clock} color='yellow' />
        <StatCard label='Approved' value={stats.approved} icon={CheckCircle2} color='green' />
        <StatCard label='Attended' value={stats.attended} icon={UserCheck} color='emerald' />
        <StatCard label='Not Attended' value={stats.approved - stats.attended} icon={UserX} color='orange' />
        <StatCard label='Paid' value={stats.paid} icon={Ticket} color='purple' />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='relative flex-1 min-w-[250px]'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
              <Input
                placeholder='Search by name, email, phone, or ticket code...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <div className='flex items-center gap-2'>
              {['all', 'pending', 'approved', 'attended', 'not-attended'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setStatusFilter(status)}
                  className='capitalize'
                >
                  {status === 'not-attended' ? 'Not Attended' : status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendees List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendees ({filteredBookings.length})</CardTitle>
          <CardDescription>Manage bookings, approvals, and check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Users2 className='h-12 w-12 text-slate-300 mb-4' />
              <p className='text-slate-500'>No attendees found</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredBookings.map((booking) => (
                <AttendeeCard
                  key={booking.id}
                  booking={booking}
                  onApprove={() => approveMutation.mutate(booking.id)}
                  onCheckin={() => checkinMutation.mutate(booking.id)}
                  onUndoCheckin={() => undoCheckinMutation.mutate(booking.id)}
                  onViewDetails={() => setSelectedBooking(booking)}
                  isApproving={approveMutation.isPending}
                  isCheckingIn={checkinMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <QrCode className='h-5 w-5' /> QR Code Scanner
            </DialogTitle>
            <DialogDescription>
              Scan a ticket QR code to automatically check in the attendee
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Camera Scanner Placeholder */}
            <div className='relative aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center'>
              <div className='text-center text-white/70'>
                <Camera className='h-16 w-16 mx-auto mb-4 opacity-50' />
                <p className='text-sm'>Camera scanner</p>
                <p className='text-xs opacity-60'>Use manual entry below</p>
              </div>
              {/* Scanner frame overlay */}
              <div className='absolute inset-8 border-2 border-white/30 rounded-lg'>
                <div className='absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg' />
                <div className='absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg' />
                <div className='absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg' />
                <div className='absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg' />
              </div>
            </div>

            {/* Manual Entry */}
            <div className='space-y-2'>
              <p className='text-sm font-medium text-slate-700'>Manual Entry</p>
              <div className='flex gap-2'>
                <Input
                  placeholder='Enter ticket code (e.g., DMRC-XXXXXXXX)'
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                />
                <Button onClick={handleManualScan} disabled={scanMutation.isPending}>
                  {scanMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Check className='h-4 w-4' />}
                </Button>
              </div>
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div className={cn(
                'rounded-xl p-4 border',
                scanResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              )}>
                {scanResult.valid ? (
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='h-6 w-6 text-green-600 flex-shrink-0' />
                    <div>
                      <p className='font-semibold text-green-900'>{scanResult.booking.fullName}</p>
                      <p className='text-sm text-green-700'>{scanResult.booking.retreat?.title}</p>
                      {scanResult.alreadyCheckedIn && (
                        <p className='text-xs text-green-600 mt-1'>Already checked in</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='flex items-start gap-3'>
                    <XCircle className='h-6 w-6 text-red-600 flex-shrink-0' />
                    <div>
                      <p className='font-semibold text-red-900'>Invalid Ticket</p>
                      <p className='text-sm text-red-700'>{scanResult.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => { setIsScannerOpen(false); setScanResult(null) }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-slate-500'>Name</p>
                  <p className='font-semibold'>{selectedBooking.fullName}</p>
                </div>
                <div>
                  <p className='text-sm text-slate-500'>Email</p>
                  <p className='font-semibold'>{selectedBooking.email}</p>
                </div>
                <div>
                  <p className='text-sm text-slate-500'>Phone</p>
                  <p className='font-semibold'>{selectedBooking.phone}</p>
                </div>
                <div>
                  <p className='text-sm text-slate-500'>Status</p>
                  <Badge variant={selectedBooking.status === 'approved' ? 'success' : 'warning'}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm text-slate-500'>Payment</p>
                  <Badge variant={selectedBooking.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {selectedBooking.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm text-slate-500'>Attended</p>
                  <Badge variant={selectedBooking.attended ? 'success' : 'outline'}>
                    {selectedBooking.attended ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              {selectedBooking.ticketCode && (
                <div className='p-4 bg-slate-50 rounded-xl text-center'>
                  <p className='text-sm text-slate-500 mb-1'>Ticket Code</p>
                  <p className='text-2xl font-mono font-bold text-slate-900'>{selectedBooking.ticketCode}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setSelectedBooking(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  return (
    <Card className={cn('border', colorClasses[color])}>
      <CardContent className='pt-4 pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-2xl font-bold'>{value}</p>
            <p className='text-xs font-medium opacity-80'>{label}</p>
          </div>
          <Icon className='h-8 w-8 opacity-40' />
        </div>
      </CardContent>
    </Card>
  )
}

function AttendeeCard({ 
  booking, 
  onApprove, 
  onCheckin, 
  onUndoCheckin,
  onViewDetails,
  isApproving,
  isCheckingIn,
}: { 
  booking: Booking
  onApprove: () => void
  onCheckin: () => void
  onUndoCheckin: () => void
  onViewDetails: () => void
  isApproving: boolean
  isCheckingIn: boolean
}) {
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      booking.attended ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300'
    )}>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        {/* Info */}
        <div className='flex items-center gap-4'>
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
            booking.attended ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-600'
          )}>
            {booking.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <p className='font-semibold text-slate-900'>{booking.fullName}</p>
              {booking.attended && (
                <Badge variant='success' className='gap-1'>
                  <CheckCircle2 className='h-3 w-3' /> Attended
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-3 mt-1 text-sm text-slate-500'>
              <span className='flex items-center gap-1'>
                <Mail className='h-3 w-3' /> {booking.email}
              </span>
              <span className='flex items-center gap-1'>
                <Phone className='h-3 w-3' /> {booking.phone}
              </span>
            </div>
            {booking.ticketCode && (
              <p className='text-xs font-mono text-slate-400 mt-1'>
                <Ticket className='h-3 w-3 inline mr-1' />
                {booking.ticketCode}
              </p>
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className='flex items-center gap-2'>
          <Badge variant={booking.status === 'approved' ? 'success' : booking.status === 'pending' ? 'warning' : 'outline'}>
            {booking.status}
          </Badge>
          <Badge variant={booking.paymentStatus === 'paid' ? 'success' : 'warning'}>
            {booking.paymentStatus}
          </Badge>

          {/* Actions */}
          <div className='flex items-center gap-1 ml-2'>
            {booking.status === 'pending' && (
              <Button size='sm' onClick={onApprove} disabled={isApproving} className='gap-1'>
                {isApproving ? <Loader2 className='h-3 w-3 animate-spin' /> : <Check className='h-3 w-3' />}
                Approve
              </Button>
            )}
            {booking.status === 'approved' && !booking.attended && (
              <Button size='sm' variant='outline' onClick={onCheckin} disabled={isCheckingIn} className='gap-1'>
                {isCheckingIn ? <Loader2 className='h-3 w-3 animate-spin' /> : <UserCheck className='h-3 w-3' />}
                Check In
              </Button>
            )}
            {booking.attended && (
              <Button size='sm' variant='ghost' onClick={onUndoCheckin} className='gap-1 text-slate-500'>
                <X className='h-3 w-3' /> Undo
              </Button>
            )}
            <Button size='sm' variant='ghost' onClick={onViewDetails}>
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

