import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { createResetToken, resetUrl, sendPasswordResetEmail } from '@/lib/auth/password-reset'
import { rateLimit } from '@/lib/security/public-form'

/**
 * Emails a password reset link. The answer is the same whether or not the
 * email belongs to an account, so this can't be used to find out who has a login.
 */
export const POST = async (request: Request) => {
  const limited = rateLimit(request, 'admin-forgot', { limit: 5, windowMs: 15 * 60 * 1000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter the email you sign in with.' }, { status: 400 })
  }

  const user = await prisma.adminUser.findUnique({ where: { email } }).catch(() => null)
  if (user?.isActive) {
    const result = await sendPasswordResetEmail({ to: user.email, name: user.name, link: resetUrl(createResetToken(user), request) })
    if (!result.sent) console.error('[password-reset] email not sent:', result.reason)
    await audit({
      actor: user,
      action: 'password_reset_requested',
      entity: 'admin_user',
      entityId: user.id,
      summary: result.sent ? `${user.name} asked for a password reset link` : `${user.name} asked for a password reset link, but the email could not be sent`,
      request,
    })
  }

  return NextResponse.json({ data: { ok: true } })
}
