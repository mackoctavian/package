import type { Metadata } from 'next'
import Link from 'next/link'

import { readResetToken } from '@/lib/auth/password-reset'
import AuthShell from '../../AuthShell'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await readResetToken(token)

  if ('error' in result) {
    return (
      <AuthShell
        eyebrow='Reset password'
        title={result.error === 'expired' ? 'This link has expired' : 'This link is no longer valid'}
        description='Reset links work for one hour and only once. Ask for a new one and use the newest email.'
      >
        <Link
          href='/login/forgot'
          className='inline-flex h-12 w-full items-center justify-center rounded-full bg-navy-900 px-7 font-medium text-white transition hover:bg-navy-800'
        >
          Send a new link
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow='Reset password'
      title='Choose a new password'
      description={
        <>
          For <strong className='text-navy-900'>{result.user.email}</strong>. You’ll be signed in, and signed out on every other device.
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
