'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccountSettings, useUpdateAccountSettings } from '@dashboard/hooks/use-account-settings'
import { useUpdateAccountPassword } from '@dashboard/hooks/use-update-account-password'
import { type AccountSettingsUpdateValues } from './schema'

type ModalKey = 'name' | 'email' | 'phone' | 'password' | 'passcode' | 'pin' | null

type StatusState = { variant: 'success' | 'error'; message: string } | null

function StatusMessage({ variant, children }: { variant: 'success' | 'error'; children: string }) {
  const className =
    variant === 'success'
      ? 'rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700'
      : 'rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive'
  return <p className={className}>{children}</p>
}

function AccountSettingsSkeleton() {
  return (
    <div className='space-y-6'>
      {[0, 1].map((section) => (
        <div key={section} className='overflow-hidden rounded-xl border bg-background'>
          <div className='px-6 py-5'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='mt-2 h-4 w-48' />
          </div>
          <Separator />
          <div className='divide-y'>
            {[0, 1, 2].map((row) => (
              <div key={row} className='flex items-center justify-between px-6 py-4'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-28' />
                  <Skeleton className='h-4 w-44' />
                </div>
                <Skeleton className='h-4 w-12' />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

type AccountDetailRowProps = {
  label: string
  value?: ReactNode
  fallback?: string
  description?: string
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  badgeText?: string
}

function AccountDetailRow({
  label,
  value,
  fallback = 'Not set',
  description,
  actionLabel,
  onAction,
  disabled,
  badgeText,
}: AccountDetailRowProps) {
  const valueContent =
    value !== undefined ? (
      <div className='text-sm text-foreground'>{value}</div>
    ) : (
      <div className='text-sm text-muted-foreground'>{fallback}</div>
    )

  return (
    <div className='flex flex-wrap items-start justify-between gap-4 px-6 py-4'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium'>{label}</p>
          {badgeText ? (
            <Badge variant='secondary' className='flex items-center gap-1'>
              <CheckCircle2 className='size-3 text-emerald-500' />
              {badgeText}
            </Badge>
          ) : null}
        </div>
        {valueContent}
        {description ? (
          <p className='text-xs text-muted-foreground'>{description}</p>
        ) : null}
      </div>
      <Button
        type='button'
        variant='link'
        size='sm'
        className='h-auto px-0 text-sm font-medium'
        onClick={onAction}
        disabled={disabled}
      >
        {actionLabel}
      </Button>
    </div>
  )
}

const nameSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(100, 'First name must not exceed 100 characters.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(100, 'Last name must not exceed 100 characters.'),
})

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please provide a valid email address.')
    .max(254, 'Email must not exceed 254 characters.'),
})

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(32, 'Phone number must not exceed 32 characters.')
    .superRefine((value, ctx) => {
      if (value !== '' && value.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone number must be at least 6 characters.',
        })
      }
    }),
})

const passcodeSchema = z.object({
  passcode: z
    .string()
    .trim()
    .min(4, 'Passcode must be at least 4 characters.')
    .max(12, 'Passcode must not exceed 12 characters.'),
})

const pinSchema = z.object({
  pin: z
    .string()
    .trim()
    .min(4, 'PIN must be at least 4 characters.')
    .max(12, 'PIN must not exceed 12 characters.'),
})

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, 'Current password must be at least 6 characters.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(72, 'New password must not exceed 72 characters.'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters.')
      .max(72, 'Confirm password must not exceed 72 characters.'),
  })
  .refine(
    (value) => value.newPassword === value.confirmPassword,
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    },
  )
  .refine(
    (value) => value.newPassword !== value.currentPassword,
    {
      message: 'New password must be different from the current password.',
      path: ['newPassword'],
    },
  )

type NameFormValues = z.infer<typeof nameSchema>
type EmailFormValues = z.infer<typeof emailSchema>
type PhoneFormValues = z.infer<typeof phoneSchema>
type PasscodeFormValues = z.infer<typeof passcodeSchema>
type PinFormValues = z.infer<typeof pinSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

type DialogBaseProps = {
  open: boolean
  loading: boolean
  onOpenChange: (open: boolean) => void
}

type NameDialogProps = DialogBaseProps & {
  defaultValues: NameFormValues
  onSubmit: (values: NameFormValues) => Promise<void>
}

