import prisma from '@/lib/prisma'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { noStore } from '@/lib/mobile/admin'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

/** The audit log, newest first. Same access as the web activity page (Team & access). */
export async function GET(request: Request) {
  const auth = await requireAdminApiAccess('team')
  if ('error' in auth) return noStore({ error: auth.error }, { status: auth.status })

  const params = new URL(request.url).searchParams
  const page = Math.max(1, Number(params.get('page')) || 1)
  const entity = params.get('entity')?.trim() || undefined
  const where = entity ? { entity } : {}

  try {
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { id: true, actorName: true, action: true, entity: true, entityId: true, summary: true, createdAt: true },
      }),
      prisma.auditLog.count({ where }),
    ])
    return noStore({ data: rows, page, pageSize: PAGE_SIZE, total })
  } catch (error) {
    console.error('[mobile-admin][activity]', error)
    return noStore({ error: 'Unable to load activity.' }, { status: 500 })
  }
}
