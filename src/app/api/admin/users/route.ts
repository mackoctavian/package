import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { ADMIN_MODULES, ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { inviteStatus } from '@/lib/auth/invites'
import {
  isAdminRole,
  isValidEmail,
  memberSelect,
  normalizeEmail,
  normalizeName,
  passwordProblem,
  serializeMember,
  validateGrant,
} from '@/lib/auth/team'
import { hashPassword } from '@/lib/password'

/** The team and pending invitations. */
export const GET = async () => {
  const auth = await requireAdminApiAccess('team')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const [users, invites] = await Promise.all([
    prisma.adminUser.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }], select: memberSelect }),
    prisma.adminInvite.findMany({
      where: { acceptedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { invitedBy: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({
    data: users.map(serializeMember),
    invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      allowedModules: invite.allowedModules,
      invitedBy: invite.invitedBy?.name ?? null,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      status: inviteStatus(invite),
    })),
    modules: ADMIN_MODULES,
  })
}

/**
 * Adds a member directly with a password. Invitations (POST
 * /api/admin/invites) are the preferred route; this stays for setting up
 * accounts for people without email access.
 */
export const POST = async (request: Request) => {
  const auth = await requireAdminApiAccess('team', 'edit')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const name = normalizeName(body?.name)
  const email = normalizeEmail(body?.email)
  const password = typeof body?.password === 'string' ? body.password.trim() : ''
  const role = body?.role ?? 'EDITOR'

  if (!name || !isValidEmail(email) || !password) {
    return NextResponse.json({ error: 'Name, a valid email and a password are required.' }, { status: 400 })
  }
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: 'Choose a valid role.' }, { status: 400 })
  }
  const weak = passwordProblem(password)
  if (weak) return NextResponse.json({ error: weak }, { status: 400 })

  const grant = validateGrant(auth.user, role, body?.allowedModules)
  if (!grant.ok) return NextResponse.json({ error: grant.error }, { status: 403 })

  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Someone with that email is already on the team.' }, { status: 409 })
  }

  const created = await prisma.adminUser.create({
    data: { name, email, passwordHash: await hashPassword(password), role, allowedModules: grant.modules },
    select: memberSelect,
  })

  await audit({
    actor: auth.user,
    action: 'created',
    entity: 'admin_user',
    entityId: created.id,
    summary: `Added ${created.name} (${created.email}) as ${ROLE_LABELS[role]}`,
    metadata: { role, allowedModules: grant.modules },
    request,
  })

  return NextResponse.json({ data: serializeMember(created) }, { status: 201 })
}
