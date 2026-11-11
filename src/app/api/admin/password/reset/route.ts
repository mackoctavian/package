import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { createAdminSession, revokeUserSessions } from '@/lib/auth/admin-session'
import { readResetToken } from '@/lib/auth/password-reset'
import { passwordProblem } from '@/lib/auth/team'
import { hashPassword } from '@/lib/password'
import { rateLimit } from '@/lib/security/public-form'

/** Sets a new password from a reset link, signs out every other device and signs this one in. */
export const POST = async (request: Request) => {
  const limited = rateLimit(request, 'admin-reset', { limit: 10, windowMs: 15 * 60 * 1000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  const password = typeof body?.password === 'string' ? body.password.trim() : ''

  const weak = passwordProblem(password)
  if (weak) return NextResponse.json({ error: weak }, { status: 400 })

  const result = await readResetToken(token)
  if ('error' in result) {
    const message = result.error === 'expired' ? 'This link has expired. Ask for a new one.' : 'This link is no longer valid. Ask for a new one.'
    return NextResponse.json({ error: message }, { status: 410 })
  }

  const { user } = result
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), lastLoginAt: new Date() } })
  await revokeUserSessions(user.id)
  await createAdminSession(user.id)
  await audit({ actor: user, action: 'password_reset', entity: 'admin_user', entityId: user.id, summary: `${user.name} reset their password with an email link`, request })

  return NextResponse.json({ data: { ok: true } })
}
