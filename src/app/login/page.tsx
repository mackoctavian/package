"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'

const DEFAULT_EMAIL = 'admin@admin.com'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [password, setPassword] = useState('Jesus2025!')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Unable to sign in.')
      }
      router.replace('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-950 px-4'>
      <Card className='w-full max-w-md border-slate-800 bg-slate-900 text-white'>
        <CardHeader className='space-y-2 text-center'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>DMRC Admin</p>
          <CardTitle className='text-3xl'>Sign in</CardTitle>
          <CardDescription className='text-slate-400'>
            Use your admin credentials to access the full content management experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className='space-y-5' onSubmit={handleSubmit}>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className='border-slate-700 bg-slate-900 text-white'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className='border-slate-700 bg-slate-900 text-white'
                required
              />
            </div>
            {error ? <p className='text-sm text-red-400'>{error}</p> : null}
            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

