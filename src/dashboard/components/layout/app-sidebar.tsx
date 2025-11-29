"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  Globe2,
  Home,
  Image,
  LayoutDashboard,
  Newspaper,
  Share2,
  Users2,
} from 'lucide-react'

import { useLayout } from '@dashboard/context/layout-provider'
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

const NAV_ITEMS = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'Homepage CMS', href: '/admin/homepage', icon: Home },
  { title: 'Retreats', href: '/admin/retreats', icon: CalendarDays },
  { title: 'Gallery', href: '/admin/gallery', icon: Image },
  { title: 'News', href: '/admin/news', icon: Newspaper },
  { title: 'Events', href: '/admin/events', icon: CalendarDays },
  { title: 'Publications', href: '/admin/publications', icon: BookOpen },
  { title: 'Patrons', href: '/admin/patrons', icon: Users2 },
  { title: 'Ministries', href: '/admin/ministries', icon: Share2 },
  { title: 'About', href: '/admin/about', icon: Globe2 },
]

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <div className='space-y-1'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.3em] text-sidebar-foreground opacity-60'>DMRC</p>
          <p className='text-lg font-semibold text-sidebar-foreground'>Mercy CMS</p>
          <p className='text-xs text-sidebar-foreground opacity-50'>admin@admin.com</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
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

