import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BookOpen,
  CalendarDays,
  FileText,
  HandCoins,
  HeartHandshake,
  Home,
  Images,
  Inbox,
  Languages,
  Info,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users2,
  CalendarRange,
  ScanLine,
  Ticket,
  Contact,
  CalendarOff,
} from 'lucide-react'

import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { type AdminUserPayload, userHasModuleAccess } from '@/lib/auth/admin-shared'

export type AdminNavItem = {
  title: string
  href: string
  icon: LucideIcon
  moduleId: AdminModuleId
  /** Also shown to people with access to any of these areas. */
  orModules?: AdminModuleId[]
  /** Extra words that find this page in the command palette. */
  keywords?: string
}

export type AdminNavGroup = { title: string; items: AdminNavItem[] }

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: 'General',
    items: [{ title: 'Dashboard', href: '/admin', icon: LayoutDashboard, moduleId: 'overview', keywords: 'home overview' }],
  },
  {
    title: 'Retreats',
    items: [
      { title: 'Retreats', href: '/admin/retreats', icon: CalendarDays, moduleId: 'retreats', keywords: 'sessions capacity' },
      { title: 'Bookings', href: '/admin/bookings', icon: Ticket, moduleId: 'retreats', keywords: 'approve guests payments' },
      { title: 'Check-in desk', href: '/admin/check-in', icon: ScanLine, moduleId: 'check-in', orModules: ['retreats'], keywords: 'scan qr tickets attendance' },
    ],
  },
  {
    title: 'Giving',
    items: [
      { title: 'Donations', href: '/admin/donations', icon: HandCoins, moduleId: 'donations', keywords: 'gifts money' },
      { title: 'Mass intentions', href: '/admin/mass-intentions', icon: HeartHandshake, moduleId: 'mass-intentions', keywords: 'prayer' },
    ],
  },
  {
    title: 'Inbox',
    items: [{ title: 'Messages', href: '/admin/feedback', icon: Inbox, moduleId: 'feedback', keywords: 'contact feedback' }],
  },
  {
    title: 'Website',
    items: [
      { title: 'Homepage', href: '/admin/homepage', icon: Home, moduleId: 'homepage', keywords: 'hero slides quick links testimonials' },
      { title: 'News', href: '/admin/news', icon: Newspaper, moduleId: 'news' },
      { title: 'Events', href: '/admin/events', icon: CalendarRange, moduleId: 'events' },
      { title: 'Articles', href: '/admin/articles', icon: Sparkles, moduleId: 'articles' },
      { title: 'Publications', href: '/admin/publications', icon: BookOpen, moduleId: 'publications', keywords: 'books bookshop' },
      { title: 'Gallery', href: '/admin/gallery', icon: Images, moduleId: 'gallery', keywords: 'photos videos' },
      { title: 'Ministries', href: '/admin/ministries', icon: FileText, moduleId: 'ministries' },
      { title: 'Patrons', href: '/admin/patrons', icon: ShieldCheck, moduleId: 'patrons' },
      { title: 'About page', href: '/admin/about', icon: Info, moduleId: 'about' },
      { title: 'Translations', href: '/admin/translations', icon: Languages, moduleId: 'translations', keywords: 'swahili kiswahili language translate interface mobile app' },
    ],
  },
  {
    title: 'Organisation',
    items: [
      { title: 'Members', href: '/admin/members', icon: Contact, moduleId: 'members', keywords: 'priests sisters staff volunteers directory people' },
      { title: 'Leave', href: '/admin/leave', icon: CalendarOff, moduleId: 'leave', keywords: 'leave requests away holiday absence' },
      { title: 'Team & access', href: '/admin/team', icon: Users2, moduleId: 'team', keywords: 'invite users roles permissions' },
      { title: 'Activity log', href: '/admin/activity', icon: Activity, moduleId: 'team', keywords: 'audit history' },
    ],
  },
]

export const findNavItem = (pathname: string) => {
  let match: AdminNavItem | undefined
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      const hit = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(`${item.href}/`)
      if (hit && (!match || item.href.length > match.href.length)) match = item
    }
  }
  return match
}

export const canSeeNavItem = (user: AdminUserPayload, item: AdminNavItem) =>
  [item.moduleId, ...(item.orModules ?? [])].some((moduleId) => userHasModuleAccess(user, moduleId))
