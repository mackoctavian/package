import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ data: slides })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hero slides' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const slide = await prisma.heroSlide.create({
      data: {
        title: body.title || null,
        subtitle: body.subtitle || null,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl || null,
        linkText: body.linkText || null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    })
    
    return NextResponse.json({ data: slide }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create hero slide' }, { status: 500 })
  }
}

