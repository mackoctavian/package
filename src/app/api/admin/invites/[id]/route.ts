import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { createInviteToken, inviteExpiry, inviteUrl, sendInviteEmail } from '@/lib/auth/invites'

type RouteContext = { params: Promise<{ id: string }> }

/** Resends an invitation with a fresh link (the old link stops working). */
export const POST = async (request: Request, { params }: RouteContext) => {
  const { id } = await params
  const auth = await requireAdminApiAccess('team', 'edit')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const invite = await prisma.adminInvite.findUnique({ where: { id } })
  if (!invite || invite.acceptedAt) {
    return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })
  }
  if (invite.role === 'SUPERADMIN' && auth.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Only an Owner can resend this invitation.' }, { status: 403 })
  }

  const { token, tokenHash } = createInviteToken()
  await prisma.adminInvite.update({ where: { id }, data: { tokenHash, expiresAt: inviteExpiry(), revokedAt: null } })
  const link = inviteUrl(token, request)
  const sent = await sendInviteEmail({ to: invite.email, name: invite.name, role: invite.role, link, invitedBy: auth.user.name })

  await audit({
    actor: auth.user,
    action: 'resent',
    entity: 'admin_invite',
    entityId: id,
    summary: `Resent the invitation to ${invite.email}`,
    request,
  })

  return NextResponse.json({ data: { link, emailed: sent.sent, emailError: sent.sent ? null : sent.reason } })
}

/** Revokes a pending invitation. */
export const DELETE = async (request: Request, { params }: RouteContext) => {
  const { id } = await params
  const auth = await requireAdminApiAccess('team', 'edit')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const invite = await prisma.adminInvite.findUnique({ where: { id } })
  if (!invite || invite.acceptedAt) {
    return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })
  }

  await prisma.adminInvite.update({ where: { id }, data: { revokedAt: new Date() } })
  await audit({
    actor: auth.user,
    action: 'revoked',
    entity: 'admin_invite',
    entityId: id,
    summary: `Cancelled the invitation to ${invite.email}`,
    request,
  })
  return NextResponse.json({ success: true })
}
