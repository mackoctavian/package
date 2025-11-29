import { z } from 'zod'

export const retreatAvailabilitySchema = z.object({
  total: z.number().int().min(0),
  male: z.number().int().min(0),
  female: z.number().int().min(0),
})

export const retreatInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  speaker: z.string().min(1),
  conductor: z.string().min(1),
  description: z.string().min(1),
  dateRange: z.string().min(1),
  timeRange: z.string().min(1),
  location: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(['Registration Open', 'Waitlist', 'Closed']).optional(),
  imageSrc: z.string().url().optional(),
  detailHref: z.string().optional(),
  ctaHref: z.string().optional(),
  availability: retreatAvailabilitySchema.optional(),
  price: z.number().nonnegative().optional(),
  isPaid: z.boolean().optional(),
})

export const retreatUpdateSchema = retreatInputSchema.partial().extend({
  availability: retreatAvailabilitySchema.partial().optional(),
})

const familyMemberSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  age: z.union([z.string(), z.number()]).optional(),
})

export const retreatBookingPayloadSchema = z.object({
  retreatId: z.string().min(1),
  retreatTitle: z.string().min(1),
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'waived']).optional(),
  note: z.string().optional(),
  form: z
    .object({
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(5),
      whatsapp: z.string().optional(),
      familyMembers: z.array(familyMemberSchema).optional(),
    })
    .passthrough(),
})

