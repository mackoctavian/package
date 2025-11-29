"use client"

import { useMemo } from 'react'
import { getCookie } from '@dashboard/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@dashboard/context/layout-provider'
import { SearchProvider } from '@dashboard/context/search-provider'
import { DirectionProvider } from '@dashboard/context/direction-provider'
import { ThemeProvider } from '@dashboard/context/theme-provider'
import { FontProvider } from '@dashboard/context/font-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@dashboard/components/layout/app-sidebar'
import { SkipToMain } from '@dashboard/components/skip-to-main'
import { NavigationProgress } from '@dashboard/components/navigation-progress'

type DashboardLayoutClientProps = {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const defaultOpen = useMemo(() => getCookie('sidebar_state') !== 'false', [])

  return (
    <DirectionProvider>
      <ThemeProvider>
        <FontProvider>
          <SearchProvider>
            <LayoutProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <NavigationProgress />
                <SkipToMain />
                <AppSidebar />
                <SidebarInset
                  className={cn(
                    '@container/content',
                    'has-[[data-layout=fixed]]:h-svh',
                    'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
                  )}
                >
                  {children}
                </SidebarInset>
              </SidebarProvider>
            </LayoutProvider>
          </SearchProvider>
        </FontProvider>
      </ThemeProvider>
    </DirectionProvider>
  )
}

