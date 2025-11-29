import { z } from 'zod'

export const SUGGESTED_DISCOUNT_TYPES = ['PERCENTAGE', 'AMOUNT', 'CUSTOM'] as const

export const inventoryDiscountBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  amount: z
    .number()
    .nonnegative('Amount must be 0 or greater')
    .nullable()
    .optional(),
  applyAfterTax: z.boolean().optional(),
  requiresPasscode: z.boolean().optional(),
  isActive: z.boolean().optional(),
  locationId: z.string().uuid('Invalid location').nullable().optional(),
})

export const createInventoryDiscountSchema = inventoryDiscountBaseSchema

export const updateInventoryDiscountSchema = inventoryDiscountBaseSchema.partial()

export type CreateInventoryDiscountInput = z.infer<
  typeof createInventoryDiscountSchema
>
export type UpdateInventoryDiscountInput = z.infer<
  typeof updateInventoryDiscountSchema
>

