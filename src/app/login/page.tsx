'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Field, inputClass } from '@/app/components/site/FormFields'
import AuthShell from './AuthShell'
import { Notice, PasswordInput, SubmitButton } from './fields'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(response.status === 401 ? 'That email and password don’t match. Check them, or reset your password.' : (payload.error ?? 'Unable to sign in.'))
      }
      router.replace('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
      setBusy(false)
    }
  }

  return (
    <form className='space-y-5' onSubmit={handleSubmit}>
      {error ? <Notice tone='error'>{error}</Notice> : null}
      <Field label='Email' htmlFor='email'>
        <input
          id='email'
          type='email'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete='email'
          inputMode='email'
          placeholder='you@dmrc.or.tz'
          className={inputClass}
          required
          autoFocus
        />
      </Field>
      <div className='space-y-1.5'>
        <div className='flex items-baseline justify-between gap-4'>
          <label htmlFor='password' className='block text-sm font-medium text-navy-800'>
            Password
          </label>
          <Link
            href={email ? `/login/forgot?email=${encodeURIComponent(email)}` : '/login/forgot'}
            className='text-sm font-medium text-gold-700 underline-offset-4 hover:text-gold-600 hover:underline'
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput id='password' value={password} onChange={setPassword} autoComplete='current-password' />
      </div>
      <SubmitButton busy={busy} busyLabel='Signing in…'>
        Sign in
      </SubmitButton>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <AuthShell eyebrow='Staff sign in' title='Welcome back' description='Sign in with your DMRC admin email and password.'>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
