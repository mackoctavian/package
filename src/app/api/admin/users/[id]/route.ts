import { NextResponse } from 'next/server'
import type { AdminRole } from '@prisma/client'

import prisma from '@/lib/prisma'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { hashPassword } from '@/lib/password'
import { sanitizeModules } from '@/lib/auth/admin-permissions'

const serializeUser = (user: {
  id: string
  name: string
  email: string
  role: AdminRole
  allowedModules: string[]
  isActive: boolean
  createdAt: Date
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  allowedModules: sanitizeModules(user.allowedModules),
  isActive: user.isActive,
  createdAt: user.createdAt,
})

export const PATCH = async (request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) => {
  const params = await paramsPromise
  const auth = await requireAdminApiAccess('team')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'Missing user id.' }, { status: 400 })
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (existing.role === 'SUPERADMIN' && auth.user.role !== 'SUPERADMIN' && existing.id !== auth.user.id) {
    return NextResponse.json({ error: 'Only super admins can update other super admins.' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (typeof body?.name === 'string') {
    const name = body.name.trim()
    if (name) updates.name = name
  }

  if (typeof body?.email === 'string') {
    const email = body.email.trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'Email cannot be empty.' }, { status: 400 })
    }
    updates.email = email
  }

  if (typeof body?.role === 'string') {
    const role = body.role as AdminRole
    if (!['SUPERADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role provided.' }, { status: 400 })
    }
    if (role === 'SUPERADMIN' && auth.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only super admins can assign the super admin role.' }, { status: 403 })
    }
    updates.role = role
  }

  if (Array.isArray(body?.allowedModules)) {
    updates.allowedModules = sanitizeModules(body.allowedModules)
  }

  if (typeof body?.isActive === 'boolean') {
    if (existing.id === auth.user.id && !body.isActive) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 })
    }
    updates.isActive = body.isActive
  }

  if (typeof body?.password === 'string' && body.password.trim()) {
    updates.passwordHash = await hashPassword(body.password)
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      allowedModules: true,
      isActive: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ data: serializeUser(updated) })
}

export const DELETE = async (_request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) => {
  const params = await paramsPromise
  const auth = await requireAdminApiAccess('team')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'Missing user id.' }, { status: 400 })
  }

  if (id === auth.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (existing.role === 'SUPERADMIN' && auth.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Only super admins can remove other super admins.' }, { status: 403 })
  }

  await prisma.adminUser.delete({ where: { id } })
  return NextResponse.json({ success: true })
}


