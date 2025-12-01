import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    const slide = await prisma.heroSlide.update({
      where: { id: params.id },
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
    await prisma.heroSlide.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete hero slide' }, { status: 500 })
  }
}





