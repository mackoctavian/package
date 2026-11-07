import { NextResponse } from 'next/server'

import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { isRecordKind, RECORD_KINDS, recordDelegate } from '@/lib/admin/records'

/** Sets the status (or payment status) of many records at once. */
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params
  if (!isRecordKind(kind)) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const config = RECORD_KINDS[kind]
  const auth = await requireAdminApiAccess(config.moduleId, 'edit')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null)
  const ids = Array.isArray(body?.ids) ? (body.ids as unknown[]).filter((id): id is string => typeof id === 'string').slice(0, 500) : []
  if (!ids.length) return NextResponse.json({ error: 'Select at least one record.' }, { status: 400 })

  const data: Record<string, string> = {}
  if (typeof body?.status === 'string' && (config.statuses as readonly string[]).includes(body.status)) data.status = body.status
  if (typeof body?.paymentStatus === 'string' && (config.paymentStatuses as readonly string[]).includes(body.paymentStatus)) data.paymentStatus = body.paymentStatus
  if (!Object.keys(data).length) return NextResponse.json({ error: 'Choose a valid status.' }, { status: 400 })

  const { count } = await recordDelegate(kind).updateMany({ where: { id: { in: ids } }, data })
  await audit({
    actor: auth.user,
    action: 'updated',
    entity: kind,
    summary: `Set ${count} ${config.label}${count === 1 ? '' : 's'} to ${Object.values(data).join(' / ')}`,
    metadata: { ids, ...data },
    request,
  })
  return NextResponse.json({ data: { updated: count } })
}
