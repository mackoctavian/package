import { z } from 'zod'

const emptyToUndefined = z.string().transform((value) => {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
})

export const teamMemberStatusSchema = z.enum(['active', 'inactive'])
export type TeamMemberStatus = z.infer<typeof teamMemberStatusSchema>

export const teamMemberSchema = z.object({
  id: z.string().uuid(),
  preferredName: z.string(),
  lastName: z.string(),
  email: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return null
      if (typeof val === 'string') {
        const trimmed = val.trim()
        return trimmed === '' ? null : trimmed
      }
      return val
    },
    z.union([z.string().email(), z.null()])
  ),
  mobileNumber: z.string().nullable(),
  role: z.string().nullable(),
  pinCode: z.string(),
  isActive: z.boolean(),
  location: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      nickname: z.string().nullable(),
    })
    .nullable(),
  department: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export type TeamMember = z.infer<typeof teamMemberSchema>

export const createTeamMemberSchema = z.object({
  preferredName: z.string().trim().min(1, 'Preferred name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
  mobileNumber: emptyToUndefined.optional(),
  role: z.string().trim().min(1, 'Role is required.'),
  pinCode: z.string().trim().min(4, 'PIN code must be at least 4 characters.'),
  locationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.boolean().optional().default(true),
})

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>

export const updateTeamMemberSchema = createTeamMemberSchema
  .extend({
    preferredName: z
      .string()
      .trim()
      .min(1, 'Preferred name is required.')
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required.')
      .optional(),
    role: z.string().trim().min(1, 'Role is required.').optional(),
    pinCode: z
      .string()
      .trim()
      .min(4, 'PIN code must be at least 4 characters.')
      .optional(),
  })
  .partial()

export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>
