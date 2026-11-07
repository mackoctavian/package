import { isMemberType, MEMBER_STATUSES, parseDay } from '@/lib/admin/people'

const text = (value: unknown, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) || null : undefined)

/** Validates member fields from a request body. `creating` requires a name. */
export function memberData(body: Record<string, unknown>, creating: boolean) {
  const data: Record<string, unknown> = {}
  const fullName = text(body.fullName, 120)
  if (creating && !fullName) return { error: 'Enter the member’s name.' } as const
  if (fullName) data.fullName = fullName
  for (const key of ['email', 'phone', 'position', 'department', 'photoUrl'] as const) {
    const value = text(body[key])
    if (value !== undefined) data[key] = value
  }
  if (typeof data.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: 'Enter a valid email.' } as const
  const notes = text(body.notes, 4000)
  if (notes !== undefined) data.notes = notes
  if (body.memberType !== undefined) {
    if (!isMemberType(body.memberType)) return { error: 'Choose a valid role.' } as const
    data.memberType = body.memberType
  }
  if (body.status !== undefined) {
    if (!MEMBER_STATUSES.some((status) => status.value === body.status)) return { error: 'Choose a valid status.' } as const
    data.status = body.status
  }
  if (body.startDate !== undefined) data.startDate = body.startDate ? parseDay(body.startDate) : null
  if (body.annualLeaveDays !== undefined) {
    const days = Number(body.annualLeaveDays)
    if (!Number.isInteger(days) || days < 0 || days > 365) return { error: 'Annual leave must be between 0 and 365 days.' } as const
    data.annualLeaveDays = days
  }
  if (body.adminUserId !== undefined) data.adminUserId = typeof body.adminUserId === 'string' && body.adminUserId ? body.adminUserId : null
  return { data } as const
}
