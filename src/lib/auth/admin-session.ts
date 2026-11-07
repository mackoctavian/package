
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'node:crypto'
import type { AdminUser } from '@prisma/client'

import prisma from '@/lib/prisma'
import type { AccessLevel, AdminModuleId } from './admin-permissions'
import { sanitizeModules } from './admin-permissions'
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

/**
 * The admin mobile app sends its session token as `Authorization: Bearer …`
 * instead of a cookie. Same sessions table, same permission checks.
 */
const getTokenFromHeader = async () => {
  try {
    const value = (await headers()).get('authorization') ?? ''
    const match = /^Bearer\s+([a-f0-9]{64,128})$/i.exec(value.trim())
    return match ? match[1] : null
  } catch {
    return null
  }
}

/** The bearer token on the current request, if the caller is the admin app. */
export const getBearerToken = getTokenFromHeader

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
  const token = (await getTokenFromHeader()) ?? (await getTokenFromCookie())
  return getAdminUserByToken(token)
}

const MOBILE_SESSION_DAYS = 30

/**
 * Starts a session for the admin mobile app. Returns the raw token for the
 * app to keep in the device's secure storage; no cookie is set.
 */
export const createMobileAdminSession = async (userId: string) => {
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + MOBILE_SESSION_DAYS * 24 * 60 * 60 * 1000)
  await prisma.adminSession.create({ data: { token, userId, expiresAt } })
  return { token, expiresAt }
}

/** Ends the admin app session that made this request. */
export const destroyBearerSession = async () => {
  const token = await getTokenFromHeader()
  if (!token) return
  await prisma.adminSession.delete({ where: { token } }).catch(() => null)
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
  await clearSessionCookie()
}

const clearSessionCookie = async () => {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

/** Signs a user out everywhere, e.g. after their access is removed. */
export const revokeUserSessions = (userId: string) => prisma.adminSession.deleteMany({ where: { userId } })

export const requireAdminUser = async () => {
  const user = await getCurrentAdminUser()
  if (!user) redirect('/login')
  return user
}

export const requireAdminPageAccess = async (moduleId?: AdminModuleId, level: AccessLevel = 'view') => {
  const user = await requireAdminUser()
  if (moduleId && !userHasModuleAccess(user, moduleId, level)) {
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

export const requireAdminApiAccess = async (moduleId?: AdminModuleId, level: AccessLevel = 'view'): Promise<ApiAuthResult> => {
  const user = await getCurrentAdminUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (!userHasModuleAccess(user, moduleId, level)) {
    return {
      error: level === 'edit' && userHasModuleAccess(user, moduleId) ? 'You have view-only access to this area.' : 'You do not have access to this area.',
      status: 403,
    }
  }
  return { user }
}

