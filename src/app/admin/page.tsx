import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  HandCoins,
  HeartHandshake,
  Inbox,
  ShieldAlert,
  Ticket,
  Users2,
} from 'lucide-react'

import { EmptyState, PageBody, PageHeader, Panel, StatCard } from '@/app/components/Admin/shell/primitives'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import prisma from '@/lib/prisma'
import { formatTZS, relativeTime, safeQuery } from '@/lib/admin/safe'
import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'
import { canEdit, userHasModuleAccess } from '@/lib/auth/admin-shared'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
const startOfMonth = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

const firstName = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean)
  const honorifics = /^(fr|sr|br|rev|dr|mr|mrs|ms|bishop|deacon)\.?$/i
  // Keep a title such as "Fr." with the first name: "Fr. Joseph".
  return honorifics.test(parts[0] ?? '') && parts[1] ? `${parts[0]} ${parts[1]}` : (parts[0] ?? '')
}

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Dar_es_Salaam' }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAdminPageAccess('overview')
  const { denied } = await searchParams
  const can = {
    retreats: userHasModuleAccess(user, 'retreats'),
    donations: userHasModuleAccess(user, 'donations'),
    intentions: userHasModuleAccess(user, 'mass-intentions'),
    inbox: userHasModuleAccess(user, 'feedback'),
    team: userHasModuleAccess(user, 'team'),
  }
  const activeBooking = { status: { notIn: ['cancelled'] } }

  const [retreats, pendingBookings, bookings30, checkedIn30, recentBookings, giving, givingCount, newIntentions, unread, activity, teamSize] =
    await Promise.all([
      can.retreats
        ? safeQuery(
            () =>
              prisma.retreat.findMany({
                where: { status: { not: 'Closed' } },
                orderBy: { createdAt: 'desc' },
                take: 6,
                select: { id: true, title: true, dateRange: true, availabilityTotal: true, status: true, _count: { select: { bookings: { where: activeBooking } } } },
              }),
            [],
            'retreats',
          )
        : [],
      can.retreats ? safeQuery(() => prisma.retreatBooking.count({ where: { status: 'pending' } }), 0) : 0,
      can.retreats ? safeQuery(() => prisma.retreatBooking.count({ where: { createdAt: { gte: daysAgo(30) }, ...activeBooking } }), 0) : 0,
      can.retreats ? safeQuery(() => prisma.retreatBooking.count({ where: { checkedInAt: { gte: daysAgo(30) } } }), 0) : 0,
      can.retreats
        ? safeQuery(
            () =>
              prisma.retreatBooking.findMany({
                orderBy: { createdAt: 'desc' },
                take: 6,
                select: { id: true, retreatId: true, fullName: true, retreatTitle: true, status: true, createdAt: true },
              }),
            [],
          )
        : [],
      can.donations
        ? safeQuery(() => prisma.donation.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfMonth() }, paymentStatus: 'paid' } }), {
            _sum: { amount: 0 },
          })
        : { _sum: { amount: 0 } },
      can.donations ? safeQuery(() => prisma.donation.count({ where: { createdAt: { gte: startOfMonth() } } }), 0) : 0,
      can.intentions ? safeQuery(() => prisma.massIntention.count({ where: { status: 'new' } }), 0) : 0,
      can.inbox ? safeQuery(() => prisma.feedbackMessage.count({ where: { status: 'new' } }), 0) : 0,
      can.team ? safeQuery(() => prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }), [], 'activity') : [],
      can.team ? safeQuery(() => prisma.adminUser.count({ where: { isActive: true } }), 0) : 0,
    ])

  const attention = [
    can.retreats && pendingBookings > 0 && { label: 'Bookings waiting for approval', count: pendingBookings, href: '/admin/retreats', icon: Ticket },
    can.intentions && newIntentions > 0 && { label: 'New Mass intentions', count: newIntentions, href: '/admin/mass-intentions', icon: HeartHandshake },
    can.inbox && unread > 0 && { label: 'Unread messages', count: unread, href: '/admin/feedback', icon: Inbox },
  ].filter(Boolean) as Array<{ label: string; count: number; href: string; icon: typeof Ticket }>

  return (
    <PageBody>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Dar_es_Salaam' }).format(new Date())}
        title={`${greeting()}, ${firstName(user.name)}`}
        description={`Signed in as ${ROLE_LABELS[user.role]}. Here is what is happening across DMRC today.`}
        actions={
          canEdit(user, 'retreats') ? (
            <Button asChild className='gap-2'>
              <Link href='/admin/retreats'>
                <CalendarDays className='h-4 w-4' /> Manage retreats
              </Link>
            </Button>
          ) : null
        }
      />

      {denied && (
        <div role='alert' className='flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
          <ShieldAlert className='h-4 w-4 shrink-0' />
          You don&apos;t have access to that page. Ask an Owner if you need it.
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {can.retreats && <StatCard label='Bookings (last 30 days)' value={bookings30} hint={`${pendingBookings} waiting for approval`} icon={Ticket} />}
        {can.retreats && <StatCard label='Check-ins (last 30 days)' value={checkedIn30} hint='Guests scanned in at retreats' icon={CheckCircle2} tone='green' />}
        {can.donations && <StatCard label='Giving this month' value={formatTZS(giving._sum.amount ?? 0)} hint={`${givingCount} gifts recorded`} icon={HandCoins} tone='gold' />}
        {can.intentions && <StatCard label='New Mass intentions' value={newIntentions} hint='Waiting to be scheduled' icon={HeartHandshake} tone='rose' />}
        {!can.intentions && can.inbox && <StatCard label='Unread messages' value={unread} icon={Inbox} tone='rose' />}
        {can.team && !can.donations && <StatCard label='Active team members' value={teamSize} icon={Users2} />}
      </div>

      <div className='grid gap-6 xl:grid-cols-3'>
        <div className='space-y-6 xl:col-span-2'>
          {can.retreats && (
            <Panel
              title='Open retreats'
              description='Seats filled against capacity'
              actions={
                <Link href='/admin/retreats' className='inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-950'>
                  All retreats <ArrowRight className='h-4 w-4' />
                </Link>
              }
              bodyClassName='p-0'
            >
              {retreats.length ? (
                <ul className='divide-y divide-border'>
                  {retreats.map((retreat) => {
                    const booked = retreat._count.bookings
                    const capacity = retreat.availabilityTotal || 0
                    const percent = capacity ? Math.min(100, Math.round((booked / capacity) * 100)) : 0
                    return (
                      <li key={retreat.id}>
                        <Link href={`/admin/retreats/${retreat.id}`} className='flex flex-col gap-3 px-5 py-4 transition hover:bg-muted/40 sm:flex-row sm:items-center'>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate font-medium text-navy-950'>{retreat.title}</p>
                            <p className='text-sm text-muted-foreground'>{retreat.dateRange}</p>
                          </div>
                          <div className='w-full sm:w-56'>
                            <div className='flex justify-between text-xs text-muted-foreground'>
                              <span>
                                {booked} / {capacity || '—'} booked
                              </span>
                              <span>{capacity ? `${Math.max(capacity - booked, 0)} left` : ''}</span>
                            </div>
                            <div className='mt-1.5 h-2 overflow-hidden rounded-full bg-muted'>
                              <div className={percent >= 90 ? 'h-full bg-rose-500' : 'h-full bg-navy-700'} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState icon={CalendarDays} title='No open retreats' description='Retreats with open registration will show here.' />
              )}
            </Panel>
          )}

          {can.retreats && (
            <Panel title='Latest bookings' bodyClassName='p-0'>
              {recentBookings.length ? (
                <ul className='divide-y divide-border'>
                  {recentBookings.map((booking) => (
                    <li key={booking.id}>
                      <Link href={`/admin/retreats/${booking.retreatId}/bookings/${booking.id}`} className='flex items-center gap-4 px-5 py-3 transition hover:bg-muted/40'>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium text-navy-950'>{booking.fullName}</p>
                          <p className='truncate text-xs text-muted-foreground'>{booking.retreatTitle}</p>
                        </div>
                        <Badge variant={booking.status === 'approved' ? 'success' : booking.status === 'pending' ? 'warning' : 'outline'} className='capitalize'>
                          {booking.status}
                        </Badge>
                        <span className='hidden w-24 text-right text-xs text-muted-foreground sm:block'>{relativeTime(booking.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Ticket} title='No bookings yet' />
              )}
            </Panel>
          )}
        </div>

        <div className='space-y-6'>
          <Panel title='Needs attention' bodyClassName='p-0'>
            {attention.length ? (
              <ul className='divide-y divide-border'>
                {attention.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className='flex items-center gap-3 px-5 py-3.5 transition hover:bg-muted/40'>
                      <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-gold-700'>
                        <item.icon className='h-4 w-4' />
                      </span>
                      <span className='flex-1 text-sm font-medium text-navy-950'>{item.label}</span>
                      <span className='rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-semibold text-white tabular-nums'>{item.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CheckCircle2} title='All caught up' description='Nothing is waiting for you right now.' />
            )}
          </Panel>

          {can.team && (
            <Panel
              title='Recent activity'
              actions={
                <Link href='/admin/activity' className='inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-950'>
                  View all <ArrowRight className='h-4 w-4' />
                </Link>
              }
              bodyClassName='p-0'
            >
              {activity.length ? (
                <ol className='divide-y divide-border'>
                  {activity.map((entry) => (
                    <li key={entry.id} className='flex gap-3 px-5 py-3'>
                      <Clock className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
                      <div className='min-w-0'>
                        <p className='text-sm text-navy-950'>{entry.summary}</p>
                        <p className='text-xs text-muted-foreground'>
                          {entry.actorName ?? 'System'} · {relativeTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState icon={Activity} title='No activity yet' description='Sign-ins, invitations and changes will be listed here.' />
              )}
            </Panel>
          )}
        </div>
      </div>
    </PageBody>
  )
}
