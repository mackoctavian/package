import { NextResponse } from 'next/server'

import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { buildRecordUpdate, isRecordKind, RECORD_KINDS, recordDelegate, recordDisplayName } from '@/lib/admin/records'

type RouteContext = { params: Promise<{ kind: string; id: string }> }

const resolve = async (params: RouteContext['params'], level: 'view' | 'edit') => {
  const { kind, id } = await params
  if (!isRecordKind(kind)) return { response: NextResponse.json({ error: 'Not found.' }, { status: 404 }) } as const
  const auth = await requireAdminApiAccess(RECORD_KINDS[kind].moduleId, level)
  if ('error' in auth) return { response: NextResponse.json({ error: auth.error }, { status: auth.status }) } as const
  return { kind, id, user: auth.user } as const
}

export async function GET(_request: Request, { params }: RouteContext) {
  const ctx = await resolve(params, 'view')
  if ('response' in ctx) return ctx.response
  const row = await recordDelegate(ctx.kind).findUnique({ where: { id: ctx.id } })
  if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  return NextResponse.json({ data: row })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const ctx = await resolve(params, 'edit')
  if ('response' in ctx) return ctx.response
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const update = buildRecordUpdate(ctx.kind, body)
  if ('error' in update) return NextResponse.json({ error: update.error }, { status: 400 })

  const delegate = recordDelegate(ctx.kind)
  const existing = await delegate.findUnique({ where: { id: ctx.id } })
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const row = await delegate.update({ where: { id: ctx.id }, data: update.data })

  const changed = Object.keys(update.data)
    .filter((key) => key !== 'adminNotes')
    .map((key) => `${key === 'paymentStatus' ? 'payment' : key === 'scheduledFor' ? 'date' : key} → ${update.data[key] instanceof Date ? (update.data[key] as Date).toDateString() : String(update.data[key] ?? 'none')}`)
  await audit({
    actor: ctx.user,
    action: 'updated',
    entity: ctx.kind,
    entityId: ctx.id,
    summary: `Updated ${RECORD_KINDS[ctx.kind].label} from ${recordDisplayName(ctx.kind, existing)}${changed.length ? `: ${changed.join(', ')}` : ' (notes)'}`,
    request,
  })
  return NextResponse.json({ data: row })
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const ctx = await resolve(params, 'edit')
  if ('response' in ctx) return ctx.response
  const delegate = recordDelegate(ctx.kind)
  const existing = await delegate.findUnique({ where: { id: ctx.id } })
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  await delegate.deleteMany({ where: { id: ctx.id } })
  await audit({
    actor: ctx.user,
    action: 'deleted',
    entity: ctx.kind,
    entityId: ctx.id,
    summary: `Deleted ${RECORD_KINDS[ctx.kind].label} from ${recordDisplayName(ctx.kind, existing)}`,
    request,
  })
  return NextResponse.json({ success: true })
}
