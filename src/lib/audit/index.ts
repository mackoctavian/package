import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import type { AdminUserPayload } from '@/lib/auth/admin-shared'

type AuditInput = {
  actor?: Pick<AdminUserPayload, 'id' | 'name'> | null
  /** A verb such as `created`, `updated`, `deleted`, `invited`, `signed_in`. */
  action: string
  /** What was acted on, such as `admin_user`, `booking`, `donation`. */
  entity: string
  entityId?: string | null
  /** One readable sentence, shown in the activity feed. */
  summary: string
  metadata?: Record<string, unknown>
  request?: Request
}

const clientIp = (request?: Request) =>
  request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request?.headers.get('x-real-ip') || null

/**
 * Records an entry in the audit log. Never throws: a failed audit write must
 * not break the action that triggered it.
 */
export async function audit({ actor, action, entity, entityId, summary, metadata, request }: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        summary,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
        ip: clientIp(request),
      },
    })
  } catch (error) {
    console.error('[audit] Failed to record entry:', error)
  }
}
