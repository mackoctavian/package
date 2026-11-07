import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { guardAdminApi } from '@/lib/auth/api-guard'

type RouteContext = { params: Promise<{ type: string; id: string }> }

const SUPPORTED_TYPES = new Set(['gallery', 'news', 'events', 'publications', 'patrons', 'about', 'ministries', 'articles'])

const resolveType = (type: string) => {
  const normalized = type.toLowerCase()
  if (!SUPPORTED_TYPES.has(normalized)) {
    throw new Error(`Unsupported content type: ${type}`)
  }
  return normalized
}

const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildPayload = (body: any) => {
  const payload: Record<string, unknown> = {}
  if (body.title) payload.title = body.title
  if (body.slug) payload.slug = sanitizeSlug(body.slug)
  if (body.summary !== undefined) payload.summary = body.summary
  if (body.body !== undefined) payload.body = body.body
  if (body.category !== undefined) payload.category = body.category
  if (body.status) payload.status = body.status
  if (body.mediaUrl !== undefined) payload.mediaUrl = body.mediaUrl
  if (body.publishDate !== undefined) {
    payload.publishDate = body.publishDate ? new Date(body.publishDate) : null
  }
  if (body.metadata !== undefined) payload.metadata = body.metadata
  return payload
}

export const PATCH = async (request: Request, context: RouteContext) => {
  const params = await context.params
  let type: string
  try {
    type = resolveType(params.type)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
  const denied = await guardAdminApi(type as AdminModuleId, 'edit')
  if (denied) return denied

  try {
    const json = await request.json()
    const data = buildPayload(json)
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    const updated = await prisma.contentItem.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export const DELETE = async (_: Request, context: RouteContext) => {
  const params = await context.params
  let type: string
  try {
    type = resolveType(params.type)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
  const denied = await guardAdminApi(type as AdminModuleId, 'edit')
  if (denied) return denied

  try {
    await prisma.contentItem.delete({
      where: { id: params.id, type },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

