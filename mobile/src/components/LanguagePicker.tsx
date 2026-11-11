import { Pressable, StyleSheet, View } from 'react-native';

import { MOBILE_LOCALES } from '@/i18n/messages';
import { setLanguage, useLocale, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { colors, radius, space } from '@/theme';
import { Icon, Text } from './ui';

const SHORT = { en: 'EN', sw: 'SW' } as const;

/**
 * English / Kiswahili switch. `compact` is the small pill used over images
 * (onboarding); the full version is a list for the More screen.
 */
export function LanguagePicker({ compact, tone = 'light' }: { compact?: boolean; tone?: 'light' | 'dark' }) {
  const t = useT();
  const locale = useLocale();

  const choose = (next: (typeof MOBILE_LOCALES)[number]) => {
    if (next === locale) return;
    haptic.select();
    setLanguage(next);
  };

  if (compact) {
    const dark = tone === 'dark';
    return (
      <View style={[styles.pill, dark ? styles.pillDark : styles.pillLight]} accessibilityRole="radiogroup" accessibilityLabel={t('language.title')}>
        {MOBILE_LOCALES.map((item) => {
          const active = item === locale;
          return (
            <Pressable
              key={item}
              onPress={() => choose(item)}
              hitSlop={6}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={t(`language.${item}`)}
              style={[styles.pillOption, active && (dark ? styles.pillActiveDark : styles.pillActiveLight)]}>
              <Text variant="smallStrong" color={active ? colors.navy950 : dark ? colors.white : colors.navy700} style={{ fontSize: 12, letterSpacing: 1 }}>
                {SHORT[item]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup" accessibilityLabel={t('language.title')}>
      {MOBILE_LOCALES.map((item) => {
        const active = item === locale;
        return (
          <Pressable
            key={item}
            onPress={() => choose(item)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.row, active && styles.rowActive]}>
            <View style={[styles.code, active && { backgroundColor: colors.navy900 }]}>
              <Text variant="smallStrong" color={active ? colors.gold300 : colors.navy700} style={{ letterSpacing: 1 }}>
                {SHORT[item]}
              </Text>
            </View>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {t(`language.${item}`)}
            </Text>
            <Icon name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.navy900 : colors.subtle} />
          </Pressable>
        );
      })}
      <Text variant="small">{t('language.hint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', borderRadius: radius.pill, padding: 3, gap: 2 },
  pillDark: { backgroundColor: 'rgba(255,255,255,0.14)' },
  pillLight: { backgroundColor: colors.navy50 },
  pillOption: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  pillActiveDark: { backgroundColor: colors.gold300 },
  pillActiveLight: { backgroundColor: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rowActive: { borderColor: colors.navy900, backgroundColor: colors.navy50 },
  code: { width: 40, height: 32, borderRadius: 10, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
});
