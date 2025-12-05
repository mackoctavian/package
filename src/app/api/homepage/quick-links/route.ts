import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const quickLinks = await prisma.quickLink.findMany({
      orderBy: { order: 'asc' },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
    })
    return NextResponse.json({ data: quickLinks })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quick links' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const quickLink = await prisma.quickLink.create({
      data: {
        title: body.title,
        imageUrl: body.imageUrl,
        href: body.href || null,
        parentId: body.parentId || null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    })
    
    return NextResponse.json({ data: quickLink }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quick link' }, { status: 500 })
  }
}








