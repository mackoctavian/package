import common from './common'
import meta from './meta'
import nav from './nav'
import home from './home'
import about from './about'
import apostolate from './apostolate'
import content from './content'
import retreats from './retreats'
import giving from './giving'
import news from './news'
import publications from './publications'
import pages from './pages'

/**
 * All interface text for the website, by namespace. Each namespace file holds
 * English and Swahili side by side. Add new namespaces here.
 */
const namespaces = { common, meta, nav, home, about, apostolate, content, retreats, giving, news, publications, pages }

type Namespaces = typeof namespaces
type Locales = 'en' | 'sw'
type ByLocale<L extends Locales> = { [N in keyof Namespaces]: Namespaces[N][L] }

const pick = <L extends Locales>(locale: L) =>
  Object.fromEntries(Object.entries(namespaces).map(([name, messages]) => [name, messages[locale]])) as ByLocale<L>

export const DEFAULT_MESSAGES = { en: pick('en'), sw: pick('sw') }

export type AppMessages = ByLocale<'en'>
export type { MessageKey } from '../translate'
import type { MessageKey } from '../translate'
export type AppMessageKey = MessageKey<AppMessages>
