import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { getCurrentAdminUser } from '@/lib/auth/admin-session'
import { canEdit } from '@/lib/auth/admin-shared'
import { leaveInclude, overlapsExisting, serializeLeave } from '@/lib/admin/people'

/**
 * Reviews a leave request. Leave managers can approve, reject or cancel;
 * a member can cancel their own request while it is still pending or upcoming.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.leaveRequest.findUnique({ where: { id }, include: { member: { select: { fullName: true, adminUserId: true } } } })
  if (!existing) return NextResponse.json({ error: 'Leave request not found.' }, { status: 404 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const status = body.status
  if (status !== 'approved' && status !== 'rejected' && status !== 'cancelled') {
    return NextResponse.json({ error: 'Choose approve, reject or cancel.' }, { status: 400 })
  }

  const isManager = canEdit(user, 'leave')
  const isOwn = existing.member.adminUserId === user.id
  if (!isManager && !(isOwn && status === 'cancelled')) {
    return NextResponse.json({ error: 'You can only cancel your own leave.' }, { status: 403 })
  }
  if (!isManager && existing.status === 'approved' && existing.startDate <= new Date()) {
    return NextResponse.json({ error: 'This leave has already started. Ask your manager to change it.' }, { status: 400 })
  }
  if (isOwn && !isManager && existing.status !== 'pending' && existing.status !== 'approved') {
    return NextResponse.json({ error: 'This request can no longer be cancelled.' }, { status: 400 })
  }

  if (status === existing.status) return NextResponse.json({ error: `This leave is already ${status}.` }, { status: 400 })
  if (status === 'approved' && existing.status !== 'pending' && (await overlapsExisting(existing.memberId, existing.startDate, existing.endDate, id))) {
    return NextResponse.json({ error: `${existing.member.fullName} already has other leave on some of these days.` }, { status: 409 })
  }

  const note = typeof body.reviewNote === 'string' ? body.reviewNote.trim().slice(0, 2000) || null : undefined
  const row = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      ...(isManager && { reviewedById: user.id, reviewedByName: user.name, reviewedAt: new Date() }),
      ...(note !== undefined && { reviewNote: note }),
    },
    include: leaveInclude,
  })
  await audit({
    actor: user,
    action: status === 'cancelled' ? 'cancelled' : status,
    entity: 'leave',
    entityId: id,
    summary: `${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Declined' : 'Cancelled'} ${existing.member.fullName}'s ${existing.leaveType} leave (${row.startDate.toISOString().slice(0, 10)} to ${row.endDate.toISOString().slice(0, 10)})`,
    request,
  })
  return NextResponse.json({ data: serializeLeave(row) })
}
