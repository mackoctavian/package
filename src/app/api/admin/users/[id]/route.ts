import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { requireAdminApiAccess, revokeUserSessions } from '@/lib/auth/admin-session'
import {
  canManageMember,
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

type RouteContext = { params: Promise<{ id: string }> }

const ownerCount = () => prisma.adminUser.count({ where: { role: 'SUPERADMIN', isActive: true } })

export const PATCH = async (request: Request, { params }: RouteContext) => {
  const { id } = await params
  const auth = await requireAdminApiAccess('team', 'edit')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  }
  if (!canManageMember(auth.user, existing)) {
    return NextResponse.json({ error: `Only an ${ROLE_LABELS.SUPERADMIN} can change another ${ROLE_LABELS.SUPERADMIN}.` }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const updates: Prisma.AdminUserUpdateInput = {}
  const changes: string[] = []
  let signOut = false

  if (typeof body?.name === 'string') {
    const name = normalizeName(body.name)
    if (!name) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
    if (name !== existing.name) {
      updates.name = name
      changes.push('name')
    }
  }

  if (typeof body?.email === 'string') {
    const email = normalizeEmail(body.email)
    if (!isValidEmail(email)) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 })
    if (email !== existing.email) {
      const taken = await prisma.adminUser.findUnique({ where: { email } })
      if (taken) return NextResponse.json({ error: 'Someone with that email is already on the team.' }, { status: 409 })
      updates.email = email
      changes.push('email')
    }
  }

  const accessChanging = body?.role !== undefined || Array.isArray(body?.allowedModules)
  if (accessChanging) {
    if (existing.id === auth.user.id) {
      return NextResponse.json({ error: 'You cannot change your own access. Ask another Owner.' }, { status: 400 })
    }
    const role = body?.role ?? existing.role
    if (!isAdminRole(role)) return NextResponse.json({ error: 'Choose a valid role.' }, { status: 400 })
    if (existing.role === 'SUPERADMIN' && role !== 'SUPERADMIN' && (await ownerCount()) <= 1) {
      return NextResponse.json({ error: 'The team needs at least one active Owner.' }, { status: 400 })
    }
    const grant = validateGrant(auth.user, role, Array.isArray(body?.allowedModules) ? body.allowedModules : existing.allowedModules)
    if (!grant.ok) return NextResponse.json({ error: grant.error }, { status: 403 })
    updates.role = role
    updates.allowedModules = grant.modules
    changes.push('access')
  }

  if (typeof body?.isActive === 'boolean' && body.isActive !== existing.isActive) {
    if (existing.id === auth.user.id) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 })
    }
    if (!body.isActive && existing.role === 'SUPERADMIN' && (await ownerCount()) <= 1) {
      return NextResponse.json({ error: 'The team needs at least one active Owner.' }, { status: 400 })
    }
    updates.isActive = body.isActive
    changes.push(body.isActive ? 'reactivated' : 'deactivated')
    if (!body.isActive) signOut = true
  }

  if (typeof body?.password === 'string' && body.password.trim()) {
    const password = body.password.trim()
    const weak = passwordProblem(password)
    if (weak) return NextResponse.json({ error: weak }, { status: 400 })
    updates.passwordHash = await hashPassword(password)
    changes.push('password')
    signOut = existing.id !== auth.user.id
  }

  if (!changes.length) {
    return NextResponse.json({ error: 'No changes to save.' }, { status: 400 })
  }

  const updated = await prisma.adminUser.update({ where: { id }, data: updates, select: memberSelect })
  if (signOut || changes.includes('access')) await revokeUserSessions(id)

  await audit({
    actor: auth.user,
    action: changes.includes('deactivated') ? 'deactivated' : changes.includes('reactivated') ? 'reactivated' : 'updated',
    entity: 'admin_user',
    entityId: id,
    summary: `Updated ${updated.name}: ${changes.join(', ')}${changes.includes('access') ? ` (now ${ROLE_LABELS[updated.role]})` : ''}`,
    metadata: { changes, role: updated.role, allowedModules: updated.allowedModules },
    request,
  })

  return NextResponse.json({ data: serializeMember(updated) })
}

export const DELETE = async (request: Request, { params }: RouteContext) => {
  const { id } = await params
  const auth = await requireAdminApiAccess('team', 'edit')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (id === auth.user.id) {
    return NextResponse.json({ error: 'You cannot remove your own account.' }, { status: 400 })
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  }
  if (!canManageMember(auth.user, existing)) {
    return NextResponse.json({ error: `Only an ${ROLE_LABELS.SUPERADMIN} can remove another ${ROLE_LABELS.SUPERADMIN}.` }, { status: 403 })
  }
  if (existing.role === 'SUPERADMIN' && existing.isActive && (await ownerCount()) <= 1) {
    return NextResponse.json({ error: 'The team needs at least one active Owner.' }, { status: 400 })
  }

  await prisma.adminUser.delete({ where: { id } })
  await audit({
    actor: auth.user,
    action: 'deleted',
    entity: 'admin_user',
    entityId: id,
    summary: `Removed ${existing.name} (${existing.email}) from the team`,
    request,
  })
  return NextResponse.json({ success: true })
}
