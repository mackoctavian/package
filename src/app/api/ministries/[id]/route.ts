import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/api-guard'

const mapRecord = (record: any) => ({
  id: record.id,
  slug: record.slug,
  title: record.title,
  shortTitle: record.contact?.shortTitle ?? '',
  subtitle: record.highlightScripture ?? '',
  description: record.overview ?? '',
  shortDescription: record.shortDescription ?? '',
  heroImage: record.heroImage ?? '',
  icon: record.contact?.icon ?? '',
  focusAreas: Array.isArray(record.focusAreas) ? record.focusAreas : [],
  schedule: record.contact?.schedule ?? '',
  location: record.contact?.location ?? '',
  coordinator: record.contact?.coordinator ?? '',
  coordinatorImage: record.contact?.coordinatorImage ?? '',
  coordinatorBio: record.contact?.coordinatorBio ?? '',
  contactEmail: record.contact?.email ?? '',
  contactPhone: record.contact?.phone ?? '',
  order: record.order,
  isActive: record.isActive,
  isFeatured: record.contact?.isFeatured ?? false,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
})

const buildPayload = (body: any) => {
  const payload: Record<string, unknown> = {}

  const fields = [
    'slug',
    'title',
    'shortDescription',
    'description',
    'subtitle',
    'heroImage',
    'focusAreas',
    'order',
    'isActive',
  ] as const

  fields.forEach((key) => {
    if (body[key] !== undefined) {
      if (key === 'description') payload.overview = body[key]
      else if (key === 'subtitle') payload.highlightScripture = body[key]
      else payload[key] = body[key]
    }
  })

  const contact = {
    icon: body.icon ?? undefined,
    schedule: body.schedule ?? undefined,
    location: body.location ?? undefined,
    coordinator: body.coordinator ?? undefined,
    coordinatorImage: body.coordinatorImage ?? undefined,
    coordinatorBio: body.coordinatorBio ?? undefined,
    email: body.contactEmail ?? undefined,
    phone: body.contactPhone ?? undefined,
    isFeatured: body.isFeatured ?? undefined,
    shortTitle: body.shortTitle ?? undefined,
  }

  const cleanedContact = Object.fromEntries(Object.entries(contact).filter(([, value]) => value !== undefined))

  if (Object.keys(cleanedContact).length) {
    payload.contact = cleanedContact
  }

  return payload
}

export async function PATCH(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('ministries')
  if (denied) return denied

  try {
    const body = await request.json()
    const updates = buildPayload(body)

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No fields provided' }, { status: 400 })
    }

    const updated = await prisma.ministry.update({
      where: { id: params.id },
      data: updates,
    })

    return NextResponse.json({ data: mapRecord(updated) })
  } catch (error) {
    console.error('[ministries][PATCH]', error)
    return NextResponse.json({ error: 'Failed to update ministry' }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('ministries')
  if (denied) return denied

  try {
    await prisma.ministry.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ministries][DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete ministry' }, { status: 400 })
  }
}


