import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { getCurrentAdminUser } from '@/lib/auth/admin-session'
import { annualLeaveUsed, leaveInclude, overlapsExisting, parseLeaveInput, serializeLeave } from '@/lib/admin/people'
import { rateLimit } from '@/lib/security/public-form'

const myMember = async () => {
  const user = await getCurrentAdminUser()
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  const member = await prisma.member.findUnique({ where: { adminUserId: user.id } })
  return { user, member } as const
}

/** The signed-in person's own leave balance and requests. */
export async function GET() {
  const ctx = await myMember()
  if ('response' in ctx) return ctx.response
  if (!ctx.member) return NextResponse.json({ data: null })
  const [rows, used] = await Promise.all([
    prisma.leaveRequest.findMany({ where: { memberId: ctx.member.id }, orderBy: { startDate: 'desc' }, take: 30, include: leaveInclude }),
    annualLeaveUsed([ctx.member.id]),
  ])
  return NextResponse.json({
    data: {
      member: { id: ctx.member.id, fullName: ctx.member.fullName, annualLeaveDays: ctx.member.annualLeaveDays },
      annualLeaveUsed: used.get(ctx.member.id) ?? 0,
      requests: rows.map(serializeLeave),
    },
  })
}

/** Lets a team member request their own leave. */
export async function POST(request: Request) {
  const ctx = await myMember()
  if ('response' in ctx) return ctx.response
  if (!ctx.member) return NextResponse.json({ error: 'Your login is not linked to a member profile yet. Ask an administrator.' }, { status: 400 })
  const limited = rateLimit(request, 'my-leave', { limit: 20, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  const parsed = parseLeaveInput((await request.json().catch(() => ({}))) as Record<string, unknown>)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (await overlapsExisting(ctx.member.id, parsed.data.startDate, parsed.data.endDate)) {
    return NextResponse.json({ error: 'You already have leave on some of these days.' }, { status: 409 })
  }
  const row = await prisma.leaveRequest.create({ data: { ...parsed.data, memberId: ctx.member.id, createdById: ctx.user.id }, include: leaveInclude })
  await audit({
    actor: ctx.user,
    action: 'requested',
    entity: 'leave',
    entityId: row.id,
    summary: `${ctx.member.fullName} requested ${row.days} day${row.days === 1 ? '' : 's'} of ${row.leaveType} leave`,
    request,
  })
  return NextResponse.json({ data: serializeLeave(row) }, { status: 201 })
}
