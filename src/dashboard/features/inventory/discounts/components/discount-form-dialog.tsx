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
  createInventoryDiscountSchema,
  type CreateInventoryDiscountInput,
  SUGGESTED_DISCOUNT_TYPES,
} from '@dashboard/features/inventory/discounts/schema'
import { type InventoryDiscount } from '@dashboard/hooks/use-inventory-discounts'
import { type FilterOption } from '../../items/components/items-filters'

type DiscountFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  discount: InventoryDiscount | null
  onOpenChange: (open: boolean) => void
  onCreate: (values: CreateInventoryDiscountInput) => Promise<void>
  onUpdate: (
    id: string,
    values: Partial<CreateInventoryDiscountInput>
  ) => Promise<void>
  locationOptions: FilterOption[]
  currencySymbol: string
  isSubmitting?: boolean
}

const noneValue = 'none'

export function DiscountFormDialog({
  open,
  mode,
  discount,
  onOpenChange,
  onCreate,
  onUpdate,
  locationOptions,
  currencySymbol,
  isSubmitting,
}: DiscountFormDialogProps) {
  const initialValues = useMemo<CreateInventoryDiscountInput>(
    () => ({
      name: discount?.name ?? '',
      type: discount?.type ?? '',
      amount: discount?.amount ?? null,
      applyAfterTax: discount?.applyAfterTax ?? false,
      requiresPasscode: discount?.requiresPasscode ?? false,
      isActive: discount?.isActive ?? true,
      locationId: discount?.location?.id,
    }),
    [discount]
  )

  const form = useForm<CreateInventoryDiscountInput, unknown>({
    resolver: zodResolver(createInventoryDiscountSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    }
  }, [form, initialValues, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateInventoryDiscountInput = {
      ...values,
      type: values.type.trim(),
      amount: values.amount ?? null,
      locationId: values.locationId || undefined,
    }

    if (mode === 'create') {
      await onCreate(payload)
    } else if (discount) {
      await onUpdate(discount.id, payload)
    }
  })

  const title = mode === 'create' ? 'Create discount' : 'Edit discount'
  const description =
    mode === 'create'
      ? 'Set up discounts that can be applied during checkout.'
      : 'Update discount settings and availability.'

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
                    <Input placeholder='Discount name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value || noneValue}
                    onValueChange={(value) =>
                      field.onChange(value === noneValue ? '' : value)
                    }
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[{ value: noneValue, label: 'Custom type' }, ...SUGGESTED_DISCOUNT_TYPES.map((type) => ({ value: type, label: type }))].map((option) => (
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
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder={`${currencySymbol}0.00`}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? null
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
              name='applyAfterTax'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                  <div className='space-y-1'>
                    <FormLabel>Apply after tax</FormLabel>
                    <p className='text-muted-foreground text-xs'>Discount is calculated after taxes are applied.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='requiresPasscode'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                  <div className='space-y-1'>
                    <FormLabel>Requires passcode</FormLabel>
                    <p className='text-muted-foreground text-xs'>Only staff with a passcode can apply this discount.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                  </FormControl>
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
                    <p className='text-muted-foreground text-xs'>Inactive discounts are hidden from checkout flows.</p>
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
                {mode === 'create' ? 'Save discount' : 'Update discount'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

