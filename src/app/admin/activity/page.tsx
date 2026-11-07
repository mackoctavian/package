import type { Metadata } from 'next'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'

import { EmptyState, ExportButton, PageBody, PageHeader, Panel } from '@/app/components/Admin/shell/primitives'
import { Badge } from '@/app/components/ui/badge'
import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/admin/safe'
import { requireAdminPageAccess } from '@/lib/auth/admin-session'

export const metadata: Metadata = { title: 'Activity log' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const AREAS: Record<string, string> = {
  session: 'Sign-in',
  admin_user: 'Team',
  admin_invite: 'Invitations',
  bookings: 'Bookings export',
  donations: 'Donations export',
  'mass-intentions': 'Intentions export',
  feedback: 'Messages export',
  team: 'Team export',
  activity: 'Activity export',
}

const actionTone = (action: string) =>
  ['deleted', 'deactivated', 'revoked'].includes(action)
    ? 'bg-rose-50 text-rose-700'
    : ['created', 'invited', 'joined', 'approved', 'reactivated'].includes(action)
      ? 'bg-emerald-50 text-emerald-700'
      : action === 'exported'
        ? 'bg-gold-100 text-gold-700'
        : 'bg-navy-50 text-navy-700'

const formatWhen = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dar_es_Salaam' }).format(date)

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPageAccess('team')
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const q = params.q?.trim() || undefined
  const area = params.area && params.area !== 'all' ? params.area : undefined

  const where: Prisma.AuditLogWhereInput = {
    ...(area && { entity: area }),
    ...(q && { OR: [{ summary: { contains: q, mode: 'insensitive' } }, { actorName: { contains: q, mode: 'insensitive' } }] }),
  }

  const [entries, total] = await Promise.all([
    safeQuery(() => prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }), [], 'audit'),
    safeQuery(() => prisma.auditLog.count({ where }), 0),
  ])
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const link = (next: number) => {
    const search = new URLSearchParams()
    if (q) search.set('q', q)
    if (area) search.set('area', area)
    if (next > 1) search.set('page', String(next))
    return `/admin/activity${search.size ? `?${search}` : ''}`
  }

  return (
    <PageBody>
      <PageHeader
        eyebrow='Organisation'
        title='Activity log'
        description='A record of sign-ins, team changes, exports and other important actions in the admin panel.'
        actions={<ExportButton dataset='activity' filters={{ q, status: area }} />}
      />

      <form className='flex flex-col gap-3 sm:flex-row' action='/admin/activity'>
        <input
          name='q'
          defaultValue={q}
          placeholder='Search by person or description'
          aria-label='Search activity'
          className='h-10 flex-1 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
        />
        <select name='area' defaultValue={area ?? 'all'} aria-label='Area' className='h-10 rounded-lg border border-input bg-white px-3 text-sm'>
          <option value='all'>All areas</option>
          {Object.entries(AREAS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type='submit' className='h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90'>
          Filter
        </button>
      </form>

      <Panel bodyClassName='p-0'>
        {entries.length ? (
          <ol className='divide-y divide-border'>
            {entries.map((entry) => (
              <li key={entry.id} className='flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4'>
                <span className='w-44 shrink-0 text-xs tabular-nums text-muted-foreground'>{formatWhen(entry.createdAt)}</span>
                <Badge className={`w-24 shrink-0 justify-center border-transparent capitalize ${actionTone(entry.action)}`}>{entry.action.replace(/_/g, ' ')}</Badge>
                <p className='min-w-0 flex-1 text-sm text-navy-950'>{entry.summary}</p>
                <span className='shrink-0 text-xs text-muted-foreground'>{entry.actorName ?? 'System'}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={Activity} title='No activity found' description={q || area ? 'Try clearing the filters.' : 'Actions in the admin panel will appear here.'} />
        )}
      </Panel>

      {pages > 1 && (
        <nav aria-label='Pagination' className='flex items-center justify-between text-sm'>
          <p className='text-muted-foreground'>
            Page {page} of {pages} · {total.toLocaleString()} entries
          </p>
          <div className='flex gap-2'>
            {page > 1 && (
              <Link href={link(page - 1)} className='inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 hover:bg-muted'>
                <ChevronLeft className='h-4 w-4' /> Newer
              </Link>
            )}
            {page < pages && (
              <Link href={link(page + 1)} className='inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 hover:bg-muted'>
                Older <ChevronRight className='h-4 w-4' />
              </Link>
            )}
          </div>
        </nav>
      )}
    </PageBody>
  )
}
