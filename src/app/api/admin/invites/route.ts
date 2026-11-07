import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { createInviteToken, inviteExpiry, inviteUrl, sendInviteEmail } from '@/lib/auth/invites'
import { isAdminRole, isValidEmail, normalizeEmail, normalizeName, validateGrant } from '@/lib/auth/team'

/** Invites someone to the admin team by email. */
export const POST = async (request: Request) => {
  const auth = await requireAdminApiAccess('team', 'edit')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const email = normalizeEmail(body?.email)
  const name = normalizeName(body?.name) || null
  const role = body?.role ?? 'EDITOR'

  if (!isValidEmail(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  if (!isAdminRole(role)) return NextResponse.json({ error: 'Choose a valid role.' }, { status: 400 })

  const grant = validateGrant(auth.user, role, body?.allowedModules)
  if (!grant.ok) return NextResponse.json({ error: grant.error }, { status: 403 })

  const member = await prisma.adminUser.findUnique({ where: { email } })
  if (member) return NextResponse.json({ error: 'Someone with that email is already on the team.' }, { status: 409 })

  // A new invite replaces any earlier pending one for the same address.
  await prisma.adminInvite.updateMany({
    where: { email, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  const { token, tokenHash } = createInviteToken()
  const invite = await prisma.adminInvite.create({
    data: { email, name, role, allowedModules: grant.modules, tokenHash, invitedById: auth.user.id, expiresAt: inviteExpiry() },
  })

  const link = inviteUrl(token, request)
  const email_ = await sendInviteEmail({ to: email, name, role, link, invitedBy: auth.user.name })

  await audit({
    actor: auth.user,
    action: 'invited',
    entity: 'admin_invite',
    entityId: invite.id,
    summary: `Invited ${email} as ${ROLE_LABELS[role]}`,
    metadata: { role, allowedModules: grant.modules, emailed: email_.sent },
    request,
  })

  return NextResponse.json(
    { data: { id: invite.id, link, emailed: email_.sent, emailError: email_.sent ? null : email_.reason } },
    { status: 201 },
  )
}
