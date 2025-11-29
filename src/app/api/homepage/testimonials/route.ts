import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ data: testimonials })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const testimonial = await prisma.testimonial.create({
      data: {
        name: body.name,
        role: body.role,
        imageUrl: body.imageUrl,
        quote: body.quote,
        rating: body.rating ?? 5,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    })
    
    return NextResponse.json({ data: testimonial }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}

