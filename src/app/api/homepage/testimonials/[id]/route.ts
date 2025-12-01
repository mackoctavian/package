import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.testimonial.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}





