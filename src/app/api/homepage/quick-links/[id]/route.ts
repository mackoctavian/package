import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    const quickLink = await prisma.quickLink.update({
      where: { id: params.id },
      data: {
        title: body.title,
        imageUrl: body.imageUrl,
        href: body.href,
        parentId: body.parentId,
        order: body.order,
        isActive: body.isActive,
      },
    })
    
    return NextResponse.json({ data: quickLink })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quick link' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.quickLink.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quick link' }, { status: 500 })
  }
}








