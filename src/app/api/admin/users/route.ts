import { NextResponse } from 'next/server'
import { AdminRole } from '@prisma/client'

import prisma from '@/lib/prisma'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { hashPassword } from '@/lib/password'
import { ADMIN_MODULES, AdminModuleId, sanitizeModules } from '@/lib/auth/admin-permissions'

const allowedRoles: AdminRole[] = ['SUPERADMIN', 'EDITOR', 'VIEWER']

const normalizeEmail = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const normalizeName = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

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

export const GET = async () => {
  const auth = await requireAdminApiAccess('team')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
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

  return NextResponse.json({ data: users.map(serializeUser), modules: ADMIN_MODULES })
}

export const POST = async (request: Request) => {
  const auth = await requireAdminApiAccess('team')
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const name = normalizeName(body?.name)
  const email = normalizeEmail(body?.email)
  const password = typeof body?.password === 'string' ? body.password.trim() : ''
  const role = (body?.role ?? 'EDITOR') as AdminRole
  const modules = sanitizeModules(body?.allowedModules as AdminModuleId[])

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role provided.' }, { status: 400 })
  }

  if (role === 'SUPERADMIN' && auth.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Only super admins can create other super admins.' }, { status: 403 })
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)

  const created = await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      allowedModules: modules,
    },
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

  return NextResponse.json({ data: serializeUser(created) }, { status: 201 })
}


