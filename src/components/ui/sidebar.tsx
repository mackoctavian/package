"use client"

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Menu } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/button'

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  state: 'expanded' | 'collapsed'
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

type SidebarProviderProps = {
  defaultOpen?: boolean
  children: React.ReactNode
}

export function SidebarProvider({ defaultOpen = true, children }: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)')
    const handler = () => setIsMobile(media.matches)
    handler()
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggleSidebar: () => setOpen((prev) => !prev),
      setOpenMobile: setOpen,
      isMobile,
      state: open ? 'expanded' : 'collapsed',
    }),
    [open, isMobile],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'icon' | 'offcanvas' | 'none'
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant = 'sidebar', collapsible = 'icon', ...props }, ref) => {
    const { open } = useSidebar()
    const widthClass = collapsible === 'icon' && !open ? 'lg:w-16' : 'lg:w-64'

    return (
      <aside
        ref={ref}
        data-variant={variant}
        data-state={open ? 'open' : 'closed'}
        data-collapsible={collapsible}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[0_25px_60px_-40px_rgba(24,39,75,0.35)] transition-all duration-300',
          'translate-x-0 lg:translate-x-0',
          !open && 'max-lg:-translate-x-full',
          widthClass,
          className,
        )}
        {...props}
      />
    )
  },
)
Sidebar.displayName = 'Sidebar'

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, children, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      ref={ref}
      variant='outline'
      size='icon'
      className={cn('h-9 w-9', className)}
      onClick={(event) => {
        props.onClick?.(event)
        toggleSidebar()
      }}
      {...props}>
      {children ?? <Menu className='h-4 w-4' />}
      <span className='sr-only'>Toggle sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = 'SidebarTrigger'

export const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { open } = useSidebar()
    return (
      <div
        ref={ref}
        className={cn(
          'box-border min-h-screen w-full bg-background text-foreground transition-[padding] duration-300 px-4 py-6 sm:px-6 lg:py-10 lg:pr-12',
          open ? 'lg:pl-[calc(16rem+3rem)]' : 'lg:pl-[calc(4rem+2.5rem)]',
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarInset.displayName = 'SidebarInset'

const Section = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-4 py-4', className)} {...props} />
  ),
)
Section.displayName = 'Section'

export const SidebarHeader = Section
export const SidebarFooter = Section

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 text-sm text-sidebar-foreground/75',
        className,
      )}
      {...props}
    />
  ),
)
SidebarContent.displayName = 'SidebarContent'

export const SidebarRail = () => null

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('space-y-1', className)} {...props} />
  ),
)
SidebarMenu.displayName = 'SidebarMenu'

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn('list-none', className)} {...props} />,
)
SidebarMenuItem.displayName = 'SidebarMenuItem'

type SidebarMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  isActive?: boolean
  size?: 'default' | 'lg'
  tooltip?: string
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, asChild, isActive, size = 'default', tooltip, ...props }, ref) => {
    const { state } = useSidebar()
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        title={tooltip}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-primary text-primary-foreground shadow-sm',
          size === 'lg' && 'h-11 text-base',
          state === 'collapsed' && 'justify-center lg:px-0',
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

export const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('ml-4 border-l border-sidebar-border/60 pl-4', className)} {...props} />
  ),
)
SidebarMenuSub.displayName = 'SidebarMenuSub'

export const SidebarMenuSubItem = SidebarMenuItem

export const SidebarMenuSubButton = SidebarMenuButton

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props} />
  ),
)
SidebarGroup.displayName = 'SidebarGroup'

export const SidebarGroupLabel = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-sidebar-foreground/50',
        className,
      )}
      {...props}
    />
  ),
)
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

