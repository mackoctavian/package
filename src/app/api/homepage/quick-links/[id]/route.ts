import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/api-guard'

const getQuickLinkId = (request: Request, params?: { id?: string }) => {
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
    const quickLinkId = getQuickLinkId(request, params)
    if (!quickLinkId) {
      return NextResponse.json({ error: 'Quick link id is required.' }, { status: 400 })
    }

    const body = await request.json()
    
    const quickLink = await prisma.quickLink.update({
      where: { id: quickLinkId },
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

export async function DELETE(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const denied = await guardAdminApi('homepage', 'edit')
  if (denied) return denied

  try {
    const quickLinkId = getQuickLinkId(request, params)
    if (!quickLinkId) {
      return NextResponse.json({ error: 'Quick link id is required.' }, { status: 400 })
    }

    await prisma.quickLink.delete({
      where: { id: quickLinkId },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quick link' }, { status: 500 })
  }
}








