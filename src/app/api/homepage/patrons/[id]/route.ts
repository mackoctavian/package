import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    const patron = await prisma.patron.update({
      where: { id: params.id },
      data: {
        name: body.name,
        title: body.title,
        role: body.role,
        imageUrl: body.imageUrl,
        bio: body.bio,
        order: body.order,
        isActive: body.isActive,
      },
    })
    
    return NextResponse.json({ data: patron })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update patron' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.patron.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete patron' }, { status: 500 })
  }
}








