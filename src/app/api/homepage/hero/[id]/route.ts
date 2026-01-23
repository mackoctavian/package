import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const getSlideId = (request: Request, params?: { id?: string }) => {
  if (params?.id) return params.id
  const pathname = new URL(request.url).pathname
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? ''
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const slideId = getSlideId(request, params)
    if (!slideId) {
      return NextResponse.json({ error: 'Slide id is required.' }, { status: 400 })
    }

    const body = await request.json()
    
    const slide = await prisma.heroSlide.update({
      where: { id: slideId },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl,
        linkText: body.linkText,
        order: body.order,
        isActive: body.isActive,
      },
    })
    
    return NextResponse.json({ data: slide })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update hero slide' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const slideId = getSlideId(request, params)
    if (!slideId) {
      return NextResponse.json({ error: 'Slide id is required.' }, { status: 400 })
    }

    await prisma.heroSlide.delete({
      where: { id: slideId },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete hero slide' }, { status: 500 })
  }
}








