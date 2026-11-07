import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { annualLeaveUsed, awayOn, isMemberType } from '@/lib/admin/people'
import { memberData } from './shared'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAdminApiAccess('members')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const params = new URL(request.url).searchParams
  const q = params.get('q')?.trim()
  const type = params.get('type')
  const status = params.get('status')
  const where: Prisma.MemberWhereInput = {
    ...(type && type !== 'all' && { memberType: type }),
    ...(status && status !== 'all' && { status }),
    ...(q && {
      OR: ['fullName', 'email', 'phone', 'position', 'department'].map((field) => ({ [field]: { contains: q, mode: 'insensitive' as const } })),
    }),
  }

  try {
    const [members, counts, admins] = await Promise.all([
      prisma.member.findMany({ where, orderBy: { fullName: 'asc' }, include: { adminUser: { select: { id: true, name: true, email: true } } } }),
      prisma.member.groupBy({ by: ['memberType'], where: { status: 'active' }, _count: { _all: true } }),
      prisma.adminUser.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true, member: { select: { id: true } } } }),
    ])
    const [used, away] = await Promise.all([annualLeaveUsed(members.map((member) => member.id)), awayOn()])
    return NextResponse.json({
      data: members.map((member) => ({
        ...member,
        startDate: member.startDate?.toISOString().slice(0, 10) ?? null,
        annualLeaveUsed: used.get(member.id) ?? 0,
        awayUntil: away.get(member.id)?.endDate.toISOString().slice(0, 10) ?? null,
      })),
      counts: Object.fromEntries(counts.map((row) => [row.memberType, row._count._all])),
      awayToday: away.size,
      admins: admins.map((admin) => ({ id: admin.id, name: admin.name, email: admin.email, linkedMemberId: admin.member?.id ?? null })),
    })
  } catch (error) {
    console.error('[members][GET]', error)
    return NextResponse.json({ error: 'Unable to load members.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApiAccess('members', 'edit')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsed = memberData(body, true)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (!isMemberType(parsed.data.memberType ?? 'staff')) return NextResponse.json({ error: 'Choose a valid role.' }, { status: 400 })

  try {
    const member = await prisma.member.create({ data: parsed.data as Prisma.MemberUncheckedCreateInput })
    await audit({ actor: auth.user, action: 'created', entity: 'member', entityId: member.id, summary: `Added ${member.fullName} to the members directory`, request })
    return NextResponse.json({ data: member }, { status: 201 })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return NextResponse.json({ error: 'That login is already linked to another member.' }, { status: 409 })
    console.error('[members][POST]', error)
    return NextResponse.json({ error: 'Could not add the member.' }, { status: 500 })
  }
}
