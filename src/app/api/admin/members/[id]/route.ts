import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { annualLeaveUsed, leaveInclude, serializeLeave } from '@/lib/admin/people'
import { memberData } from '../shared'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const auth = await requireAdminApiAccess('members')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const member = await prisma.member.findUnique({ where: { id }, include: { adminUser: { select: { id: true, name: true, email: true } } } })
  if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  const [leave, used] = await Promise.all([
    prisma.leaveRequest.findMany({ where: { memberId: id }, orderBy: { startDate: 'desc' }, take: 50, include: leaveInclude }),
    annualLeaveUsed([id]),
  ])
  return NextResponse.json({ data: { ...member, annualLeaveUsed: used.get(id) ?? 0, leave: leave.map(serializeLeave) } })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params
  const auth = await requireAdminApiAccess('members', 'edit')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsed = memberData(body, false)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (!Object.keys(parsed.data).length) return NextResponse.json({ error: 'No changes to save.' }, { status: 400 })

  try {
    const member = await prisma.member.update({ where: { id }, data: parsed.data as Prisma.MemberUncheckedUpdateInput })
    await audit({ actor: auth.user, action: 'updated', entity: 'member', entityId: id, summary: `Updated ${member.fullName}'s member details`, request })
    return NextResponse.json({ data: member })
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'P2025') return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    if (code === 'P2002') return NextResponse.json({ error: 'That login is already linked to another member.' }, { status: 409 })
    console.error('[members][PATCH]', error)
    return NextResponse.json({ error: 'Could not save the member.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params
  const auth = await requireAdminApiAccess('members', 'edit')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const member = await prisma.member.findUnique({ where: { id } })
  if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  await prisma.member.delete({ where: { id } })
  await audit({ actor: auth.user, action: 'deleted', entity: 'member', entityId: id, summary: `Removed ${member.fullName} and their leave history from the members directory`, request })
  return NextResponse.json({ success: true })
}
