import { z } from 'zod'

export const businessLocationSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'Location name is required.')
    .max(120, 'Location name must not exceed 120 characters.'),
})

export type BusinessLocationFormValues = z.infer<typeof businessLocationSchema>

export const businessSettingsFormSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, 'Business name is required.')
    .max(120, 'Business name must not exceed 120 characters.'),
  locations: businessLocationSchema.array(),
})

export type BusinessSettingsFormValues = z.infer<typeof businessSettingsFormSchema>

export const businessSettingsResponseSchema = z.object({
  businessName: z.string().nullable().optional(),
  locations: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().nullable().optional(),
      })
    )
    .default([]),
})

export type BusinessSettingsResponse = z.infer<typeof businessSettingsResponseSchema>

