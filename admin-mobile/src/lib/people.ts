/** Mirrors src/lib/admin/people-shared.ts on the web. */
export const MEMBER_TYPES = [
  { value: 'priest', label: 'Priest' },
  { value: 'religious', label: 'Sister / Brother' },
  { value: 'staff', label: 'Staff' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'other', label: 'Other' },
] as const;

export const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'retreat', label: 'Retreat / spiritual' },
  { value: 'compassionate', label: 'Compassionate' },
  { value: 'study', label: 'Study' },
  { value: 'other', label: 'Other' },
] as const;

export const labelOf = (list: readonly { value: string; label: string }[], value: string) => list.find((item) => item.value === value)?.label ?? value;

/** "12 Nov" or "12 – 15 Nov" for a leave range (YYYY-MM-DD strings). */
export const leaveRange = (start: string, end: string) => {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  const day = (d: Date, month: boolean) => d.toLocaleDateString('en-GB', { day: 'numeric', ...(month ? { month: 'short' } : {}), timeZone: 'UTC' });
  if (start === end) return day(a, true);
  const sameMonth = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  return `${day(a, !sameMonth)} – ${day(b, true)}`;
};
