import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { guardAdminApi, isAdminRequest } from '@/lib/auth/api-guard'

type RouteContext = { params: Promise<{ type: string }> }

const SUPPORTED_TYPES = new Set(['gallery', 'news', 'events', 'publications', 'patrons', 'about', 'ministries', 'articles'])

const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeType = (type: string) => type.toLowerCase()

const resolveType = (type: string) => {
  const normalized = normalizeType(type)
  if (!SUPPORTED_TYPES.has(normalized)) {
    throw new Error(`Unsupported content type: ${type}`)
  }
  return normalized
}

const buildPayload = (body: any) => {
  if (!body?.title) {
    throw new Error('Title is required')
  }

  const slug = sanitizeSlug(body.slug || body.title)
  return {
    title: body.title,
    slug,
    summary: body.summary ?? null,
    body: body.body ?? null,
    category: body.category ?? null,
    status: body.status ?? 'draft',
    mediaUrl: body.mediaUrl ?? null,
    publishDate: body.publishDate ? new Date(body.publishDate) : null,
    metadata: body.metadata ?? {},
  }
}

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const params = await context.params
    const type = resolveType(params.type)
    // Drafts are only visible to admins who manage this content type.
    const canSeeDrafts = await isAdminRequest(type as AdminModuleId)
    const items = await prisma.contentItem.findMany({
      where: canSeeDrafts ? { type } : { type, status: 'published' },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ data: items })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export const POST = async (request: Request, context: RouteContext) => {
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
    const raw = await request.json()
    const payload = buildPayload(raw)

    const created = await prisma.contentItem.create({
      data: {
        type,
        ...payload,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

