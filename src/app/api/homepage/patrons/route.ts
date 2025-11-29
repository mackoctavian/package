import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const patrons = await prisma.patron.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ data: patrons })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patrons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const patron = await prisma.patron.create({
      data: {
        name: body.name,
        title: body.title,
        role: body.role || null,
        imageUrl: body.imageUrl,
        bio: body.bio || null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
      },
    })
    
    return NextResponse.json({ data: patron }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patron' }, { status: 500 })
  }
}

