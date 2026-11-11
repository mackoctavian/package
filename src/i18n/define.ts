import type { MessageTree, Shape } from './translate'

/**
 * Declares one namespace of interface text with its English source and its
 * Swahili translation side by side. TypeScript fails the build if a Swahili
 * key is missing, so the two languages can never drift apart silently.
 *
 * Admins can override any of these strings at runtime from
 * Admin → Translations → Interface text; these values are the defaults.
 */
export const defineMessages = <T extends MessageTree>(messages: { en: T; sw: Shape<T> }) => messages
