import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { createMobileAdminSession, destroyBearerSession, getCurrentAdminUser } from '@/lib/auth/admin-session'
import { sanitizeModules } from '@/lib/auth/admin-permissions'
import { noStore, serializeAdminProfile } from '@/lib/mobile/admin'
import { verifyPassword } from '@/lib/password'
import { rateLimit } from '@/lib/security/public-form'

export const dynamic = 'force-dynamic'

/** Signs in from the admin mobile app and returns a bearer token (30 days). */
export async function POST(request: Request) {
  const limited = rateLimit(request, 'admin-app-login', { limit: 10, windowMs: 15 * 60 * 1000 })
  if (limited) return limited

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown; device?: unknown }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const device = typeof body.device === 'string' ? body.device.slice(0, 80) : null
  if (!email || !password) return noStore({ error: 'Enter your email and password.' }, { status: 400 })

  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    return noStore({ error: 'That email and password do not match an active account.' }, { status: 401 })
  }

  const session = await createMobileAdminSession(user.id)
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => null)
  await audit({
    actor: user,
    action: 'signed_in',
    entity: 'session',
    entityId: user.id,
    summary: `${user.name} signed in on the admin app${device ? ` (${device})` : ''}`,
    request,
  })

  return noStore({
    data: {
      token: session.token,
      expiresAt: session.expiresAt,
      user: serializeAdminProfile({ ...user, allowedModules: sanitizeModules(user.allowedModules) }),
    },
  })
}

/** The signed-in admin and what they can open. 401 when the token is no longer valid. */
export async function GET() {
  const user = await getCurrentAdminUser()
  if (!user) return noStore({ error: 'Your session has ended. Please sign in again.' }, { status: 401 })
  return noStore({ data: serializeAdminProfile(user) })
}

/** Signs this device out. */
export async function DELETE(request: Request) {
  const user = await getCurrentAdminUser()
  await destroyBearerSession()
  if (user) await audit({ actor: user, action: 'signed_out', entity: 'session', entityId: user.id, summary: `${user.name} signed out of the admin app`, request })
  return noStore({ success: true })
}
