'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function AcceptInviteForm({ token, defaultName }: { token: string; defaultName: string }) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const field = 'mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-navy-950 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200'

  return (
    <form
      className='mt-6 space-y-4'
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        if (password !== confirm) {
          setError('The passwords do not match.')
          return
        }
        setBusy(true)
        try {
          const response = await fetch('/api/invites/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, name, password }),
          })
          const payload = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(payload.error ?? 'Could not accept the invitation.')
          router.replace('/admin')
          router.refresh()
        } catch (err) {
          setError((err as Error).message)
          setBusy(false)
        }
      }}
    >
      <label className='block text-sm font-medium text-navy-900'>
        Your name
        <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete='name' className={field} />
      </label>
      <label className='block text-sm font-medium text-navy-900'>
        Password
        <span className='relative block'>
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={10}
            autoComplete='new-password'
            className={`${field} pr-10`}
          />
          <button type='button' onClick={() => setShow((value) => !value)} className='absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 p-1 text-slate-500' aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
          </button>
        </span>
      </label>
      <label className='block text-sm font-medium text-navy-900'>
        Repeat password
        <input type={show ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} required autoComplete='new-password' className={field} />
      </label>
      <p className='text-xs text-slate-500'>At least 10 characters, with letters and numbers.</p>
      {error && (
        <p role='alert' className='rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700'>
          {error}
        </p>
      )}
      <button type='submit' disabled={busy} className='flex w-full items-center justify-center rounded-full bg-navy-900 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60'>
        {busy && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Create my account
      </button>
    </form>
  )
}
