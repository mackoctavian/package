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
  if (!body?.title) throw new Error('Title is required')
  return {
    slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: body.title,
    shortDescription: body.shortDescription || null,
    overview: body.description || '',
    highlightScripture: body.subtitle || null,
    heroImage: body.heroImage || null,
    focusAreas: body.focusAreas || [],
    contact: {
      icon: body.icon || null,
      schedule: body.schedule || null,
      location: body.location || null,
      coordinator: body.coordinator || null,
      coordinatorImage: body.coordinatorImage || null,
      coordinatorBio: body.coordinatorBio || null,
      email: body.contactEmail || null,
      phone: body.contactPhone || null,
      isFeatured: body.isFeatured ?? false,
      shortTitle: body.shortTitle || null,
    },
    order: body.order ?? 0,
    isActive: body.isActive ?? true,
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const activeParam = url.searchParams.get('active')
    const filterActive = activeParam === null ? undefined : activeParam === 'true'

    const records = await prisma.ministry.findMany({
      where: filterActive === undefined ? undefined : { isActive: filterActive },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ data: records.map(mapRecord) })
  } catch (error) {
    console.error('[ministries][GET]', error)
    return NextResponse.json({ error: 'Failed to fetch ministries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = await guardAdminApi('ministries', 'edit')
  if (denied) return denied

  try {
    const body = await request.json()
    const payload = buildPayload(body)

    const created = await prisma.ministry.create({ data: payload })
    return NextResponse.json({ data: mapRecord(created) }, { status: 201 })
  } catch (error) {
    console.error('[ministries][POST]', error)
    return NextResponse.json({ error: (error as Error).message || 'Failed to create ministry' }, { status: 400 })
  }
}


