import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'

/**
 * The three inboxes of incoming requests from the public site: gifts, Mass
 * intentions and contact messages. They share one admin API and one UI.
 */
export const RECORD_KINDS = {
  donations: {
    moduleId: 'donations',
    label: 'donation',
    statuses: ['new', 'acknowledged', 'archived'],
    paymentStatuses: ['pending', 'paid', 'failed', 'refunded'],
    searchFields: ['fullName', 'email', 'phone', 'prayerIntention'],
  },
  'mass-intentions': {
    moduleId: 'mass-intentions',
    label: 'Mass intention',
    statuses: ['new', 'scheduled', 'celebrated', 'cancelled'],
    paymentStatuses: [],
    searchFields: ['fullName', 'email', 'phone', 'intentionFor', 'intentionDetails'],
  },
  feedback: {
    moduleId: 'feedback',
    label: 'message',
    statuses: ['new', 'read', 'replied', 'archived'],
    paymentStatuses: [],
    searchFields: ['firstName', 'lastName', 'email', 'message'],
  },
} as const satisfies Record<string, { moduleId: AdminModuleId; label: string; statuses: readonly string[]; paymentStatuses: readonly string[]; searchFields: readonly string[] }>

export type RecordKind = keyof typeof RECORD_KINDS
export const isRecordKind = (value: string): value is RecordKind => value in RECORD_KINDS

export type RecordFilters = { status?: string; payment?: string; q?: string; from?: Date; to?: Date }

export const parseRecordFilters = (params: URLSearchParams): RecordFilters => {
  const text = (key: string) => {
    const value = params.get(key)?.trim()
    return value && value !== 'all' ? value : undefined
  }
  const date = (key: string, endOfDay = false) => {
    const raw = text(key)
    if (!raw) return undefined
    const parsed = new Date(endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59.999Z` : raw)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  return { status: text('status'), payment: text('payment'), q: text('q'), from: date('from'), to: date('to', true) }
}

export const recordWhere = (kind: RecordKind, filters: RecordFilters) => {
  const config = RECORD_KINDS[kind]
  return {
    ...(filters.status && { status: filters.status }),
    ...(filters.payment && config.paymentStatuses.length && { paymentStatus: filters.payment }),
    ...((filters.from || filters.to) && { createdAt: { ...(filters.from && { gte: filters.from }), ...(filters.to && { lte: filters.to }) } }),
    ...(filters.q && { OR: config.searchFields.map((field) => ({ [field]: { contains: filters.q, mode: 'insensitive' as const } })) }),
  }
}

/** Prisma delegate for a kind, typed loosely so the three can share code. */
type LooseDelegate = {
  findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>
  count: (args: unknown) => Promise<number>
  groupBy: (args: unknown) => Promise<Array<Record<string, unknown> & { _count: { _all: number } }>>
  update: (args: unknown) => Promise<Record<string, unknown>>
  updateMany: (args: unknown) => Promise<{ count: number }>
  deleteMany: (args: unknown) => Promise<{ count: number }>
}

export const recordDelegate = (kind: RecordKind): LooseDelegate =>
  ({ donations: prisma.donation, 'mass-intentions': prisma.massIntention, feedback: prisma.feedbackMessage })[kind] as unknown as LooseDelegate

export const recordDisplayName = (kind: RecordKind, row: Record<string, unknown>) =>
  kind === 'feedback' ? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() : String(row.fullName ?? '')

/** Validates an admin's edit of a single record and returns the Prisma update. */
export const buildRecordUpdate = (kind: RecordKind, body: Record<string, unknown>): { data: Record<string, unknown> } | { error: string } => {
  const config = RECORD_KINDS[kind]
  const data: Record<string, unknown> = {}
  if (typeof body.status === 'string') {
    if (!(config.statuses as readonly string[]).includes(body.status)) return { error: 'Choose a valid status.' }
    data.status = body.status
  }
  if (typeof body.paymentStatus === 'string') {
    if (!(config.paymentStatuses as readonly string[]).includes(body.paymentStatus)) return { error: 'Choose a valid payment status.' }
    data.paymentStatus = body.paymentStatus
  }
  if (typeof body.adminNotes === 'string') data.adminNotes = body.adminNotes.slice(0, 5000) || null
  if (kind === 'mass-intentions') {
    if (body.scheduledFor === null || body.scheduledFor === '') data.scheduledFor = null
    else if (typeof body.scheduledFor === 'string') {
      const date = new Date(body.scheduledFor)
      if (Number.isNaN(date.getTime())) return { error: 'Enter a valid date.' }
      data.scheduledFor = date
    }
    if (typeof body.celebrant === 'string') data.celebrant = body.celebrant.trim().slice(0, 120) || null
  }
  if (!Object.keys(data).length) return { error: 'No changes to save.' }
  return { data }
}

export type { Prisma }
