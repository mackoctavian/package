import { NextResponse } from 'next/server'
import type { QuickLink } from '@prisma/client'

import prisma from '@/lib/prisma'
import { guardAdminApi } from '@/lib/auth/api-guard'

type QuickLinkNode = QuickLink & { children: QuickLinkNode[] }

const buildQuickLinksTree = (records: QuickLink[]): QuickLinkNode[] => {
  const lookup = new Map<string, QuickLinkNode>()

  records.forEach((record) => {
    lookup.set(record.id, { ...record, children: [] })
  })

  const roots: QuickLinkNode[] = []

  lookup.forEach((node) => {
    if (node.parentId && lookup.has(node.parentId)) {
      lookup.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortRecursive = (nodes: QuickLinkNode[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach((child) => sortRecursive(child.children))
  }

  sortRecursive(roots)
  return roots
}

export async function GET() {
  try {
    const records = await prisma.quickLink.findMany({
      orderBy: { order: 'asc' },
    })
    const tree = buildQuickLinksTree(records)
    return NextResponse.json({ data: tree })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quick links' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = await guardAdminApi('homepage')
  if (denied) return denied

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








