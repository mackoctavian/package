'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Field } from '@/app/components/site/FormFields'
import { Notice, PasswordInput, SubmitButton } from '../../fields'

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setError(null)
    if (password !== confirm) {
      setError('The two passwords don’t match.')
      return
    }
    setBusy(true)
    try {
      const response = await fetch('/api/admin/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save your new password.')
      router.replace('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your new password.')
      setBusy(false)
    }
  }

  return (
    <form className='space-y-5' onSubmit={handleSubmit}>
      {error ? <Notice tone='error'>{error}</Notice> : null}
      <Field label='New password' htmlFor='password' hint='At least 10 characters, with letters and numbers.'>
        <PasswordInput id='password' value={password} onChange={setPassword} autoComplete='new-password' />
      </Field>
      <Field label='Confirm new password' htmlFor='confirm'>
        <PasswordInput id='confirm' value={confirm} onChange={setConfirm} autoComplete='new-password' />
      </Field>
      <SubmitButton busy={busy} busyLabel='Saving…'>
        Save and sign in
      </SubmitButton>
    </form>
  )
}
