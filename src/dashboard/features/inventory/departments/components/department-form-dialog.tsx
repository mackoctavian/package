"use client"

import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, Plus, Save } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  createInventoryDepartmentSchema,
  type CreateInventoryDepartmentInput,
} from '@dashboard/features/inventory/departments/schema'
import { type InventoryDepartment } from '@dashboard/hooks/use-inventory-departments'
import { type FilterOption } from '../../items/components/items-filters'

type DepartmentFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  department: InventoryDepartment | null
  onOpenChange: (open: boolean) => void
  onCreate: (values: CreateInventoryDepartmentInput) => Promise<void>
  onUpdate: (
    id: string,
    values: Partial<CreateInventoryDepartmentInput>
  ) => Promise<void>
  locationOptions: FilterOption[]
  isSubmitting?: boolean
}

const noneValue = 'none'

export function DepartmentFormDialog({
  open,
  mode,
  department,
  onOpenChange,
  onCreate,
  onUpdate,
  locationOptions,
  isSubmitting,
}: DepartmentFormDialogProps) {
  const initialValues = useMemo<CreateInventoryDepartmentInput>(
    () => ({
      name: department?.name ?? '',
      description: department?.description ?? '',
      tileColor: department?.tileColor ?? '',
      locationId: department?.location?.id,
      isActive: department?.isActive ?? true,
    }),
    [department]
  )

  const form = useForm<CreateInventoryDepartmentInput>({
    resolver: zodResolver(createInventoryDepartmentSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    }
  }, [form, initialValues, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateInventoryDepartmentInput = {
      ...values,
      locationId: values.locationId || undefined,
      description: values.description?.trim() || undefined,
      tileColor: values.tileColor?.trim() || undefined,
    }

    if (mode === 'create') {
      await onCreate(payload)
    } else if (department) {
      await onUpdate(department.id, payload)
    }
  })

  const title = mode === 'create' ? 'Create department' : 'Edit department'
  const description =
    mode === 'create'
      ? 'Group related categories and items to improve reporting.'
      : 'Update department details below.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Department name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder='Optional description' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='tileColor'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tile color</FormLabel>
                  <FormControl>
                    <Input placeholder='#F5F5F5' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='locationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    value={field.value ?? noneValue}
                    onValueChange={(value) =>
                      field.onChange(value === noneValue ? undefined : value)
                    }
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='All locations' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                  <div className='space-y-1'>
                    <FormLabel>Active</FormLabel>
                    <p className='text-muted-foreground text-xs'>Inactive departments are hidden from selection menus.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className='pt-2'>
              <Button type='button' variant='ghost' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting} className='gap-2'>
                {isSubmitting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : mode === 'create' ? (
                  <Plus className='h-4 w-4' />
                ) : (
                  <Save className='h-4 w-4' />
                )}
                {mode === 'create' ? 'Save department' : 'Update department'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

