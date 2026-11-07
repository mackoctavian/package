import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { createAdminSession } from '@/lib/auth/admin-session'
import { hashInviteToken, inviteStatus } from '@/lib/auth/invites'
import { normalizeName, passwordProblem } from '@/lib/auth/team'
import { hashPassword } from '@/lib/password'
import { rateLimit } from '@/lib/security/public-form'

/** Accepts an invitation: creates the account and signs the person in. */
export const POST = async (request: Request) => {
  const limited = rateLimit(request, 'invite-accept', { limit: 10, windowMs: 15 * 60 * 1000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  const name = normalizeName(body?.name)
  const password = typeof body?.password === 'string' ? body.password.trim() : ''

  if (!token) return NextResponse.json({ error: 'This invitation link is not valid.' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  const weak = passwordProblem(password)
  if (weak) return NextResponse.json({ error: weak }, { status: 400 })

  const invite = await prisma.adminInvite.findUnique({ where: { tokenHash: hashInviteToken(token) } })
  const status = invite ? inviteStatus(invite) : null
  if (!invite || status !== 'pending') {
    const message =
      status === 'expired'
        ? 'This invitation has expired. Ask for a new one.'
        : status === 'accepted'
          ? 'This invitation was already used. Sign in instead.'
          : 'This invitation is no longer valid.'
    return NextResponse.json({ error: message }, { status: 410 })
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: invite.email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 })
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.adminUser.create({
      data: {
        name,
        email: invite.email,
        passwordHash: await hashPassword(password),
        role: invite.role,
        allowedModules: invite.allowedModules,
        lastLoginAt: new Date(),
      },
    })
    await tx.adminInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } })
    return created
  })

  await createAdminSession(user.id)
  await audit({
    actor: user,
    action: 'joined',
    entity: 'admin_user',
    entityId: user.id,
    summary: `${user.name} accepted the invitation and joined as ${ROLE_LABELS[user.role]}`,
    request,
  })

  return NextResponse.json({ data: { id: user.id } }, { status: 201 })
}
