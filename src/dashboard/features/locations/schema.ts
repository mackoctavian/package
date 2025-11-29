import { z } from 'zod'

export const locationFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  nickname: z.string().min(1, 'Nickname is required'),
  description: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  isDefault: z.boolean().optional(),
})

export type LocationFormValues = z.infer<typeof locationFormSchema>
