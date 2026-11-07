import { NextResponse } from 'next/server'
import { AdminRole } from '@prisma/client'

import prisma from '@/lib/prisma'
import { sanitizeModules } from '@/lib/auth/admin-permissions'
import { createAdminSession, destroyAdminSession, getCurrentAdminUser } from '@/lib/auth/admin-session'
import { verifyPassword } from '@/lib/password'
import { audit } from '@/lib/audit'
import { rateLimit } from '@/lib/security/public-form'

const serializeUser = (user: {
  id: string
  name: string
  email: string
  role: AdminRole
  allowedModules: string[]
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  allowedModules: sanitizeModules(user.allowedModules),
})

export const POST = async (request: Request) => {
  const limited = rateLimit(request, 'admin-login', { limit: 10, windowMs: 15 * 60 * 1000 })
  if (limited) return limited

  const { email, password } = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown }
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const passwordValue = typeof password === 'string' ? password : ''

  if (!normalizedEmail || !passwordValue) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const isValid = await verifyPassword(passwordValue, user.passwordHash)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  await createAdminSession(user.id)
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => null)
  await audit({ actor: user, action: 'signed_in', entity: 'session', entityId: user.id, summary: `${user.name} signed in`, request })

  return NextResponse.json({ data: serializeUser(user) })
}

export const GET = async () => {
  const user = await getCurrentAdminUser()
  return NextResponse.json({ data: user ?? null })
}

export const DELETE = async (request: Request) => {
  const user = await getCurrentAdminUser()
  await destroyAdminSession()
  if (user) await audit({ actor: user, action: 'signed_out', entity: 'session', entityId: user.id, summary: `${user.name} signed out`, request })
  return NextResponse.json({ success: true })
}


