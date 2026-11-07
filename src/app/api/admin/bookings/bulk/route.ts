import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'

const ACTIONS = {
  approve: 'Approved',
  cancel: 'Cancelled',
  mark_paid: 'Marked as paid',
  mark_unpaid: 'Marked as unpaid',
  check_in: 'Checked in',
  undo_check_in: 'Undid check-in for',
} as const
type BulkAction = keyof typeof ACTIONS

/** Applies one action to many bookings at once. */
export async function POST(request: Request) {
  const auth = await requireAdminApiAccess('retreats', 'edit')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null)
  const action = body?.action as BulkAction
  const ids = Array.isArray(body?.ids) ? (body.ids as unknown[]).filter((id): id is string => typeof id === 'string').slice(0, 500) : []

  if (!(action in ACTIONS)) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  if (!ids.length) return NextResponse.json({ error: 'Select at least one booking.' }, { status: 400 })

  const now = new Date()
  let updated = 0

  try {
    if (action === 'approve') {
      // Each approved booking needs its own ticket code, so update one by one.
      const pending = await prisma.retreatBooking.findMany({
        where: { id: { in: ids }, status: { not: 'cancelled' } },
        select: { id: true, ticketCode: true },
      })
      await prisma.$transaction(
        pending.map((booking) =>
          prisma.retreatBooking.update({
            where: { id: booking.id },
            data: {
              status: 'approved',
              approvedAt: now,
              approvedBy: auth.user.name,
              ticketCode: booking.ticketCode ?? `DMRC-${nanoid(8).toUpperCase()}`,
            },
          }),
        ),
      )
      updated = pending.length
    } else {
      const data: Record<Exclude<BulkAction, 'approve'>, Prisma.RetreatBookingUpdateManyMutationInput> = {
        cancel: { status: 'cancelled', cancelledAt: now },
        mark_paid: { paymentStatus: 'paid' },
        mark_unpaid: { paymentStatus: 'pending' },
        check_in: { attended: true, checkedInAt: now },
        undo_check_in: { attended: false, checkedInAt: null },
      }
      const where: Prisma.RetreatBookingWhereInput = {
        id: { in: ids },
        ...(action === 'check_in' && { status: 'approved', attended: false }),
      }
      const result = await prisma.retreatBooking.updateMany({ where, data: data[action] })
      updated = result.count
    }
  } catch (error) {
    console.error('[admin-bookings][bulk]', error)
    return NextResponse.json({ error: 'Could not update the bookings.' }, { status: 500 })
  }

  await audit({
    actor: auth.user,
    action: action === 'cancel' ? 'cancelled' : action === 'approve' ? 'approved' : 'updated',
    entity: 'booking',
    summary: `${ACTIONS[action]} ${updated} booking${updated === 1 ? '' : 's'}`,
    metadata: { action, ids },
    request,
  })

  return NextResponse.json({ data: { updated, skipped: ids.length - updated } })
}
