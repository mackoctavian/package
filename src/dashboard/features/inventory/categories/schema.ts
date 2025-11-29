import { z } from 'zod'

export const inventoryCategoryBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  parentId: z.string().uuid('Invalid parent').nullable().optional(),
  departmentId: z.string().uuid('Invalid department').nullable().optional(),
  locationId: z.string().uuid('Invalid location').nullable().optional(),
  tileColor: z.string().trim().max(64).optional(),
  tileLabel: z.string().trim().max(64).optional(),
  iconName: z.string().trim().max(191).optional(),
  imageUrl: z.string().trim().url('Invalid image URL').optional(),
  isActive: z.boolean().optional(),
})

export const createInventoryCategorySchema = inventoryCategoryBaseSchema

export const updateInventoryCategorySchema = inventoryCategoryBaseSchema.partial()

export type CreateInventoryCategoryInput = z.infer<
  typeof createInventoryCategorySchema
>
export type UpdateInventoryCategoryInput = z.infer<
  typeof updateInventoryCategorySchema
>

