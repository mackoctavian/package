import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'

import { isLeaveType } from './people-shared'

export * from './people-shared'

/** Parses a YYYY-MM-DD (or ISO) date to midnight UTC, or null. */
export const parseDay = (value: unknown) => {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/** Calendar days from start to end, both included. */
export const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1

export const todayUtc = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/** Approved annual leave days a member has taken (or booked) this calendar year. */
export async function annualLeaveUsed(memberIds: string[], year = new Date().getUTCFullYear()) {
  if (!memberIds.length) return new Map<string, number>()
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  const rows = await prisma.leaveRequest.groupBy({
    by: ['memberId'],
    where: { memberId: { in: memberIds }, leaveType: 'annual', status: 'approved', startDate: { gte: start, lte: end } },
    _sum: { days: true },
  })
  return new Map(rows.map((row) => [row.memberId, row._sum.days ?? 0]))
}

/** Members who are on approved leave on the given day. */
export async function awayOn(day = todayUtc()) {
  const rows = await prisma.leaveRequest.findMany({
    where: { status: 'approved', startDate: { lte: day }, endDate: { gte: day } },
    select: { memberId: true, endDate: true, leaveType: true },
  })
  return new Map(rows.map((row) => [row.memberId, row]))
}

export const leaveInclude = {
  member: { select: { id: true, fullName: true, memberType: true, position: true, department: true, annualLeaveDays: true } },
} satisfies Prisma.LeaveRequestInclude

export const serializeLeave = (row: Prisma.LeaveRequestGetPayload<{ include: typeof leaveInclude }>) => ({
  id: row.id,
  memberId: row.memberId,
  member: row.member,
  leaveType: row.leaveType,
  startDate: row.startDate.toISOString().slice(0, 10),
  endDate: row.endDate.toISOString().slice(0, 10),
  days: row.days,
  reason: row.reason,
  status: row.status,
  reviewedByName: row.reviewedByName,
  reviewedAt: row.reviewedAt,
  reviewNote: row.reviewNote,
  createdAt: row.createdAt,
})

/** Validates a new leave request body. */
export function parseLeaveInput(body: Record<string, unknown>) {
  const start = parseDay(body.startDate)
  const end = parseDay(body.endDate)
  if (!isLeaveType(body.leaveType)) return { error: 'Choose a type of leave.' } as const
  if (!start || !end) return { error: 'Choose a start and end date.' } as const
  if (end < start) return { error: 'The end date is before the start date.' } as const
  const total = daysBetween(start, end)
  if (total > 366) return { error: 'Leave can be at most one year.' } as const
  const days = typeof body.days === 'number' && body.days > 0 && body.days <= total ? Math.round(body.days) : total
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) || null : null
  return { data: { leaveType: body.leaveType as string, startDate: start, endDate: end, days, reason } } as const
}

/** True when the member already has pending or approved leave overlapping these dates. */
export async function overlapsExisting(memberId: string, start: Date, end: Date, excludeId?: string) {
  const clash = await prisma.leaveRequest.findFirst({
    where: {
      memberId,
      status: { in: ['pending', 'approved'] },
      startDate: { lte: end },
      endDate: { gte: start },
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: { id: true },
  })
  return Boolean(clash)
}
