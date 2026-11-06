import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/api-guard'

const getPatronId = (request: Request, params?: { id?: string }) => {
  if (params?.id) return params.id
  const pathname = new URL(request.url).pathname
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? ''
}

export async function PATCH(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('homepage')
  if (denied) return denied

  try {
    const patronId = getPatronId(request, params)
    if (!patronId) {
      return NextResponse.json({ error: 'Patron id is required.' }, { status: 400 })
    }

    const body = await request.json()
    
    const patron = await prisma.patron.update({
      where: { id: patronId },
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

export async function DELETE(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('homepage')
  if (denied) return denied

  try {
    const patronId = getPatronId(request, params)
    if (!patronId) {
      return NextResponse.json({ error: 'Patron id is required.' }, { status: 400 })
    }

    await prisma.patron.delete({
      where: { id: patronId },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete patron' }, { status: 500 })
  }
}








