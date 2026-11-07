import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/admin/safe'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { userHasModuleAccess } from '@/lib/auth/admin-shared'
import { noStore } from '@/lib/mobile/admin'

export const dynamic = 'force-dynamic'

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
const startOfMonth = (offset = 0) => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + offset, 1)
}

/**
 * Home screen of the admin app: the same numbers as the web dashboard, each
 * one only when the signed-in admin can open that area.
 */
export async function GET() {
  const auth = await requireAdminApiAccess('overview')
  if ('error' in auth) return noStore({ error: auth.error }, { status: auth.status })
  const user = auth.user

  const can = {
    retreats: userHasModuleAccess(user, 'retreats'),
    checkIn: userHasModuleAccess(user, 'check-in'),
    donations: userHasModuleAccess(user, 'donations'),
    intentions: userHasModuleAccess(user, 'mass-intentions'),
    inbox: userHasModuleAccess(user, 'feedback'),
    team: userHasModuleAccess(user, 'team'),
  }
  const activeBooking = { status: { notIn: ['cancelled'] } }
  const none = <T,>(value: T) => Promise.resolve(value)

  const [
    openRetreats,
    pendingBookings,
    bookings30,
    checkedIn30,
    recentBookings,
    giving,
    givingCount,
    newDonations,
    givingRecent,
    newIntentions,
    upcomingIntentions,
    unread,
    activity,
    teamSize,
  ] = await Promise.all([
    can.retreats || can.checkIn
      ? safeQuery(
          () =>
            prisma.retreat.findMany({
              where: { status: { not: 'Closed' } },
              orderBy: { createdAt: 'desc' },
              take: 8,
              select: {
                id: true,
                title: true,
                dateRange: true,
                location: true,
                imageSrc: true,
                availabilityTotal: true,
                status: true,
                _count: { select: { bookings: { where: activeBooking } } },
              },
            }),
          [],
          'retreats',
        )
      : none([]),
    can.retreats ? safeQuery(() => prisma.retreatBooking.count({ where: { status: 'pending' } }), 0) : none(0),
    can.retreats ? safeQuery(() => prisma.retreatBooking.count({ where: { createdAt: { gte: daysAgo(30) }, ...activeBooking } }), 0) : none(0),
    can.retreats || can.checkIn ? safeQuery(() => prisma.retreatBooking.count({ where: { checkedInAt: { gte: daysAgo(30) } } }), 0) : none(0),
    can.retreats
      ? safeQuery(
          () =>
            prisma.retreatBooking.findMany({
              orderBy: { createdAt: 'desc' },
              take: 6,
              select: { id: true, retreatId: true, fullName: true, retreatTitle: true, status: true, paymentStatus: true, createdAt: true },
            }),
          [],
        )
      : none([]),
    can.donations
      ? safeQuery(() => prisma.donation.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfMonth() }, paymentStatus: 'paid' } }), {
          _sum: { amount: 0 as number | null },
        })
      : none({ _sum: { amount: 0 as number | null } }),
    can.donations ? safeQuery(() => prisma.donation.count({ where: { createdAt: { gte: startOfMonth() } } }), 0) : none(0),
    can.donations ? safeQuery(() => prisma.donation.count({ where: { status: 'new' } }), 0) : none(0),
    can.donations
      ? safeQuery(
          () => prisma.donation.findMany({ where: { paymentStatus: 'paid', createdAt: { gte: startOfMonth(-5) } }, select: { amount: true, createdAt: true } }),
          [],
        )
      : none([] as Array<{ amount: number; createdAt: Date }>),
    can.intentions ? safeQuery(() => prisma.massIntention.count({ where: { status: 'new' } }), 0) : none(0),
    can.intentions
      ? safeQuery(
          () =>
            prisma.massIntention.findMany({
              where: { status: 'scheduled', scheduledFor: { gte: new Date(new Date().toDateString()), lte: daysAgo(-7) } },
              orderBy: { scheduledFor: 'asc' },
              take: 5,
              select: { id: true, fullName: true, intentionFor: true, intentionType: true, scheduledFor: true, celebrant: true },
            }),
          [],
        )
      : none([]),
    can.inbox ? safeQuery(() => prisma.feedbackMessage.count({ where: { status: 'new' } }), 0) : none(0),
    can.team
      ? safeQuery(
          () =>
            prisma.auditLog.findMany({
              orderBy: { createdAt: 'desc' },
              take: 6,
              select: { id: true, actorName: true, action: true, entity: true, summary: true, createdAt: true },
            }),
          [],
          'activity',
        )
      : none([]),
    can.team ? safeQuery(() => prisma.adminUser.count({ where: { isActive: true } }), 0) : none(0),
  ])

  const months = Array.from({ length: 6 }, (_, index) => {
    const start = startOfMonth(index - 5)
    return { month: start.toISOString().slice(0, 7), total: 0 }
  })
  for (const gift of givingRecent) {
    const bucket = months.find((month) => month.month === gift.createdAt.toISOString().slice(0, 7))
    if (bucket) bucket.total += gift.amount
  }

  return noStore({
    data: {
      can,
      stats: {
        pendingBookings,
        bookings30,
        checkedIn30,
        givingThisMonth: giving._sum.amount ?? 0,
        giftsThisMonth: givingCount,
        newDonations,
        newIntentions,
        unreadMessages: unread,
        teamSize,
      },
      givingMonths: can.donations ? months : [],
      openRetreats: openRetreats.map((retreat) => ({
        id: retreat.id,
        title: retreat.title,
        dateRange: retreat.dateRange,
        location: retreat.location,
        imageSrc: retreat.imageSrc,
        status: retreat.status,
        capacity: retreat.availabilityTotal ?? 0,
        booked: retreat._count.bookings,
      })),
      recentBookings,
      upcomingIntentions,
      activity,
      generatedAt: new Date(),
    },
  })
}
