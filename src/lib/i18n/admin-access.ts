import type { AdminUserPayload } from '@/lib/auth/admin-shared'
import { canEdit } from '@/lib/auth/admin-shared'
import type { TranslationGroup } from './entities'

/**
 * Who may change translations: anyone with edit access to Translations, or
 * edit access to the area the content belongs to (a News editor can
 * translate news). Interface text needs Translations edit access.
 */
export const canEditGroup = (user: AdminUserPayload, group: TranslationGroup) => canEdit(user, 'translations') || canEdit(user, group.moduleId)

export const canEditInterface = (user: AdminUserPayload) => canEdit(user, 'translations')
