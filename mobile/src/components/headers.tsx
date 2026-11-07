import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, type ScrollViewProps, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { colors, space } from '@/theme';
import { Icon, type IconName, Img, ScrimGradient, Text } from './ui';

export function RoundButton({
  icon,
  onPress,
  label,
  tone = 'glass',
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  tone?: 'glass' | 'solid';
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.round, tone === 'solid' ? styles.roundSolid : styles.roundGlass, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={20} color={tone === 'solid' ? colors.ink : colors.white} />
      {badge ? (
        <View style={styles.badge}>
          <Text variant="caption" color={colors.navy950} style={{ fontSize: 10, letterSpacing: 0 }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** Plain stack screen header on ivory, with back button and optional right action. */
export function ScreenHeader({ title, right, subtitle, onBack }: { title: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const t = useT();
  return (
    <View style={[styles.plainHeader, { paddingTop: insets.top + 6 }]}>
      <View style={styles.plainRow}>
        <RoundButton icon="chevron-back" label={t('common.back')} tone="solid" onPress={onBack ?? goBack} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="subtitle" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="small" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
      </View>
    </View>
  );
}

const HERO_HEIGHT = 380;

/**
 * Detail screen with a full-bleed image that stretches on overscroll and a
 * compact title bar that fades in once the image scrolls away.
 */
export function ParallaxScreen({
  image,
  title,
  hero,
  right,
  children,
  footer,
  heroHeight = HERO_HEIGHT,
  ...scrollProps
}: ScrollViewProps & {
  image?: string;
  title: string;
  hero?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  heroHeight?: number;
}) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const imageStyle = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: interpolate(y, [-heroHeight, 0, heroHeight], [-heroHeight / 2, 0, heroHeight * 0.45]) },
        { scale: interpolate(y, [-heroHeight, 0], [2, 1], Extrapolation.CLAMP) },
      ],
    };
  });
  const heroContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, heroHeight * 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [0, heroHeight], [0, -40], Extrapolation.CLAMP) }],
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [heroHeight - 160, heroHeight - 90], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <Animated.ScrollView
        {...scrollProps}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footer ? 140 : 48 }}>
        <View style={{ height: heroHeight, overflow: 'hidden', backgroundColor: colors.navy900 }}>
          <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
            <Img uri={image} style={StyleSheet.absoluteFill} priority="high" />
            <ScrimGradient strength={0.92} />
          </Animated.View>
          <Animated.View style={[styles.heroContent, heroContentStyle]}>{hero}</Animated.View>
        </View>
        <View style={styles.sheet}>{children}</View>
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[styles.bar, { height: insets.top + 56 }, barStyle]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(251,249,245,0.97)' }]} />
        )}
        <View style={[styles.barTitle, { top: insets.top }]}>
          <Text variant="subtitle" numberOfLines={1} style={{ maxWidth: '70%' }}>
            {title}
          </Text>
        </View>
        <View style={styles.barBorder} />
      </Animated.View>

      <View style={[styles.floating, { top: insets.top + 8 }]}>
        <RoundButton icon="chevron-back" label={t('common.back')} onPress={goBack} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>{right}</View>
      </View>

      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  roundGlass: { backgroundColor: 'rgba(10,20,38,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  roundSolid: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  plainHeader: { backgroundColor: colors.ivory, paddingHorizontal: space.lg, paddingBottom: space.md },
  plainRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroContent: { position: 'absolute', left: space.xl, right: space.xl, bottom: 44 },
  sheet: {
    marginTop: -28,
    backgroundColor: colors.ivory,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.xxl,
  },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  barTitle: { position: 'absolute', left: 0, right: 0, height: 56, alignItems: 'center', justifyContent: 'center' },
  barBorder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  floating: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: 'rgba(251,249,245,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
