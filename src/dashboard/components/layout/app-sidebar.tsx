"use client"

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  Globe2,
  Home,
  Image,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Share2,
  ShieldCheck,
  Users2,
} from 'lucide-react'

import { useLayout } from '@dashboard/context/layout-provider'
import { useAdminUser } from '@dashboard/context/admin-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/app/components/ui/badge'
import type { AdminModuleId } from '@/lib/auth/admin-permissions'
import { userHasModuleAccess } from '@/lib/auth/admin-shared'

const NAV_ITEMS: Array<{
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
  moduleId: AdminModuleId
}> = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard, moduleId: 'overview' },
  { title: 'Homepage CMS', href: '/admin/homepage', icon: Home, moduleId: 'homepage' },
  { title: 'Retreats', href: '/admin/retreats', icon: CalendarDays, moduleId: 'retreats' },
  { title: 'Gallery', href: '/admin/gallery', icon: Image, moduleId: 'gallery' },
  { title: 'News', href: '/admin/news', icon: Newspaper, moduleId: 'news' },
  { title: 'Events', href: '/admin/events', icon: CalendarDays, moduleId: 'events' },
  { title: 'Publications', href: '/admin/publications', icon: BookOpen, moduleId: 'publications' },
  { title: 'Articles', href: '/admin/articles', icon: ShieldCheck, moduleId: 'articles' },
  { title: 'Feedback', href: '/admin/feedback', icon: MessageSquare, moduleId: 'feedback' },
  { title: 'Patrons', href: '/admin/patrons', icon: Users2, moduleId: 'patrons' },
  { title: 'Ministries', href: '/admin/ministries', icon: Share2, moduleId: 'ministries' },
  { title: 'About', href: '/admin/about', icon: Globe2, moduleId: 'about' },
  { title: 'Admin Team', href: '/admin/team', icon: Users2, moduleId: 'team' },
]

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const pathname = usePathname()
  const { state } = useSidebar()
  const currentUser = useAdminUser()

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <div className='space-y-1'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.3em] text-sidebar-foreground opacity-60'>DMRC</p>
          <p className='text-lg font-semibold text-sidebar-foreground'>Mercy CMS</p>
          <p className='text-xs text-sidebar-foreground opacity-50'>{currentUser.email}</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS.filter((item) => userHasModuleAccess(currentUser, item.moduleId)).map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.href} className='flex items-center gap-3 text-inherit'>
                    <item.icon className='h-4 w-4 text-current' />
                    {state === 'expanded' && <span className='text-sm font-medium text-inherit'>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className='rounded-xl border border-sidebar-border/50 bg-sidebar-accent bg-opacity-30 px-4 py-3 text-xs text-sidebar-foreground backdrop-blur'>
          <p className='text-sm font-semibold text-sidebar-foreground'>Divine Mercy Retreat Center</p>
          <p className='text-xs text-sidebar-foreground opacity-60'>Secure admin workspace</p>
          <Badge variant='secondary' className='mt-2'>
            Production
          </Badge>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

