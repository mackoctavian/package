import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all homepage content
export async function GET() {
  try {
    const [heroSlides, quickLinks, patrons, testimonials] = await Promise.all([
      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.quickLink.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { order: 'asc' },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.patron.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
    ])

    return NextResponse.json({
      heroSlides,
      quickLinks,
      patrons,
      testimonials,
    })
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 })
  }
}








