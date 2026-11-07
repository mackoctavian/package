import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { leaveInclude, LEAVE_TYPES, overlapsExisting, parseDay, parseLeaveInput, serializeLeave, todayUtc } from '@/lib/admin/people'

export const dynamic = 'force-dynamic'

/** Leave requests with filters, plus who is away now and over the next two weeks. */
export async function GET(request: Request) {
  const auth = await requireAdminApiAccess('leave')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const params = new URL(request.url).searchParams
  const status = params.get('status')
  const type = params.get('type')
  const memberId = params.get('memberId')
  const from = parseDay(params.get('from'))
  const to = parseDay(params.get('to'))
  const where: Prisma.LeaveRequestWhereInput = {
    ...(status && status !== 'all' && { status }),
    ...(type && type !== 'all' && { leaveType: type }),
    ...(memberId && { memberId }),
    ...(to && { startDate: { lte: to } }),
    ...(from && { endDate: { gte: from } }),
  }

  const today = todayUtc()
  const horizon = new Date(today.getTime() + 13 * 86_400_000)
  try {
    const [rows, counts, upcoming, members] = await Promise.all([
      prisma.leaveRequest.findMany({ where, orderBy: [{ status: 'asc' }, { startDate: 'desc' }], take: 300, include: leaveInclude }),
      prisma.leaveRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.leaveRequest.findMany({
        where: { status: 'approved', startDate: { lte: horizon }, endDate: { gte: today } },
        orderBy: { startDate: 'asc' },
        include: leaveInclude,
      }),
      prisma.member.findMany({ where: { status: 'active' }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, memberType: true } }),
    ])
    return NextResponse.json({
      data: rows.map(serializeLeave),
      counts: Object.fromEntries(counts.map((row) => [row.status, row._count._all])),
      upcoming: upcoming.map(serializeLeave),
      today: today.toISOString().slice(0, 10),
      members,
      types: LEAVE_TYPES,
    })
  } catch (error) {
    console.error('[leave][GET]', error)
    return NextResponse.json({ error: 'Unable to load leave requests.' }, { status: 500 })
  }
}

/** Records leave on someone's behalf. `approve: true` approves it straight away. */
export async function POST(request: Request) {
  const auth = await requireAdminApiAccess('leave', 'edit')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const memberId = typeof body.memberId === 'string' ? body.memberId : ''
  const member = memberId ? await prisma.member.findUnique({ where: { id: memberId } }) : null
  if (!member) return NextResponse.json({ error: 'Choose a member.' }, { status: 400 })
  const parsed = parseLeaveInput(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (await overlapsExisting(memberId, parsed.data.startDate, parsed.data.endDate)) {
    return NextResponse.json({ error: `${member.fullName} already has leave on some of these days.` }, { status: 409 })
  }

  const approve = body.approve === true
  const row = await prisma.leaveRequest.create({
    data: {
      ...parsed.data,
      memberId,
      createdById: auth.user.id,
      ...(approve && { status: 'approved', reviewedById: auth.user.id, reviewedByName: auth.user.name, reviewedAt: new Date() }),
    },
    include: leaveInclude,
  })
  await audit({
    actor: auth.user,
    action: approve ? 'approved' : 'created',
    entity: 'leave',
    entityId: row.id,
    summary: `${approve ? 'Recorded approved' : 'Requested'} ${row.days} day${row.days === 1 ? '' : 's'} of ${parsed.data.leaveType} leave for ${member.fullName}`,
    request,
  })
  return NextResponse.json({ data: serializeLeave(row) }, { status: 201 })
}
