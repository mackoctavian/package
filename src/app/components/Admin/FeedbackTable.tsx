"use client"

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Loader2, Mail, MessageSquare, Phone, RefreshCw, User2 } from 'lucide-react'

type FeedbackRecord = {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  message: string
  status: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

export function FeedbackTable() {
  const feedbackQuery = useQuery({
    queryKey: ['feedback'],
    queryFn: async (): Promise<FeedbackRecord[]> => {
      const response = await fetch('/api/feedback', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to load feedback.')
      }
      return (await response.json()).data ?? []
    },
  })

  const stats = useMemo(() => {
    const items = feedbackQuery.data ?? []
    const lastSevenDays = new Date()
    lastSevenDays.setDate(lastSevenDays.getDate() - 7)

    return {
      total: items.length,
      unread: items.filter((item) => item.status === 'new').length,
      weekly: items.filter((item) => new Date(item.createdAt) >= lastSevenDays).length,
    }
  }, [feedbackQuery.data])

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Feedback inbox</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Visitor messages</h1>
          <p className='text-sm text-slate-500 max-w-2xl'>
            Review every submission that comes through the homepage contact form, including sender details and message content.
          </p>
        </div>
        <Button variant='outline' onClick={() => feedbackQuery.refetch()} disabled={feedbackQuery.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${feedbackQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total messages</CardDescription>
            <CardTitle className='text-3xl'>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Unread</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Messages</CardTitle>
          <CardDescription>Newest submissions appear first.</CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackQuery.isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-slate-500'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading feedback…
            </div>
          ) : (feedbackQuery.data?.length ?? 0) === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500'>
              <MessageSquare className='h-6 w-6 text-slate-400' />
              <p>No feedback yet. Messages sent via the homepage form will show up here.</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {feedbackQuery.data?.map((record) => (
                <div key={record.id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <p className='text-base font-semibold text-slate-900 flex items-center gap-2'>
                        <User2 className='h-4 w-4 text-slate-400' />
                        {record.firstName} {record.lastName}
                      </p>
                      <div className='mt-1 flex flex-wrap gap-4 text-sm text-slate-500'>
                        <span className='inline-flex items-center gap-1'>
                          <Mail className='h-3.5 w-3.5' />
                          {record.email}
                        </span>
                        {record.phoneNumber && (
                          <span className='inline-flex items-center gap-1'>
                            <Phone className='h-3.5 w-3.5' />
                            {record.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={statusStyles[record.status] ?? 'bg-slate-100 text-slate-600'}>{record.status}</Badge>
                  </div>
                  <div className='mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 whitespace-pre-line'>
                    {record.message}
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


