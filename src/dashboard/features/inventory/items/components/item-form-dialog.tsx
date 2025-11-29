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
  createInventoryItemSchema,
  type CreateInventoryItemInput,
  type CreateInventoryItemFormValues,
} from '@dashboard/features/inventory/items/schema'
import { type InventoryItem } from '@dashboard/hooks/use-inventory-items'
import { type FilterOption } from './items-filters'

type ItemFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  item?: InventoryItem | null
  onOpenChange: (open: boolean) => void
  onCreate: (values: CreateInventoryItemInput) => Promise<void>
  onUpdate: (
    id: string,
    values: Partial<CreateInventoryItemInput>
  ) => Promise<void>
  categoryOptions: FilterOption[]
  departmentOptions: FilterOption[]
  locationOptions: FilterOption[]
  defaultLocationId?: string
  currencySymbol: string
  isSubmitting?: boolean
}

const noneValue = 'none'

export function ItemFormDialog({
  open,
  mode,
  item,
  onOpenChange,
  onCreate,
  onUpdate,
  categoryOptions,
  departmentOptions,
  locationOptions,
  defaultLocationId,
  currencySymbol,
  isSubmitting,
}: ItemFormDialogProps) {
  const initialValues = useMemo<CreateInventoryItemFormValues>(
    () => ({
      name: item?.name ?? '',
      description: item?.description ?? '',
      categoryId: item?.category?.id,
      departmentId: item?.department?.id,
      locationId: item?.location?.id ?? defaultLocationId,
      stockKeepingUnit: item?.stockKeepingUnit ?? '',
      barcode: item?.barcode ?? '',
      tileColor: item?.tileColor ?? '',
      price: item?.price ?? 0,
      stockQuantity: item?.stockQuantity ?? 0,
      isActive: item?.isActive ?? true,
      trackStock: item?.trackStock ?? true,
    }),
    [item, defaultLocationId]
  )

  const form = useForm<CreateInventoryItemFormValues, unknown>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    }
  }, [initialValues, form, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    const parsed = createInventoryItemSchema.parse(values)
    const payload: CreateInventoryItemInput = {
      ...parsed,
      categoryId: parsed.categoryId || undefined,
      departmentId: parsed.departmentId || undefined,
      locationId: parsed.locationId || undefined,
      stockKeepingUnit: values.stockKeepingUnit?.trim() || undefined,
      barcode: values.barcode?.trim() || undefined,
      tileColor: values.tileColor?.trim() || undefined,
      description: values.description?.trim() || undefined,
    }

    if (mode === 'create') {
      await onCreate(payload)
    } else if (item) {
      await onUpdate(item.id, payload)
    }
  })

  const title = mode === 'create' ? 'Create item' : 'Edit item'
  const description =
    mode === 'create'
      ? 'Add products you sell. You can always update details later.'
      : 'Update the product information below.'

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
                    <Input placeholder='Product name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='stockKeepingUnit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder='SKU or code' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='barcode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder='Barcode' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        placeholder={`${currencySymbol}0.00`}
                      value={field.value ?? 0}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={isSubmitting}
                        onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? 0
                            : Number(event.target.value)
                        )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='stockQuantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock quantity</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='1'
                        placeholder='0'
                        value={field.value ?? 0}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={isSubmitting}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ''
                              ? 0
                              : Number(event.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='categoryId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value ?? noneValue}
                      onValueChange={(value) =>
                        field.onChange(value === noneValue ? undefined : value)
                      }
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
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
                          <SelectValue placeholder='Select department' />
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
                        <SelectValue placeholder='Assign to location' />
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
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='space-y-1'>
                      <FormLabel>Active</FormLabel>
                      <p className='text-muted-foreground text-xs'>Inactive items are hidden from checkout flows.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='trackStock'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='space-y-1'>
                      <FormLabel>Track stock</FormLabel>
                      <p className='text-muted-foreground text-xs'>Automatically decrease stock when an order is processed.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

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
                {mode === 'create' ? 'Save item' : 'Update item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

