/**
 * Tiny, dependency-free translator (the same rules as the website):
 * dotted keys, `{name}` placeholders and `_one` / `_other` plural forms.
 */

export type MessageTree = { [key: string]: string | MessageTree };

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type StripPlural<K> = K extends `${infer Base}_one` ? Base : K extends `${infer Base}_other` ? Base : K;

/** Every dotted key of a message tree, with plural forms collapsed (`items_one` → `items`). */
export type MessageKey<T> = {
  [K in keyof T & string]: T[K] extends string ? StripPlural<K> : Join<K, MessageKey<T[K]>>;
}[keyof T & string];

export type TranslateValues = Record<string, string | number | null | undefined>;

export type Translator<K extends string = string> = {
  (key: K, values?: TranslateValues): string;
  /** For keys built at runtime (ids from the API). Falls back to `fallback`, then the key. */
  dynamic: (key: string, values?: TranslateValues, fallback?: string) => string;
  locale: string;
};

export const flattenMessages = (tree: MessageTree, prefix = '', out: Record<string, string> = {}) => {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else flattenMessages(value, path, out);
  }
  return out;
};

const pluralRules = new Map<string, Intl.PluralRules>();
const pluralCategory = (locale: string, count: number) => {
  try {
    let rules = pluralRules.get(locale);
    if (!rules) {
      rules = new Intl.PluralRules(locale);
      pluralRules.set(locale, rules);
    }
    return rules.select(count);
  } catch {
    return count === 1 ? 'one' : 'other';
  }
};

const interpolate = (template: string, values?: TranslateValues) =>
  values
    ? template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = values[name];
        return value === undefined || value === null ? match : String(value);
      })
    : template;

export const createTranslator = <K extends string>(locale: string, primary: Record<string, string>, fallback: Record<string, string>): Translator<K> => {
  const lookup = (key: string, values?: TranslateValues) => {
    const count = values?.count;
    if (typeof count === 'number') {
      const form = `${key}_${pluralCategory(locale, count)}`;
      const plural = primary[form] ?? fallback[form] ?? primary[`${key}_other`] ?? fallback[`${key}_other`];
      if (plural !== undefined) return plural;
    }
    return primary[key] ?? fallback[key];
  };
  const t = ((key: string, values?: TranslateValues) => {
    const message = lookup(key, values);
    return message === undefined ? key : interpolate(message, values);
  }) as unknown as Translator<K>;
  t.dynamic = (key, values, fallbackText) => {
    const message = lookup(key, values);
    return message === undefined ? (fallbackText ?? key) : interpolate(message, values);
  };
  t.locale = locale;
  return t;
};
