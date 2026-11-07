import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { audit } from '@/lib/audit'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { requireAdminApiAccess } from '@/lib/auth/admin-session'
import { buildWorkbook, excelResponse, type ExcelColumn, exportFilename } from '@/lib/export/excel'

export const dynamic = 'force-dynamic'

type Filters = { from?: Date; to?: Date; status?: string; retreatId?: string; q?: string; payment?: string; attended?: string }

const parseFilters = (url: URL): Filters => {
  const date = (key: string, endOfDay = false) => {
    const raw = url.searchParams.get(key)
    if (!raw) return undefined
    const parsed = new Date(endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59.999Z` : raw)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  const text = (key: string) => url.searchParams.get(key)?.trim() || undefined
  return {
    from: date('from'),
    to: date('to', true),
    status: text('status'),
    retreatId: text('retreatId'),
    q: text('q'),
    payment: text('payment'),
    attended: text('attended'),
  }
}

const createdRange = ({ from, to }: Filters) => (from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {})
const search = (q: string | undefined, fields: string[]) =>
  q ? { OR: fields.map((field) => ({ [field]: { contains: q, mode: 'insensitive' as const } })) } : {}

const money = '#,##0'
const dateTime = 'dd mmm yyyy hh:mm'
const dateOnly = 'dd mmm yyyy'

type Dataset = {
  moduleId: AdminModuleId
  sheet: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each dataset has its own row type
  load: (filters: Filters) => Promise<{ rows: any[]; columns: ExcelColumn<any>[] }>
}

const DATASETS: Record<string, Dataset> = {
  bookings: {
    moduleId: 'retreats',
    sheet: 'Bookings',
    load: async (filters) => {
      const where: Prisma.RetreatBookingWhereInput = {
        ...createdRange(filters),
        ...(filters.status && { status: filters.status }),
        ...(filters.retreatId && { retreatId: filters.retreatId }),
        ...(filters.payment && { paymentStatus: filters.payment }),
        ...((filters.attended === 'yes' || filters.attended === 'no') && { attended: filters.attended === 'yes' }),
        ...search(filters.q, ['fullName', 'email', 'phone', 'ticketCode']),
      }
      const rows = await prisma.retreatBooking.findMany({ where, orderBy: { createdAt: 'desc' } })
      const columns: ExcelColumn<(typeof rows)[number]>[] = [
        { header: 'Booked on', value: (r) => r.createdAt, numFmt: dateTime, width: 18 },
        { header: 'Retreat', value: (r) => r.retreatTitle, width: 34 },
        { header: 'Full name', value: (r) => r.fullName, width: 26 },
        { header: 'Email', value: (r) => r.email, width: 28 },
        { header: 'Phone', value: (r) => r.phone, width: 16 },
        { header: 'WhatsApp', value: (r) => r.whatsapp, width: 16 },
        { header: 'Party size', value: (r) => 1 + (Array.isArray(r.familyMembers) ? r.familyMembers.length : 0) },
        { header: 'Status', value: (r) => r.status },
        { header: 'Payment', value: (r) => r.paymentStatus },
        { header: 'Ticket', value: (r) => r.ticketCode, width: 16 },
        { header: 'Approved on', value: (r) => r.approvedAt, numFmt: dateTime, width: 18 },
        { header: 'Checked in', value: (r) => (r.attended ? 'Yes' : 'No') },
        { header: 'Checked in at', value: (r) => r.checkedInAt, numFmt: dateTime, width: 18 },
        { header: 'Notes', value: (r) => r.notes, width: 40 },
      ]
      return { rows, columns }
    },
  },
  donations: {
    moduleId: 'donations',
    sheet: 'Donations',
    load: async (filters) => {
      const where: Prisma.DonationWhereInput = {
        ...createdRange(filters),
        ...(filters.status && { status: filters.status }),
        ...(filters.payment && { paymentStatus: filters.payment }),
        ...search(filters.q, ['fullName', 'email', 'phone']),
      }
      const rows = await prisma.donation.findMany({ where, orderBy: { createdAt: 'desc' } })
      const columns: ExcelColumn<(typeof rows)[number]>[] = [
        { header: 'Date', value: (r) => r.createdAt, numFmt: dateTime, width: 18 },
        { header: 'Donor', value: (r) => r.fullName, width: 26 },
        { header: 'Email', value: (r) => r.email, width: 28 },
        { header: 'Phone', value: (r) => r.phone, width: 16 },
        { header: 'Amount', value: (r) => r.amount, numFmt: money, width: 14 },
        { header: 'Currency', value: (r) => r.currency },
        { header: 'Method', value: (r) => r.paymentMethod, width: 16 },
        { header: 'Payment status', value: (r) => r.paymentStatus, width: 16 },
        { header: 'Status', value: (r) => r.status },
        { header: 'Prayer intention', value: (r) => r.prayerIntention, width: 48 },
        { header: 'Office notes', value: (r) => r.adminNotes, width: 40 },
      ]
      return { rows, columns }
    },
  },
  'mass-intentions': {
    moduleId: 'mass-intentions',
    sheet: 'Mass intentions',
    load: async (filters) => {
      const where: Prisma.MassIntentionWhereInput = {
        ...createdRange(filters),
        ...(filters.status && { status: filters.status }),
        ...search(filters.q, ['fullName', 'email', 'intentionFor']),
      }
      const rows = await prisma.massIntention.findMany({ where, orderBy: { createdAt: 'desc' } })
      const columns: ExcelColumn<(typeof rows)[number]>[] = [
        { header: 'Received', value: (r) => r.createdAt, numFmt: dateTime, width: 18 },
        { header: 'Requested by', value: (r) => r.fullName, width: 26 },
        { header: 'Email', value: (r) => r.email, width: 28 },
        { header: 'Phone', value: (r) => r.phone, width: 16 },
        { header: 'Type', value: (r) => r.intentionType, width: 18 },
        { header: 'For', value: (r) => r.intentionFor, width: 28 },
        { header: 'Details', value: (r) => r.intentionDetails, width: 48 },
        { header: 'Preferred date', value: (r) => r.preferredDate, numFmt: dateOnly, width: 16 },
        { header: 'Masses', value: (r) => r.numberOfMasses },
        { header: 'Offering', value: (r) => r.donationAmount, width: 14 },
        { header: 'Status', value: (r) => r.status },
        { header: 'Scheduled for', value: (r) => r.scheduledFor, numFmt: dateOnly, width: 16 },
        { header: 'Celebrant', value: (r) => r.celebrant, width: 22 },
        { header: 'Office notes', value: (r) => r.adminNotes, width: 40 },
      ]
      return { rows, columns }
    },
  },
  feedback: {
    moduleId: 'feedback',
    sheet: 'Messages',
    load: async (filters) => {
      const where: Prisma.FeedbackMessageWhereInput = {
        ...createdRange(filters),
        ...(filters.status && { status: filters.status }),
        ...search(filters.q, ['firstName', 'lastName', 'email', 'message']),
      }
      const rows = await prisma.feedbackMessage.findMany({ where, orderBy: { createdAt: 'desc' } })
      const columns: ExcelColumn<(typeof rows)[number]>[] = [
        { header: 'Received', value: (r) => r.createdAt, numFmt: dateTime, width: 18 },
        { header: 'Name', value: (r) => `${r.firstName} ${r.lastName}`.trim(), width: 26 },
        { header: 'Email', value: (r) => r.email, width: 28 },
        { header: 'Phone', value: (r) => r.phoneNumber, width: 16 },
        { header: 'Status', value: (r) => r.status },
        { header: 'Message', value: (r) => r.message, width: 70 },
        { header: 'Office notes', value: (r) => r.adminNotes, width: 40 },
      ]
      return { rows, columns }
    },
  },
  team: {
    moduleId: 'team',
    sheet: 'Admin team',
    load: async () => {
      const rows = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } })
      const columns: ExcelColumn<(typeof rows)[number]>[] = [
        { header: 'Name', value: (r) => r.name, width: 26 },
        { header: 'Email', value: (r) => r.email, width: 30 },
        { header: 'Role', value: (r) => ({ SUPERADMIN: 'Owner', EDITOR: 'Manager', VIEWER: 'Viewer' })[r.role] },
        { header: 'Access', value: (r) => (r.role === 'SUPERADMIN' ? 'Everything' : r.allowedModules.join(', ')), width: 60 },
        { header: 'Active', value: (r) => (r.isActive ? 'Yes' : 'No') },
        { header: 'Last sign-in', value: (r) => r.lastLoginAt, numFmt: dateTime, width: 18 },
        { header: 'Added', value: (r) => r.createdAt, numFmt: dateOnly, width: 14 },
      ]
      return { rows, columns }
    },
  },
  activity: {
    moduleId: 'team',
    sheet: 'Activity log',
    load: async (filters) => {
      const where: Prisma.AuditLogWhereInput = {
        ...createdRange(filters),
        ...(filters.status && { entity: filters.status }),
        ...search(filters.q, ['summary', 'actorName']),
      }
      const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 20000 })
      const columns: ExcelColumn<(typeof rows)[number]>[] = [
        { header: 'When', value: (r) => r.createdAt, numFmt: dateTime, width: 18 },
        { header: 'Who', value: (r) => r.actorName ?? 'System', width: 24 },
        { header: 'Action', value: (r) => r.action, width: 14 },
        { header: 'Area', value: (r) => r.entity, width: 16 },
        { header: 'Summary', value: (r) => r.summary, width: 70 },
        { header: 'IP address', value: (r) => r.ip, width: 16 },
      ]
      return { rows, columns }
    },
  },
}

export async function GET(request: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const { dataset: key } = await params
  const dataset = DATASETS[key]
  if (!dataset) {
    return NextResponse.json({ error: 'Unknown export.' }, { status: 404 })
  }

  const auth = await requireAdminApiAccess(dataset.moduleId)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const filters = parseFilters(new URL(request.url))
    const { rows, columns } = await dataset.load(filters)
    const buffer = await buildWorkbook([{ name: dataset.sheet, columns, rows }], {
      title: `DMRC ${dataset.sheet}`,
      creator: auth.user.name,
    })
    await audit({
      actor: auth.user,
      action: 'exported',
      entity: key,
      summary: `Exported ${rows.length} ${dataset.sheet.toLowerCase()} to Excel`,
      metadata: { filters: Object.fromEntries(new URL(request.url).searchParams) },
      request,
    })
    return excelResponse(buffer, exportFilename(key))
  } catch (error) {
    console.error(`[export:${key}]`, error)
    return NextResponse.json({ error: 'Unable to build the export.' }, { status: 500 })
  }
}
