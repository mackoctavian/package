import { NextResponse } from 'next/server'

import { retreatData } from '@/app/data/retreats'
import prisma from '@/lib/prisma'
import { mapPrismaRetreat } from './utils'
import { retreatInputSchema } from '@/lib/validators/retreat'
import { guardAdminApi } from '@/lib/auth/api-guard'
import { localizeRecords } from '@/lib/i18n/content'
import { localeFromRequest } from '@/i18n/request'

export const GET = async (request: Request) => {
  try {
    // `?locale=sw` returns Swahili text where it has been translated (used by the public site).
    const records = await localizeRecords(
      'retreat',
      await prisma.retreat.findMany({
        orderBy: { dateRange: 'asc' },
      }),
      localeFromRequest(request),
    )
    const payload = records.map(mapPrismaRetreat)

    return NextResponse.json({ data: payload, source: 'prisma' })
  } catch (error) {
    console.error('[retreats][GET] Prisma error:', error)
    return NextResponse.json({ data: retreatData, source: 'static', error: 'Database unavailable' })
  }
}

export const POST = async (request: Request) => {
  const denied = await guardAdminApi('retreats', 'edit')
  if (denied) return denied

  try {
    const json = await request.json()
    const parsed = retreatInputSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const body = parsed.data

    const availability = body.availability ?? { total: 0, male: 0, female: 0 }
    const created = await prisma.retreat.create({
      data: {
        slug: body.slug,
        title: body.title,
        subtitle: body.subtitle ?? null,
        speaker: body.speaker,
        conductor: body.conductor,
        description: body.description,
        dateRange: body.dateRange,
        timeRange: body.timeRange,
        location: body.location,
        availabilityTotal: availability.total ?? 0,
        availabilityMale: availability.male ?? 0,
        availabilityFemale: availability.female ?? 0,
        status: body.status ?? 'Registration Open',
        imageSrc: body.imageSrc,
        category: body.category,
        detailHref: body.detailHref ?? `/events/${body.slug}`,
        ctaHref: body.ctaHref ?? `/events/${body.slug}#booking`,
        price: body.price ?? null,
        isPaid: body.isPaid ?? true,
      },
    })

    return NextResponse.json({ data: mapPrismaRetreat(created) }, { status: 201 })
  } catch (error) {
    console.error('[retreats][POST] Prisma error:', error)
    return NextResponse.json({ error: 'Unable to create retreat.' }, { status: 500 })
  }
}

