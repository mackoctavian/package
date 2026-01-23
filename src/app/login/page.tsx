"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
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
    <main className='relative min-h-screen overflow-hidden bg-slate-950 px-4'>
      {/* background */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-3xl' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]' />
      </div>

      <div className='relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center py-12'>
        <div className='grid w-full items-center gap-10 lg:grid-cols-2'>
          {/* left brand panel */}
          <div className='hidden lg:block'>
            <div className='max-w-xl space-y-5'>
              <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/80'>
                <ShieldCheck className='h-4 w-4 text-primary' />
                DMRC Admin Console
              </div>
              <h1 className='text-4xl font-semibold tracking-tight text-white'>
                Manage retreats, news, events, and content in one place.
              </h1>
              <p className='text-base leading-relaxed text-white/70'>
                Sign in to publish updates, manage bookings, and keep your community informed with a fast, secure dashboard experience.
              </p>
              <div className='grid gap-3 text-sm text-white/70 sm:grid-cols-2'>
                <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                  <p className='font-semibold text-white'>Secure sessions</p>
                  <p className='mt-1 text-xs leading-relaxed text-white/70'>Cookie-based admin sessions with role-based access.</p>
                </div>
                <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                  <p className='font-semibold text-white'>Fast publishing</p>
                  <p className='mt-1 text-xs leading-relaxed text-white/70'>Upload media, publish news/events, and update retreats.</p>
                </div>
              </div>
            </div>
          </div>

          {/* login card */}
          <div className='flex justify-center lg:justify-end'>
            <Card className='w-full max-w-md border-white/10 bg-white/5 text-white shadow-2xl shadow-black/20 backdrop-blur'>
              <CardHeader className='space-y-2'>
                <div className='space-y-1'>
                  <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Sign in</p>
                  <CardTitle className='text-2xl'>Welcome back</CardTitle>
                  <CardDescription className='text-white/70'>
                    Enter your admin email and password to continue.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form className='space-y-5' onSubmit={handleSubmit}>
                  <div className='space-y-2'>
                    <Label htmlFor='email' className='text-white/80'>
                      Email
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete='email'
                      placeholder='admin@dmrc.org'
                      className='border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-primary/40'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='password' className='text-white/80'>
                      Password
                    </Label>
                    <div className='relative'>
                      <Input
                        id='password'
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete='current-password'
                        placeholder='••••••••'
                        className='border-white/10 bg-white/5 text-white placeholder:text-white/40 pr-10 focus-visible:ring-primary/40'
                        required
                      />
                      <button
                        type='button'
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                        className='absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                      >
                        {isPasswordVisible ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <div className='rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
                      {error}
                    </div>
                  ) : null}

                  <Button type='submit' className='w-full gap-2' disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                  </Button>

                  <p className='text-xs leading-relaxed text-white/50'>
                    By signing in, you acknowledge this area is restricted to authorized staff.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

