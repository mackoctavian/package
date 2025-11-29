import { z } from 'zod'

export const inventoryItemBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  categoryId: z.string().uuid('Invalid category').nullable().optional(),
  departmentId: z.string().uuid('Invalid department').nullable().optional(),
  locationId: z.string().uuid('Invalid location').nullable().optional(),
  stockKeepingUnit: z.string().trim().max(191).optional(),
  barcode: z.string().trim().max(191).optional(),
  tileColor: z.string().trim().max(64).optional(),
  price: z
    .number()
    .min(0, 'Price must be 0 or greater')
    .optional(),
  stockQuantity: z
    .number()
    .min(0, 'Stock must be 0 or greater')
    .default(0),
  isActive: z.boolean().optional(),
  trackStock: z.boolean().optional(),
})

export const createInventoryItemSchema = inventoryItemBaseSchema.extend({
  price: inventoryItemBaseSchema.shape.price.default(0),
})

export const updateInventoryItemSchema = inventoryItemBaseSchema.partial()

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type CreateInventoryItemFormValues = z.input<typeof createInventoryItemSchema>
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>

