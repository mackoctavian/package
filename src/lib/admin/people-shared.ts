/** Member and leave constants that are safe to use in client components. */

export const MEMBER_TYPES = [
  { value: 'priest', label: 'Priest' },
  { value: 'religious', label: 'Sister / Brother' },
  { value: 'staff', label: 'Staff' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'other', label: 'Other' },
] as const

export const MEMBER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const

export const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'retreat', label: 'Retreat / spiritual' },
  { value: 'compassionate', label: 'Compassionate' },
  { value: 'study', label: 'Study' },
  { value: 'other', label: 'Other' },
] as const

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const

const values = <T extends ReadonlyArray<{ value: string }>>(list: T) => list.map((item) => item.value) as string[]
export const isMemberType = (value: unknown): value is string => typeof value === 'string' && values(MEMBER_TYPES).includes(value)
export const isLeaveType = (value: unknown): value is string => typeof value === 'string' && values(LEAVE_TYPES).includes(value)

export const labelOf = (list: ReadonlyArray<{ value: string; label: string }>, value: string) => list.find((item) => item.value === value)?.label ?? value
