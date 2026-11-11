'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'

import { inputClass } from '@/app/components/site/FormFields'
import { cn } from '@/lib/utils'

export function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className='relative'>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className={cn(inputClass, 'pr-12')}
        required
      />
      <button
        type='button'
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((current) => !current)}
        className='absolute inset-y-0 right-1.5 my-auto flex h-9 w-9 items-center justify-center rounded-lg text-navy-400 transition hover:text-navy-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-200'
      >
        {visible ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
      </button>
    </div>
  )
}

export function SubmitButton({ busy, children, busyLabel }: { busy: boolean; children: React.ReactNode; busyLabel: string }) {
  return (
    <button
      type='submit'
      disabled={busy}
      className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy-900 px-7 font-medium text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-200 disabled:opacity-70'
    >
      {busy ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
      {busy ? busyLabel : children}
    </button>
  )
}

export function Notice({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed',
        tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-gold-200 bg-gold-50 text-navy-800',
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone === 'error' ? 'text-red-500' : 'text-gold-600')} />
      <div>{children}</div>
    </div>
  )
}
