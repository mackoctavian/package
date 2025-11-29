"use client"

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusinessSettings, useUpdateBusinessSettings } from '@dashboard/hooks/use-business-settings'
import {
  businessSettingsFormSchema,
  type BusinessSettingsFormValues,
} from './schema'

const defaultValues: BusinessSettingsFormValues = {
  businessName: '',
  locations: [],
}

function StatusMessage({
  variant,
  children,
}: {
  variant: 'success' | 'error'
  children: string
}) {
  const className =
    variant === 'success'
      ? 'text-sm font-medium text-emerald-600'
      : 'text-sm font-medium text-destructive'
  return <p className={className}>{children}</p>
}

export function BusinessForm() {
  const [status, setStatus] = useState<{ variant: 'success' | 'error'; message: string } | null>(null)
  const { data, isLoading, isError, error } = useBusinessSettings()
  const updateMutation = useUpdateBusinessSettings()

  const form = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(businessSettingsFormSchema),
    defaultValues,
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: 'locations',
  })

  useEffect(() => {
    if (data) {
      form.reset({
        businessName: data.businessName ?? '',
        locations: data.locations.map((location) => ({
          id: location.id,
          name: location.name ?? '',
        })),
      })
    }
  }, [data, form])

  const isDisabled = useMemo(
    () => isLoading || updateMutation.isPending,
    [isLoading, updateMutation.isPending]
  )

  async function onSubmit(values: BusinessSettingsFormValues) {
    setStatus(null)
    try {
      const payload = await updateMutation.mutateAsync(values)
      form.reset({
        businessName: payload.businessName ?? '',
        locations: payload.locations.map((location) => ({
          id: location.id,
          name: location.name ?? '',
        })),
      })
      setStatus({ variant: 'success', message: 'Business information updated successfully.' })
    } catch (err) {
      setStatus({
        variant: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to update business information. Please try again.',
      })
    }
  }

  return (
    <div className='space-y-4'>
      {isError && error instanceof Error ? (
        <StatusMessage variant='error'>{error.message}</StatusMessage>
      ) : null}
      {status ? <StatusMessage variant={status.variant}>{status.message}</StatusMessage> : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='businessName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter business name'
                    autoComplete='organization'
                    disabled={isDisabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='space-y-3'>
            <h4 className='text-sm font-medium text-muted-foreground'>Locations</h4>
            {fields.length === 0 ? (
              isLoading ? (
                <div className='space-y-2'>
                  <Skeleton className='h-10 w-full rounded-md' />
                  <Skeleton className='h-10 w-3/4 rounded-md' />
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No locations found. Locations will appear here once they are created.
                </p>
              )
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className='rounded-lg border border-border p-4'>
                  <input type='hidden' {...form.register(`locations.${index}.id` as const)} />
                  <FormField
                    control={form.control}
                    name={`locations.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Update location name'
                            disabled={isDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))
            )}
          </div>
          <Button type='submit' disabled={isDisabled} className='flex items-center gap-2'>
            {updateMutation.isPending ? <Loader2 className='size-4 animate-spin' /> : null}
            Save changes
          </Button>
        </form>
      </Form>
    </div>
  )
}

