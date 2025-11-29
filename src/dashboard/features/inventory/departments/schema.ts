import { z } from 'zod'

export const inventoryDepartmentBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  tileColor: z.string().trim().max(64).optional(),
  locationId: z.string().uuid('Invalid location').nullable().optional(),
  isActive: z.boolean().optional(),
})

export const createInventoryDepartmentSchema = inventoryDepartmentBaseSchema

export const updateInventoryDepartmentSchema = inventoryDepartmentBaseSchema.partial()

export type CreateInventoryDepartmentInput = z.infer<
  typeof createInventoryDepartmentSchema
>
export type UpdateInventoryDepartmentInput = z.infer<
  typeof updateInventoryDepartmentSchema
>

