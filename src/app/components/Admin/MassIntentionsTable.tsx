"use client"

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Calendar, HeartHandshake, Loader2, Mail, Phone, RefreshCw, User2 } from 'lucide-react'

type MassIntentionRecord = {
  id: string
  fullName: string
  email: string
  phone: string
  intentionType: string
  intentionFor: string
  intentionDetails: string
  preferredDate?: string | null
  numberOfMasses: number
  donationAmount?: string | null
  status: string
  createdAt: string
}

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
}

const intentionLabels: Record<string, string> = {
  thanksgiving: 'Thanksgiving',
  healing: 'Healing',
  deceased: 'For the Deceased',
  special: 'Special Intention',
  family: 'Family Blessing',
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

export function MassIntentionsTable() {
  const intentionsQuery = useQuery({
    queryKey: ['mass-intentions'],
    queryFn: async (): Promise<MassIntentionRecord[]> => {
      const response = await fetch('/api/mass-intentions', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to load mass intentions.')
      }
      return (await response.json()).data ?? []
    },
  })

  const stats = useMemo(() => {
    const items = intentionsQuery.data ?? []
    const lastSevenDays = new Date()
    lastSevenDays.setDate(lastSevenDays.getDate() - 7)

    return {
      total: items.length,
      unread: items.filter((item) => item.status === 'new').length,
      weekly: items.filter((item) => new Date(item.createdAt) >= lastSevenDays).length,
    }
  }, [intentionsQuery.data])

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Mass intentions</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Prayer requests</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>
            Review every mass intention submitted from the website and prepare them for the upcoming liturgies.
          </p>
        </div>
        <Button variant='outline' onClick={() => intentionsQuery.refetch()} disabled={intentionsQuery.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${intentionsQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total intentions</CardDescription>
            <CardTitle className='text-3xl'>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>New</CardDescription>
            <CardTitle className='text-3xl'>{stats.unread}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Past 7 days</CardDescription>
            <CardTitle className='text-3xl'>{stats.weekly}</CardTitle>
          </CardHeader>
        </Card>
      </div>
\n+      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Submissions</CardTitle>
          <CardDescription>Newest submissions appear first.</CardDescription>
        </CardHeader>
        <CardContent>
          {intentionsQuery.isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading intentions…
            </div>
          ) : (intentionsQuery.data?.length ?? 0) === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500'>
              <HeartHandshake className='h-6 w-6 text-slate-400' />
              <p>No mass intentions yet. Submissions will appear here.</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {intentionsQuery.data?.map((record) => (
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
                    <Badge className={statusStyles[record.status] ?? 'bg-slate-100 text-slate-600'}>{record.status}</Badge>
                  </div>
\n+                  <div className='mt-4 grid gap-3 md:grid-cols-2'>
                    <div className='rounded-xl bg-slate-50 p-4 text-sm text-slate-600'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1'>Intention</p>
                      <p className='font-medium text-slate-800'>
                        {intentionLabels[record.intentionType] ?? record.intentionType}
                      </p>
                      <p className='mt-2 text-slate-700'>{record.intentionFor}</p>
                    </div>
                    <div className='rounded-xl bg-slate-50 p-4 text-sm text-slate-600'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1'>Schedule</p>
                      <p className='flex items-center gap-2 text-slate-700'>
                        <Calendar className='h-4 w-4 text-slate-400' />
                        Preferred date: {formatDate(record.preferredDate)}
                      </p>
                      <p className='mt-2 text-slate-700'>Masses requested: {record.numberOfMasses}</p>
                      {record.donationAmount ? (
                        <p className='mt-1 text-slate-700'>Offering: TZS {record.donationAmount}</p>
                      ) : null}
                    </div>
                  </div>
\n+                  <div className='mt-4 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600 whitespace-pre-line'>
                    {record.intentionDetails}
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
