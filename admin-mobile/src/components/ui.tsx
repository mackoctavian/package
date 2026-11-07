import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text as RNText,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { mediaUrl } from '@/lib/config';
import { haptic } from '@/lib/haptics';
import { colors, fonts, radius, shadow, space } from '@/theme';

/* ------------------------------------------------------------------ Text */

const variants = StyleSheet.create({
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.ink, letterSpacing: -0.4 },
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.ink, letterSpacing: -0.3 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.ink },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.ink },
  caption: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.gold600 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.ink },
  quote: { fontFamily: fonts.displayItalic, fontSize: 20, lineHeight: 27, color: colors.ink },
});

export type TextVariant = keyof typeof variants;

export function Text({
  variant = 'body',
  color,
  center,
  style,
  ...props
}: TextProps & { variant?: TextVariant; color?: string; center?: boolean }) {
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      {...props}
      style={[variants[variant], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
    />
  );
}

/* ------------------------------------------------------------------ Icon */

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = colors.ink, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

/* ------------------------------------------------------------------ Image */

export function Img({ uri, style, ...props }: Omit<ImageProps, 'source'> & { uri?: string | null }) {
  return (
    <Image
      source={uri ? { uri: mediaUrl(uri) } : undefined}
      style={[{ backgroundColor: colors.navy100 }, style]}
      contentFit="cover"
      transition={250}
      cachePolicy="memory-disk"
      {...props}
    />
  );
}

/* ------------------------------------------------------- Pressable scale */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  onPress,
  hapticFeedback = true,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticFeedback?: boolean;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...props}
      style={[style, animated]}
      onPressIn={(event) => {
        scale.set(withSpring(scaleTo, { damping: 18, stiffness: 320 }));
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, { damping: 14, stiffness: 260 }));
        props.onPressOut?.(event);
      }}
      onPress={(event) => {
        if (hapticFeedback) haptic.tap();
        onPress?.(event);
      }}>
      {children}
    </AnimatedPressable>
  );
}

/* ---------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'light' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  size = 'lg',
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.navy900, fg: colors.white, border: colors.navy900 },
    gold: { bg: colors.gold400, fg: colors.navy950, border: colors.gold400 },
    secondary: { bg: colors.white, fg: colors.ink, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.ink, border: 'transparent' },
    light: { bg: 'rgba(255,255,255,0.14)', fg: colors.white, border: 'rgba(255,255,255,0.28)' },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  }[variant];
  const inactive = disabled || loading;
  return (
    <PressableScale
      disabled={inactive}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        size === 'md' && styles.buttonMd,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.45 : 1 },
        variant === 'gold' || variant === 'primary' ? shadow.soft : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={palette.fg} /> : null}
          <Text variant="bodyStrong" color={palette.fg} style={size === 'md' ? { fontSize: 14 } : null}>
            {label}
          </Text>
          {iconRight ? <Icon name={iconRight} size={18} color={palette.fg} /> : null}
        </>
      )}
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Chip */

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        onPress?.();
      }}
      hapticFeedback={false}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active ? styles.chipActive : null]}>
      {icon ? <Icon name={icon} size={14} color={active ? colors.white : colors.navy700} /> : null}
      <Text variant="smallStrong" color={active ? colors.white : colors.navy700}>
        {label}
      </Text>
    </PressableScale>
  );
}

/* ----------------------------------------------------------------- Badge */

export function Badge({ label, tone = 'gold', style }: { label: string; tone?: 'gold' | 'navy' | 'success' | 'warning' | 'danger' | 'light'; style?: StyleProp<ViewStyle> }) {
  const palette = {
    gold: [colors.gold100, colors.gold700],
    navy: [colors.navy100, colors.navy700],
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    light: ['rgba(255,255,255,0.18)', colors.white],
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette[0] }, style]}>
      <Text variant="caption" color={palette[1]} style={{ letterSpacing: 0.8, fontSize: 10 }}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ Card */

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: space.lg }, style]}>{children}</View>;
}

/* -------------------------------------------------------- Section header */

export function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
  style,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text variant="caption">{eyebrow}</Text> : null}
        <Text variant="heading" style={{ marginTop: eyebrow ? 4 : 0 }}>
          {title}
        </Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link" style={styles.sectionAction}>
          <Text variant="smallStrong" color={colors.gold600}>
            {action}
          </Text>
          <Icon name="arrow-forward" size={14} color={colors.gold600} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* --------------------------------------------------------------- Divider */

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[styles.divider, style]} />;

/* ------------------------------------------------------------- Gradients */

export const ScrimGradient = ({ style, strength = 0.85 }: { style?: StyleProp<ViewStyle>; strength?: number }) => (
  <LinearGradient
    pointerEvents="none"
    colors={['rgba(10,20,38,0)', `rgba(10,20,38,${strength * 0.55})`, `rgba(10,20,38,${strength})`]}
    locations={[0, 0.55, 1]}
    style={[StyleSheet.absoluteFill, style]}
  />
);

export const NavyGradient = ({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) => (
  <LinearGradient colors={[colors.navy700, colors.navy900, colors.navy950]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
    {children}
  </LinearGradient>
);

/* ------------------------------------------------------------ Cross mark */

export function CrossMark({ size = 30, color = colors.navy950, background = colors.gold400 }: { size?: number; color?: string; background?: string }) {
  const bar = Math.max(2, Math.round(size * 0.11));
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: bar, height: size * 0.6, borderRadius: bar, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: size * 0.4, height: bar, borderRadius: bar, backgroundColor: color, top: size * 0.36 }} />
    </View>
  );
}

/* ------------------------------------------------------------ Info row */

export function InfoRow({ icon, label, value, style }: { icon: IconName; label: string; value: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.infoRow, style]}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={18} color={colors.gold600} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="small">{label}</Text>
        <Text variant="bodyStrong">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: space.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
  },
  buttonMd: { minHeight: 44, paddingHorizontal: space.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.soft,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space.xl, marginBottom: space.md },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gold50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold100,
  },
});
