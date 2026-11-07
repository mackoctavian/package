import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { getCurrentAdminUser } from '@/lib/auth/admin-session'
import { normalizeName, passwordProblem } from '@/lib/auth/team'
import { hashPassword, verifyPassword } from '@/lib/password'
import { rateLimit } from '@/lib/security/public-form'

/** Lets a signed-in admin change their own name or password. */
export const PATCH = async (request: Request) => {
  const user = await getCurrentAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = rateLimit(request, 'admin-account', { limit: 10, windowMs: 15 * 60 * 1000 })
  if (limited) return limited

  const body = await request.json().catch(() => null)
  const data: { name?: string; passwordHash?: string } = {}

  if (typeof body?.name === 'string') {
    const name = normalizeName(body.name)
    if (!name) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
    data.name = name
  }

  if (typeof body?.newPassword === 'string' && body.newPassword) {
    const record = await prisma.adminUser.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
    const current = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
    if (!record || !(await verifyPassword(current, record.passwordHash))) {
      return NextResponse.json({ error: 'Your current password is not correct.' }, { status: 400 })
    }
    const weak = passwordProblem(body.newPassword.trim())
    if (weak) return NextResponse.json({ error: weak }, { status: 400 })
    data.passwordHash = await hashPassword(body.newPassword)
  }

  if (!Object.keys(data).length) return NextResponse.json({ error: 'No changes to save.' }, { status: 400 })

  await prisma.adminUser.update({ where: { id: user.id }, data })
  if (data.passwordHash) {
    await audit({ actor: user, action: 'updated', entity: 'admin_user', entityId: user.id, summary: `${user.name} changed their password`, request })
  }
  return NextResponse.json({ success: true })
}
