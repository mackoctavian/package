'use client'

import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
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
import { PasswordInput } from '@/components/password-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import {
  createTeamMemberSchema,
  type CreateTeamMemberInput,
  type TeamMember,
  type UpdateTeamMemberInput,
} from '../data/schema'

const formSchema = createTeamMemberSchema.extend({
  isActive: z.boolean(),
})

type TeamMemberFormValues = z.infer<typeof formSchema>

type LocationOption = {
  label: string
  value: string
}

type TeamMemberFormDialogProps = {
  mode: 'create' | 'edit'
  open: boolean
  member?: TeamMember | null
  onOpenChange: (open: boolean) => void
  onCreate: (values: CreateTeamMemberInput) => Promise<void>
  onUpdate: (id: string, values: UpdateTeamMemberInput) => Promise<void>
  isSubmitting?: boolean
  locationOptions: LocationOption[]
}

export function UsersActionDialog({
  mode,
  open,
  member,
  onOpenChange,
  onCreate,
  onUpdate,
  isSubmitting,
  locationOptions,
}: TeamMemberFormDialogProps) {
  const isEdit = mode === 'edit'

  const initialValues = useMemo<TeamMemberFormValues>(() => {
    if (member) {
      return {
        preferredName: member.preferredName,
        lastName: member.lastName,
        email: member.email ?? undefined,
        mobileNumber: member.mobileNumber ?? undefined,
        role: member.role ?? '',
        pinCode: member.pinCode,
        locationId: member.location?.id,
        departmentId: member.department?.id,
        isActive: member.isActive,
      }
    }

    return {
      preferredName: '',
      lastName: '',
      email: undefined,
      mobileNumber: undefined,
      role: '',
      pinCode: '',
      locationId: undefined,
      departmentId: undefined,
      isActive: true,
    }
  }, [member])

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    }
  }, [form, initialValues, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateTeamMemberInput = {
      preferredName: values.preferredName.trim(),
      lastName: values.lastName.trim(),
      email: values.email?.trim() || undefined,
      mobileNumber: values.mobileNumber?.trim() || undefined,
      role: values.role.trim(),
      pinCode: values.pinCode.trim(),
      locationId: values.locationId || undefined,
      departmentId: values.departmentId || undefined,
      isActive: values.isActive,
    }

    try {
      if (isEdit && member) {
        await onUpdate(member.id, payload)
      } else {
        await onCreate(payload)
      }
      onOpenChange(false)
    } catch (error) {
      console.error('[team-member][form]', error)
    }
  })

  const title = isEdit ? 'Edit team member' : 'Add team member'
  const description = isEdit
    ? 'Update the details for this team member.'
    : 'Create a new team member with the details below.'

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset(initialValues)
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='preferredName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred name</FormLabel>
                    <FormControl>
                      <Input placeholder='John' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder='Doe' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='john@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='mobileNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input type='tel' placeholder='+255 700 000 000' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder='Manager' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='pinCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN code</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder='••••' autoComplete='off' {...field} />
                    </FormControl>
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
                  <FormLabel>Primary location</FormLabel>
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a location' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>No location</SelectItem>
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
                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                  <div>
                    <FormLabel className='text-base'>Status</FormLabel>
                    <p className='text-muted-foreground text-sm'>Turn off to deactivate this team member.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

