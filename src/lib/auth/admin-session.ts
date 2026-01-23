"use server"

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'node:crypto'
import type { AdminUser } from '@prisma/client'

import prisma from '@/lib/prisma'
import { AdminModuleId, sanitizeModules } from './admin-permissions'
import { AdminUserPayload, userHasModuleAccess } from './admin-shared'

const SESSION_COOKIE = 'admin_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 8

const normalizeUser = (user: AdminUser): AdminUserPayload => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  allowedModules: sanitizeModules(user.allowedModules),
})

const getTokenFromCookie = async () => {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export const getAdminUserByToken = async (token: string | null): Promise<AdminUserPayload | null> => {
  if (!token) return null

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null

  if (session.expiresAt < new Date() || !session.user.isActive) {
    await prisma.adminSession.delete({ where: { token } }).catch(() => null)
    return null
  }

  return normalizeUser(session.user)
}

export const getCurrentAdminUser = async () => {
  const token = await getTokenFromCookie()
  return getAdminUserByToken(token)
}

export const createAdminSession = async (userId: string) => {
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)

  await prisma.adminSession.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  })

  return { token, expiresAt }
}

export const destroyAdminSession = async () => {
  const token = await getTokenFromCookie()
  if (!token) return
  await prisma.adminSession.delete({ where: { token } }).catch(() => null)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export const requireAdminUser = async () => {
  const user = await getCurrentAdminUser()
  if (!user) redirect('/login')
  return user
}

export const requireAdminPageAccess = async (moduleId?: AdminModuleId) => {
  const user = await requireAdminUser()
  if (moduleId && !userHasModuleAccess(user, moduleId)) {
    redirect('/admin?denied=1')
  }
  return user
}

type ApiAuthResult =
  | { user: AdminUserPayload }
  | {
      error: string
      status: number
    }

export const requireAdminApiAccess = async (moduleId?: AdminModuleId): Promise<ApiAuthResult> => {
  const user = await getCurrentAdminUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (moduleId && !userHasModuleAccess(user, moduleId)) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user }
}

