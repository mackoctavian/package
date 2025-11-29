"use client"

import * as React from 'react'
import { Controller, type ControllerProps, type FieldValues, FormProvider, useFormContext } from 'react-hook-form'

import { cn } from '@/lib/utils'

const Form = FormProvider

const FormField = <TFieldValues extends FieldValues, TName extends string>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  const formContext = useFormContext<TFieldValues>()
  return (
    <Controller
      {...props}
      control={props.control ?? formContext.control}
      render={({ field }) => (
        <FormItemContext.Provider value={{ id: field.name }}>
          {props.render({ field })}
        </FormItemContext.Provider>
      )}
    />
  )
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>({ id: '' })

const useFormField = () => {
  const context = React.useContext(FormItemContext)
  if (!context) {
    throw new Error('useFormField should be used within <FormField>')
  }
  return context
}

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const { id } = useFormField()
  return <div ref={ref} className={cn('space-y-2', className)} aria-labelledby={id} {...props} />
})
FormItem.displayName = 'FormItem'

const FormLabel = React.forwardRef<React.ElementRef<'label'>, React.ComponentPropsWithoutRef<'label'>>(
  ({ className, ...props }, ref) => {
    const { id } = useFormField()
    return (
      <label
        ref={ref}
        className={cn('text-sm font-medium text-slate-700', className)}
        htmlFor={id}
        {...props}
      />
    )
  },
)
FormLabel.displayName = 'FormLabel'

const FormControl = React.forwardRef<
  React.ElementRef<'div'>,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { id } = useFormField()
  return <div ref={ref} className={cn('space-y-1', className)} id={id} {...props} />
})
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-slate-500', className)} {...props} />
  ),
)
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const body = typeof children === 'string' ? children : 'This field is required'
    return (
      <p ref={ref} className={cn('text-xs font-medium text-red-600', className)} {...props}>
        {body}
      </p>
    )
  },
)
FormMessage.displayName = 'FormMessage'

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField }

