'use client'

import { useState } from 'react'

import { Button } from '@/app/components/ui/button'
import { LEAVE_TYPES, labelOf } from '@/lib/admin/people-shared'
import { cn } from '@/lib/utils'
import { selectClass } from '@/app/components/Admin/shell/fields'

export type LeaveRow = {
  id: string
  memberId: string
  member: { id: string; fullName: string; memberType: string; position: string | null; department: string | null; annualLeaveDays: number }
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string | null
  status: string
  reviewedByName: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

export const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Something went wrong.')
  return payload as T
}

/** Formats a YYYY-MM-DD day without shifting it across time zones. */
export const formatDay = (value: string | null | undefined, withYear = true) => {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', ...(withYear && { year: 'numeric' }), timeZone: 'UTC' }).format(date)
}

export const formatRange = (start: string, end: string) =>
  start === end ? formatDay(start) : `${formatDay(start, start.slice(0, 4) !== end.slice(0, 4))} – ${formatDay(end)}`

export const leaveLabel = (type: string) => labelOf(LEAVE_TYPES, type)

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export function Avatar({ name, photoUrl, className }: { name: string; photoUrl?: string | null; className?: string }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt='' className={cn('h-9 w-9 shrink-0 rounded-full object-cover', className)} />
  }
  return (
    <span aria-hidden='true' className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700', className)}>
      {initials(name)}
    </span>
  )
}

/** Annual leave used against the allowance, as a bar. */
export function LeaveBalance({ used, allowance, compact = false }: { used: number; allowance: number; compact?: boolean }) {
  if (!allowance && !used) return <span className='text-xs text-muted-foreground'>{compact ? '—' : 'No annual leave allowance set.'}</span>
  const left = Math.max(allowance - used, 0)
  const percent = allowance ? Math.min((used / allowance) * 100, 100) : 0
  const tone = used > allowance ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-navy-700'
  return (
    <div className={compact ? 'min-w-[7rem]' : ''}>
      <div className='flex items-baseline justify-between gap-2 text-xs'>
        <span className='font-medium text-navy-950 tabular-nums'>
          {used} / {allowance} days
        </span>
        {!compact && <span className='text-muted-foreground'>{used > allowance ? `${used - allowance} over` : `${left} left`}</span>}
      </div>
      <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-muted' role='progressbar' aria-valuemin={0} aria-valuemax={allowance} aria-valuenow={used} aria-label='Annual leave used'>
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export const inputClass =
  'h-10 w-full rounded-lg border border-input bg-white px-3 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

export function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className='mb-1.5 block text-sm font-medium text-navy-900'>{label}</span>
      {children}
      {hint && <span className='mt-1 block text-xs text-muted-foreground'>{hint}</span>}
    </label>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

export type LeaveFormValues = { leaveType: string; startDate: string; endDate: string; reason: string }

/** Type, dates and reason for a leave request. Shared by the admin and self-service forms. */
export function LeaveFormFields({ value, onChange }: { value: LeaveFormValues; onChange: (value: LeaveFormValues) => void }) {
  const set = (key: keyof LeaveFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: event.target.value })
  const days =
    value.startDate && value.endDate && value.endDate >= value.startDate
      ? Math.round((Date.parse(value.endDate) - Date.parse(value.startDate)) / 86_400_000) + 1
      : null
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <Field label='Type of leave' className='sm:col-span-2'>
        <select value={value.leaveType} onChange={set('leaveType')} className={cn(selectClass, 'w-full')}>
          {LEAVE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label='First day'>
        <input required type='date' value={value.startDate} onChange={set('startDate')} className={inputClass} />
      </Field>
      <Field label='Last day' hint={days ? `${days} calendar day${days === 1 ? '' : 's'}` : undefined}>
        <input required type='date' min={value.startDate || undefined} value={value.endDate} onChange={set('endDate')} className={inputClass} />
      </Field>
      <Field label='Reason or note (optional)' className='sm:col-span-2'>
        <textarea rows={3} value={value.reason} onChange={set('reason')} className={cn(inputClass, 'h-auto resize-none py-2')} />
      </Field>
    </div>
  )
}

export const emptyLeaveForm = (): LeaveFormValues => ({ leaveType: 'annual', startDate: today(), endDate: today(), reason: '' })

/** A small inline confirm for a destructive action. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  disabled,
  variant = 'outline',
}: {
  label: string
  confirmLabel: string
  onConfirm: () => void
  disabled?: boolean
  variant?: 'outline' | 'destructive' | 'ghost'
}) {
  const [asking, setAsking] = useState(false)
  if (!asking) {
    return (
      <Button type='button' size='sm' variant={variant} disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </Button>
    )
  }
  return (
    <span className='inline-flex items-center gap-1'>
      <Button type='button' size='sm' variant='destructive' disabled={disabled} onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button type='button' size='sm' variant='ghost' onClick={() => setAsking(false)}>
        Keep
      </Button>
    </span>
  )
}
