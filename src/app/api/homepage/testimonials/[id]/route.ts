import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/api-guard'

const getTestimonialId = (request: Request, params?: { id?: string }) => {
  if (params?.id) return params.id
  const pathname = new URL(request.url).pathname
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? ''
}

export async function PATCH(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('homepage', 'edit')
  if (denied) return denied

  try {
    const testimonialId = getTestimonialId(request, params)
    if (!testimonialId) {
      return NextResponse.json({ error: 'Testimonial id is required.' }, { status: 400 })
    }

    const body = await request.json()
    
    const testimonial = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        name: body.name,
        role: body.role,
        imageUrl: body.imageUrl,
        quote: body.quote,
        rating: body.rating,
        order: body.order,
        isActive: body.isActive,
      },
    })
    
    return NextResponse.json({ data: testimonial })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('homepage', 'edit')
  if (denied) return denied

  try {
    const testimonialId = getTestimonialId(request, params)
    if (!testimonialId) {
      return NextResponse.json({ error: 'Testimonial id is required.' }, { status: 400 })
    }

    await prisma.testimonial.delete({
      where: { id: testimonialId },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}








