"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronsUpDown, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { locationFormSchema, type LocationFormValues } from '@dashboard/features/locations/schema'
import {
  SIDEBAR_INFO_QUERY_KEY,
  type SidebarLocation,
} from '@dashboard/hooks/use-sidebar-info'
import { useSelectedLocationStore } from '@dashboard/store/selected-location'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

async function createLocation(data: LocationFormValues) {
  const response = await fetch('/api/dashboard/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: 'Failed to create location' }))
    throw new Error(error ?? 'Failed to create location')
  }

  return (await response.json()) as SidebarLocation
}

type LocationSwitcherProps = {
  businessName?: string | null
  locations: SidebarLocation[]
  isLoading?: boolean
}

export function LocationSwitcher({ businessName, locations, isLoading }: LocationSwitcherProps) {
  const { isMobile } = useSidebar()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const selectedLocationId = useSelectedLocationStore((state) => state.selectedLocationId)
  const setSelectedLocationId = useSelectedLocationStore((state) => state.setSelectedLocationId)

  const defaultLocation = useMemo(() => {
    if (!locations.length) return undefined
    return locations.find((location) => location.isDefault) ?? locations[0]
  }, [locations])

  useEffect(() => {
    if (!locations.length) {
      if (selectedLocationId !== undefined) {
        setSelectedLocationId(undefined)
      }
      return
    }

    if (!defaultLocation) {
      return
    }

    const exists = selectedLocationId
      ? locations.some((location) => location.id === selectedLocationId)
      : false

    if (!selectedLocationId || !exists) {
      setSelectedLocationId(defaultLocation.id)
    }
  }, [locations, defaultLocation, selectedLocationId, setSelectedLocationId])

  const activeLocation = useMemo(() => {
    if (!locations.length) return undefined
    if (selectedLocationId) {
      return locations.find((location) => location.id === selectedLocationId) ?? defaultLocation
    }
    return defaultLocation
  }, [locations, selectedLocationId, defaultLocation])

  const title = businessName?.trim() || 'Your business'

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-3 w-36" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <MapPin className="size-4" />
              </div>
              <div className="flex flex-1 items-center">
                <span className="truncate text-sm font-semibold capitalize">
                  {title}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Locations
            </DropdownMenuLabel>
            {locations.length ? (
              locations.map((location) => (
                <DropdownMenuItem
                  key={location.id}
                  className="gap-2 p-2"
                  onClick={() => setSelectedLocationId(location.id)}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <MapPin className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium leading-tight">{location.nickname}</span>
                    <span className="text-muted-foreground text-xs leading-tight">
                      {location.city ?? location.businessName}
                    </span>
                  </div>
                  {location.isDefault && (
                    <span className="text-xs font-medium text-primary">Default</span>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="p-2 text-muted-foreground">
                No locations yet
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <AddLocationDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onLocationCreated={(location) => setSelectedLocationId(location.id)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

type AddLocationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLocationCreated: (location: SidebarLocation) => void
}

function AddLocationDialog({ open, onOpenChange, onLocationCreated }: AddLocationDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: '',
      businessName: '',
      nickname: '',
      city: '',
      country: '',
      email: '',
      isDefault: false,
    },
  })

  const mutation = useMutation({
    mutationFn: createLocation,
    onSuccess: (createdLocation: SidebarLocation) => {
      toast.success('Location created')
      form.reset()
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: SIDEBAR_INFO_QUERY_KEY })
      onLocationCreated(createdLocation)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (values: LocationFormValues) => {
    mutation.mutate({
      ...values,
      city: values.city?.trim() ? values.city.trim() : undefined,
      country: values.country?.trim() ? values.country.trim() : undefined,
      email: values.email?.trim() ? values.email.trim() : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem className="gap-2 p-2" onSelect={(event) => event.preventDefault()}>
          <div className="bg-background flex size-6 items-center justify-center rounded-md border">
            <Plus className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">Add location</div>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new location</DialogTitle>
          <DialogDescription>
            Provide the basic information for this location. You can update additional details later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Downtown Branch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormDescription>This appears in the sidebar.</FormDescription>
                  <FormControl>
                    <Input placeholder="HQ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Dar es Salaam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="TZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-start gap-2 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make default location</FormLabel>
                    <FormDescription>
                      The default location is highlighted in the sidebar and used as the primary location.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save location'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
