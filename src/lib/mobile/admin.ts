import { NextResponse } from 'next/server'

import { ROLE_LABELS } from '@/lib/auth/admin-permissions'
import { type AdminUserPayload, listModuleAccess } from '@/lib/auth/admin-shared'

/**
 * Shapes shared by the admin mobile app endpoints (`/api/mobile/admin/*`).
 * The app authenticates with `Authorization: Bearer <token>`; every other
 * admin API accepts the same header, so the app reuses them as they are.
 */
export const serializeAdminProfile = (user: Pick<AdminUserPayload, 'id' | 'name' | 'email' | 'role' | 'allowedModules'>) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  roleLabel: ROLE_LABELS[user.role],
  /** Every area the user can open, with `view` or `edit`. */
  access: listModuleAccess(user).map((module) => ({ id: module.id, label: module.label, group: module.group, level: module.level })),
})

export const noStore = (body: unknown, init?: { status?: number }) =>
  NextResponse.json(body, { status: init?.status ?? 200, headers: { 'Cache-Control': 'private, no-store' } })
