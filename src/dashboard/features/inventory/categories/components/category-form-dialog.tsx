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
  createInventoryCategorySchema,
  type CreateInventoryCategoryInput,
} from '@dashboard/features/inventory/categories/schema'
import { type InventoryCategory } from '@dashboard/hooks/use-inventory-categories'
import { type FilterOption } from '../../items/components/items-filters'

type CategoryFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  category: InventoryCategory | null
  onOpenChange: (open: boolean) => void
  onCreate: (values: CreateInventoryCategoryInput) => Promise<void>
  onUpdate: (
    id: string,
    values: Partial<CreateInventoryCategoryInput>
  ) => Promise<void>
  categoryOptions: FilterOption[]
  departmentOptions: FilterOption[]
  locationOptions: FilterOption[]
  isSubmitting?: boolean
}

const noneValue = 'none'

export function CategoryFormDialog({
  open,
  mode,
  category,
  onOpenChange,
  onCreate,
  onUpdate,
  categoryOptions,
  departmentOptions,
  locationOptions,
  isSubmitting,
}: CategoryFormDialogProps) {
  const parentOptions = useMemo(() => {
    if (!category) return categoryOptions
    return categoryOptions.filter((option) => option.value !== category.id)
  }, [categoryOptions, category])

  const initialValues = useMemo<CreateInventoryCategoryInput>(
    () => ({
      name: category?.name ?? '',
      description: category?.description ?? '',
      parentId: category?.parent?.id,
      departmentId: category?.department?.id,
      locationId: category?.location?.id,
      tileColor: category?.tileColor ?? '',
      tileLabel: category?.tileLabel ?? '',
      iconName: category?.iconName ?? '',
      imageUrl: category?.imageUrl ?? '',
      isActive: category?.isActive ?? true,
    }),
    [category]
  )

  const form = useForm<CreateInventoryCategoryInput>({
    resolver: zodResolver(createInventoryCategorySchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    }
  }, [form, initialValues, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateInventoryCategoryInput = {
      ...values,
      parentId: values.parentId || undefined,
      departmentId: values.departmentId || undefined,
      locationId: values.locationId || undefined,
      description: values.description?.trim() || undefined,
      tileColor: values.tileColor?.trim() || undefined,
      tileLabel: values.tileLabel?.trim() || undefined,
      iconName: values.iconName?.trim() || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
    }

    if (mode === 'create') {
      await onCreate(payload)
    } else if (category) {
      await onUpdate(category.id, payload)
    }
  })

  const title = mode === 'create' ? 'Create category' : 'Edit category'
  const description =
    mode === 'create'
      ? 'Organize your products into categories to keep menus tidy.'
      : 'Update category details and hierarchy.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
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
                    <Input placeholder='Category name' {...field} />
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

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='parentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent category</FormLabel>
                    <Select
                      value={field.value ?? noneValue}
                      onValueChange={(value) =>
                        field.onChange(value === noneValue ? undefined : value)
                      }
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='No parent' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parentOptions.map((option) => (
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
                name='departmentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value ?? noneValue}
                      onValueChange={(value) =>
                        field.onChange(value === noneValue ? undefined : value)
                      }
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='No department' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentOptions.map((option) => (
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
            </div>

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

            <div className='grid gap-4 sm:grid-cols-3'>
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
                name='tileLabel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tile label</FormLabel>
                    <FormControl>
                      <Input placeholder='Optional' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='iconName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. coffee' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='imageUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder='https://…' {...field} />
                  </FormControl>
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
                    <p className='text-muted-foreground text-xs'>Inactive categories are hidden from menus.</p>
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
                {mode === 'create' ? 'Save category' : 'Update category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

