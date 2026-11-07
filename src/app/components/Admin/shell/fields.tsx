'use client'

import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export const selectClass =
  'h-10 rounded-lg border border-input bg-white px-3 text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-ring'

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={cn(selectClass, className)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/** A search box that reports its value after the person stops typing. */
export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (value: string) => void; placeholder: string; className?: string }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChange(draft), 300)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])
  return (
    <div className={cn('relative', className)}>
      <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <input
        type='search'
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className='h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
      />
    </div>
  )
}

const TONES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rescheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  refunded: 'bg-slate-100 text-slate-600 ring-slate-200',
  new: 'bg-amber-50 text-amber-700 ring-amber-200',
}

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset', TONES[status] ?? 'bg-muted text-muted-foreground ring-border')}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}
