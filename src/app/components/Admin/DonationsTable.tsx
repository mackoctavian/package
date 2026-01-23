"use client"

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { CreditCard, HandCoins, Loader2, Mail, Phone, RefreshCw, User2 } from 'lucide-react'

type DonationRecord = {
  id: string
  fullName: string
  email: string
  phone: string
  amount: number
  currency: string
  paymentMethod: string
  prayerIntention?: string | null
  status: string
  paymentStatus: string
  createdAt: string
}

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
}

const paymentStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const paymentLabels: Record<string, string> = {
  card: 'Card',
  mobile: 'Mobile Money',
  bank: 'Bank Transfer',
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: currency || 'TZS',
    maximumFractionDigits: 0,
  }).format(amount)

export function DonationsTable() {
  const donationQuery = useQuery({
    queryKey: ['donations'],
    queryFn: async (): Promise<DonationRecord[]> => {
      const response = await fetch('/api/donations', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to load donations.')
      }
      return (await response.json()).data ?? []
    },
  })

  const stats = useMemo(() => {
    const items = donationQuery.data ?? []
    const lastSevenDays = new Date()
    lastSevenDays.setDate(lastSevenDays.getDate() - 7)

    return {
      total: items.length,
      pending: items.filter((item) => item.paymentStatus === 'pending').length,
      weekly: items.filter((item) => new Date(item.createdAt) >= lastSevenDays).length,
    }
  }, [donationQuery.data])

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Donations</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Mission partners</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>
            Track submitted gifts, payment methods, and prayer intentions from the donation page.
          </p>
        </div>
        <Button variant='outline' onClick={() => donationQuery.refetch()} disabled={donationQuery.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${donationQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total donations</CardDescription>
            <CardTitle className='text-3xl'>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Pending payments</CardDescription>
            <CardTitle className='text-3xl'>{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Past 7 days</CardDescription>
            <CardTitle className='text-3xl'>{stats.weekly}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Donations</CardTitle>
          <CardDescription>Newest gifts appear first.</CardDescription>
        </CardHeader>
        <CardContent>
          {donationQuery.isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading donations…
            </div>
          ) : (donationQuery.data?.length ?? 0) === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500'>
              <HandCoins className='h-6 w-6 text-slate-400' />
              <p>No donations yet. Submissions will appear here.</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {donationQuery.data?.map((record) => (
                <div key={record.id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <p className='text-base font-semibold text-slate-900 flex items-center gap-2'>
                        <User2 className='h-4 w-4 text-slate-400' />
                        {record.fullName}
                      </p>
                      <div className='mt-1 flex flex-wrap gap-4 text-sm text-slate-500'>
                        <span className='inline-flex items-center gap-1'>
                          <Mail className='h-3.5 w-3.5' />
                          {record.email}
                        </span>
                        <span className='inline-flex items-center gap-1'>
                          <Phone className='h-3.5 w-3.5' />
                          {record.phone}
                        </span>
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge className={statusStyles[record.status] ?? 'bg-slate-100 text-slate-600'}>{record.status}</Badge>
                      <Badge className={paymentStyles[record.paymentStatus] ?? 'bg-slate-100 text-slate-600'}>
                        {record.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className='mt-4 grid gap-3 md:grid-cols-2'>
                    <div className='rounded-xl bg-slate-50 p-4 text-sm text-slate-600'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1'>Gift</p>
                      <p className='text-lg font-semibold text-slate-900'>
                        {formatCurrency(record.amount, record.currency)}
                      </p>
                      <p className='mt-2 text-slate-700 flex items-center gap-2'>
                        <CreditCard className='h-4 w-4 text-slate-400' />
                        {paymentLabels[record.paymentMethod] ?? record.paymentMethod}
                      </p>
                    </div>
                    <div className='rounded-xl bg-slate-50 p-4 text-sm text-slate-600'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1'>Prayer Intention</p>
                      <p className='text-slate-700 whitespace-pre-line'>
                        {record.prayerIntention || '—'}
                      </p>
                    </div>
                  </div>

                  <p className='mt-3 text-xs text-slate-500'>Received {formatDate(record.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
