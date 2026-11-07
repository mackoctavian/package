import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { type TestimonialType } from '@/app/types/testimonial'
import { guardAdminApi } from '@/lib/auth/api-guard'

const FALLBACK_TESTIMONIALS: Array<{ name: string; role: string; imageUrl: string; quote: string; rating: number; order: number; isActive: boolean }> = [
  {
    name: 'Andrew Williams',
    role: 'UX/UI Designer',
    imageUrl: '/images/testimonial/user-1.jpg',
    quote:
      "I have been a Junior Graphic Designer for more then 10 years. Some things are problem that I had and teach how to solve them. That's why this course is so great!",
    rating: 5,
    order: 0,
    isActive: true,
  },
  {
    name: 'Cristian Doru Barin',
    role: 'UX/UI Designer',
    imageUrl: '/images/testimonial/user-2.jpg',
    quote:
      "I have been a Junior Graphic Designer for more then 10 years. Some things are problem that I had and teach how to solve them. That's why this course is so great!",
    rating: 5,
    order: 1,
    isActive: true,
  },
  {
    name: 'Tanzeel Ur Rehman',
    role: 'UX/UI Designer',
    imageUrl: '/images/testimonial/user-3.jpg',
    quote:
      "I have been a Junior Graphic Designer for more then 10 years. Some things are problem that I had and teach how to solve them. That's why this course is so great!",
    rating: 5,
    order: 2,
    isActive: true,
  },
]

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ data: testimonials })
  } catch (error) {
    console.error('[homepage][testimonials][GET] Prisma error:', error)
    return NextResponse.json({ data: FALLBACK_TESTIMONIALS, source: 'static', error: 'Database unavailable' })
  }
}

export async function POST(request: Request) {
  const denied = await guardAdminApi('homepage', 'edit')
  if (denied) return denied

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








