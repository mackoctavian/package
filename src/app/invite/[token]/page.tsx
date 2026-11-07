import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldX } from 'lucide-react'

import prisma from '@/lib/prisma'
import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { hashInviteToken, inviteStatus } from '@/lib/auth/invites'
import { AcceptInviteForm } from './AcceptInviteForm'

export const metadata: Metadata = { title: 'Join the DMRC admin team', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await prisma.adminInvite
    .findUnique({ where: { tokenHash: hashInviteToken(token) }, include: { invitedBy: { select: { name: true } } } })
    .catch(() => null)
  const status = invite ? inviteStatus(invite) : null

  return (
    <main className='flex min-h-screen items-center justify-center bg-navy-950 px-4 py-12'>
      <div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl'>
        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-gold-700'>Divine Mercy Retreat Center</p>
        {invite && status === 'pending' ? (
          <>
            <h1 className='mt-2 text-2xl font-semibold text-navy-950'>Join the admin team</h1>
            <p className='mt-2 text-sm text-muted-foreground'>
              {invite.invitedBy?.name ?? 'The DMRC team'} invited <strong className='text-navy-900'>{invite.email}</strong> to join as a{' '}
              <strong className='text-navy-900'>{ROLE_LABELS[invite.role]}</strong>. Choose a password to finish setting up your account.
            </p>
            <AcceptInviteForm token={token} defaultName={invite.name ?? ''} />
          </>
        ) : (
          <div className='mt-4 text-center'>
            <ShieldX className='mx-auto h-10 w-10 text-rose-500' />
            <h1 className='mt-3 text-xl font-semibold text-navy-950'>
              {status === 'accepted' ? 'This invitation was already used' : status === 'expired' ? 'This invitation has expired' : 'This invitation is not valid'}
            </h1>
            <p className='mt-2 text-sm text-muted-foreground'>
              {status === 'accepted' ? 'Sign in with the password you chose.' : 'Ask the person who invited you to send a new invitation.'}
            </p>
            <Link href='/login' className='mt-6 inline-flex rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800'>
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