function NameDialog({ open, loading, onOpenChange, defaultValues, onSubmit }: NameDialogProps) {
  const form = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change your name</DialogTitle>
          <DialogDescription>Update the name that appears on your profile.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input autoComplete='given-name' disabled={loading} {...field} />
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
                    <Input autoComplete='family-name' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading} className='flex items-center gap-2'>
                {loading ? <Loader2 className='size-4 animate-spin' /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type EmailDialogProps = DialogBaseProps & {
  defaultValues: EmailFormValues
  onSubmit: (values: EmailFormValues) => Promise<void>
}

function EmailDialog({ open, loading, onOpenChange, defaultValues, onSubmit }: EmailDialogProps) {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update email address</DialogTitle>
          <DialogDescription>We use this email to send receipts and important updates.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type='email' autoComplete='email' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading} className='flex items-center gap-2'>
                {loading ? <Loader2 className='size-4 animate-spin' /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type PhoneDialogProps = DialogBaseProps & {
  defaultValues: PhoneFormValues
  onSubmit: (values: PhoneFormValues) => Promise<void>
}

function PhoneDialog({ open, loading, onOpenChange, defaultValues, onSubmit }: PhoneDialogProps) {
  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update phone number</DialogTitle>
          <DialogDescription>
            Add a phone number to receive SMS notifications. Leave blank to remove your phone number.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input autoComplete='tel' placeholder='+1 555 555 1234' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading} className='flex items-center gap-2'>
                {loading ? <Loader2 className='size-4 animate-spin' /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type PasscodeDialogProps = DialogBaseProps & {
  defaultValues: PasscodeFormValues
  onSubmit: (values: PasscodeFormValues) => Promise<void>
}

function PasscodeDialog({
  open,
  loading,
  onOpenChange,
  defaultValues,
  onSubmit,
}: PasscodeDialogProps) {
  const form = useForm<PasscodeFormValues>({
    resolver: zodResolver(passcodeSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update personal POS passcode</DialogTitle>
          <DialogDescription>
            This passcode is used to log in and clock in on the POS. Keep it secret.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='passcode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passcode</FormLabel>
                  <FormControl>
                    <Input type='password' autoComplete='off' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading} className='flex items-center gap-2'>
                {loading ? <Loader2 className='size-4 animate-spin' /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type PinDialogProps = DialogBaseProps & {
  defaultValues: PinFormValues
  onSubmit: (values: PinFormValues) => Promise<void>
}

function PinDialog({ open, loading, onOpenChange, defaultValues, onSubmit }: PinDialogProps) {
  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update security PIN</DialogTitle>
          <DialogDescription>
            Your PIN is required for sensitive actions in the dashboard.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='pin'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN</FormLabel>
                  <FormControl>
                    <Input type='password' autoComplete='one-time-code' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading} className='flex items-center gap-2'>
                {loading ? <Loader2 className='size-4 animate-spin' /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type PasswordDialogProps = DialogBaseProps & {
  onSubmit: (values: PasswordFormValues) => Promise<void>
}

function PasswordDialog({ open, loading, onOpenChange, onSubmit }: PasswordDialogProps) {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [open, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Set a new password for logging into your account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input type='password' autoComplete='current-password' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type='password' autoComplete='new-password' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type='password' autoComplete='new-password' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading} className='flex items-center gap-2'>
                {loading ? <Loader2 className='size-4 animate-spin' /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function AccountForm() {
  const [status, setStatus] = useState<StatusState>(null)
  const [modal, setModal] = useState<ModalKey>(null)
  const { data, isLoading, isError, error } = useAccountSettings()
  const updateMutation = useUpdateAccountSettings()
  const passwordMutation = useUpdateAccountPassword()

  const isMutating = updateMutation.isPending || passwordMutation.isPending
  const queryError = isError && error instanceof Error ? error.message : null

  if (!data && isLoading) {
    return <AccountSettingsSkeleton />
  }

  if (!data && queryError) {
    return <StatusMessage variant='error'>{queryError}</StatusMessage>
  }

  const normalized = {
    firstName: data?.firstName ?? '',
    lastName: data?.lastName ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
    passcode: data?.passcode ?? '',
    pin: data?.pin ?? '',
  }

  const fullName = [normalized.firstName, normalized.lastName].filter(Boolean).join(' ')
  const hasEmail = normalized.email.trim().length > 0
  const hasPhone = normalized.phone.trim().length > 0
  const hasPasscode = normalized.passcode.trim().length > 0
  const hasPin = normalized.pin.trim().length > 0

  const disabled = isMutating

  async function handleUpdate(changes: AccountSettingsUpdateValues, successMessage: string) {
    setStatus(null)
    try {
      await updateMutation.mutateAsync(changes)
      setStatus({ variant: 'success', message: successMessage })
      setModal(null)
    } catch (err) {
      setStatus({
        variant: 'error',
        message:
          err instanceof Error ? err.message : 'Unable to update your account right now. Please try again.',
      })
    }
  }

  async function handlePasswordChange(values: PasswordFormValues) {
    setStatus(null)
    try {
      await passwordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setStatus({ variant: 'success', message: 'Password updated successfully.' })
      setModal(null)
    } catch (err) {
      setStatus({
        variant: 'error',
        message:
          err instanceof Error ? err.message : 'Unable to update password. Please try again.',
      })
    }
  }

  return (
    <div className='space-y-4'>
      {queryError ? <StatusMessage variant='error'>{queryError}</StatusMessage> : null}
      {status ? <StatusMessage variant={status.variant}>{status.message}</StatusMessage> : null}

      <div className='space-y-6'>
        <section className='overflow-hidden rounded-xl border bg-background'>
          <div className='px-6 py-5'>
            <h3 className='text-base font-semibold'>Sign in</h3>
            <p className='text-sm text-muted-foreground'>
              Manage your contact details and how you access Elevt.
            </p>
          </div>
          <Separator />
          <div className='divide-y'>
            <AccountDetailRow
              label='Name'
              value={fullName ? <span>{fullName}</span> : undefined}
              fallback='No name on file'
              description='Displayed on your profile and communications.'
              actionLabel={fullName ? 'Update' : 'Add'}
              onAction={() => setModal('name')}
              disabled={disabled}
            />
            <AccountDetailRow
              label='Email'
              value={hasEmail ? <span>{normalized.email}</span> : undefined}
              fallback='No email on file'
              description='Used for receipts, invites, and account notices.'
              badgeText={hasEmail ? 'Verified' : undefined}
              actionLabel={hasEmail ? 'Update' : 'Add'}
              onAction={() => setModal('email')}
              disabled={disabled}
            />
            <AccountDetailRow
              label='Phone'
              value={hasPhone ? <span>{normalized.phone}</span> : undefined}
              fallback='No phone number'
              description='Add a phone number to receive SMS alerts.'
              actionLabel={hasPhone ? 'Update' : 'Add'}
              onAction={() => setModal('phone')}
              disabled={disabled}
            />
            <AccountDetailRow
              label='Password'
              value={<span className='tracking-widest'>••••••••</span>}
              fallback='No password set'
              description='Change the password you use to log in to Elevt.'
              actionLabel='Change'
              onAction={() => setModal('password')}
              disabled={disabled}
            />
          </div>
        </section>

        <section className='overflow-hidden rounded-xl border bg-background'>
          <div className='px-6 py-5'>
            <h3 className='text-base font-semibold'>POS security</h3>
            <p className='text-sm text-muted-foreground'>
              Update the credentials your team uses on the point of sale.
            </p>
          </div>
          <Separator />
          <div className='divide-y'>
            <AccountDetailRow
              label='Personal POS passcode'
              value={
                hasPasscode ? (
                  <span className='font-mono text-lg tracking-widest'>{normalized.passcode}</span>
                ) : undefined
              }
              fallback='No passcode set'
              description="Used to log in and clock in on the POS. Don't share it with anyone."
              actionLabel={hasPasscode ? 'Change' : 'Set'}
              onAction={() => setModal('passcode')}
              disabled={disabled}
            />
            <AccountDetailRow
              label='Security PIN'
              value={
                hasPin ? (
                  <span className='font-mono text-lg tracking-widest'>{normalized.pin}</span>
                ) : undefined
              }
              fallback='No PIN set'
              description='Required for sensitive changes in your account.'
              actionLabel={hasPin ? 'Change' : 'Set'}
              onAction={() => setModal('pin')}
              disabled={disabled}
            />
          </div>
        </section>
      </div>

      <NameDialog
        open={modal === 'name'}
        loading={isMutating}
        onOpenChange={(open) => setModal(open ? 'name' : null)}
        defaultValues={{ firstName: normalized.firstName, lastName: normalized.lastName }}
        onSubmit={(values) => handleUpdate(values, 'Name updated successfully.')}
      />
      <EmailDialog
        open={modal === 'email'}
        loading={isMutating}
        onOpenChange={(open) => setModal(open ? 'email' : null)}
        defaultValues={{ email: normalized.email }}
        onSubmit={(values) => handleUpdate(values, 'Email updated successfully.')}
      />
      <PhoneDialog
        open={modal === 'phone'}
        loading={isMutating}
        onOpenChange={(open) => setModal(open ? 'phone' : null)}
        defaultValues={{ phone: normalized.phone }}
        onSubmit={(values) => handleUpdate(values, 'Phone number updated successfully.')}
      />
      <PasscodeDialog
        open={modal === 'passcode'}
        loading={isMutating}
        onOpenChange={(open) => setModal(open ? 'passcode' : null)}
        defaultValues={{ passcode: normalized.passcode }}
        onSubmit={(values) => handleUpdate(values, 'Passcode updated successfully.')}
      />
      <PinDialog
        open={modal === 'pin'}
        loading={isMutating}
        onOpenChange={(open) => setModal(open ? 'pin' : null)}
        defaultValues={{ pin: normalized.pin }}
        onSubmit={(values) => handleUpdate(values, 'PIN updated successfully.')}
      />
      <PasswordDialog
        open={modal === 'password'}
        loading={isMutating}
        onOpenChange={(open) => setModal(open ? 'password' : null)}
        onSubmit={handlePasswordChange}
      />
    </div>
  )
}

