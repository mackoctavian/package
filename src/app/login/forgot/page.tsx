'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Field, inputClass } from '@/app/components/site/FormFields'
import AuthShell from '../AuthShell'
import { Notice, SubmitButton } from '../fields'

function ForgotForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Something went wrong. Please try again.')
      setSentTo(email.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <div className='space-y-6'>
        <Notice tone='success'>
          If <strong>{sentTo}</strong> has an admin account, a reset link is on its way. It works for one hour. Check your spam folder if it doesn’t arrive in a few minutes.
        </Notice>
        <Link href={`/login?email=${encodeURIComponent(sentTo)}`} className='inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900'>
          <ArrowLeft className='h-4 w-4' /> Back to sign in
        </Link>
      </div>
    )
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
      <SubmitButton busy={busy} busyLabel='Sending…'>
        Email me a reset link
      </SubmitButton>
      <Link href='/login' className='inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900'>
        <ArrowLeft className='h-4 w-4' /> Back to sign in
      </Link>
    </form>
  )
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow='Reset password' title='Forgot your password?' description='Enter the email you sign in with and we’ll send you a link to choose a new one.'>
      <Suspense>
        <ForgotForm />
      </Suspense>
    </AuthShell>
  )
}
