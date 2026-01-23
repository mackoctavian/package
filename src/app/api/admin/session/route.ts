import { NextResponse } from 'next/server'
import { AdminRole } from '@prisma/client'

import prisma from '@/lib/prisma'
import { sanitizeModules } from '@/lib/auth/admin-permissions'
import { createAdminSession, destroyAdminSession, getCurrentAdminUser } from '@/lib/auth/admin-session'
import { verifyPassword } from '@/lib/password'

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
  const { email, password } = await request.json()
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

  return NextResponse.json({ data: serializeUser(user) })
}

export const GET = async () => {
  const user = await getCurrentAdminUser()
  return NextResponse.json({ data: user ?? null })
}

export const DELETE = async () => {
  await destroyAdminSession()
  return NextResponse.json({ success: true })
}


