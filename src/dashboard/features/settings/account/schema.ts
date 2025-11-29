import { z } from 'zod'

const firstNameSchema = z
  .string()
  .trim()
  .min(1, 'First name is required.')
  .max(100, 'First name must not exceed 100 characters.')

const lastNameSchema = z
  .string()
  .trim()
  .min(1, 'Last name is required.')
  .max(100, 'Last name must not exceed 100 characters.')

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email address.')
  .max(254, 'Email must not exceed 254 characters.')

const phoneSchema = z
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
  })

const passcodeSchema = z
  .string()
  .trim()
  .min(4, 'Passcode must be at least 4 characters.')
  .max(12, 'Passcode must not exceed 12 characters.')

const pinSchema = z
  .string()
  .trim()
  .min(4, 'PIN must be at least 4 characters.')
  .max(12, 'PIN must not exceed 12 characters.')

export const accountSettingsFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().default(''),
  passcode: passcodeSchema,
  pin: pinSchema,
})

export type AccountSettingsFormValues = z.infer<typeof accountSettingsFormSchema>

export const accountSettingsUpdateSchema = z
  .object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    passcode: passcodeSchema.optional(),
    pin: pinSchema.optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    'No changes provided.'
  )

export type AccountSettingsUpdateValues = z.infer<typeof accountSettingsUpdateSchema>

export const accountSettingsResponseSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  passcode: z.string().nullable().optional(),
  pin: z.string().nullable().optional(),
})

export type AccountSettingsResponse = z.infer<typeof accountSettingsResponseSchema>

