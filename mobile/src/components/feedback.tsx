import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { colors, radius, space } from '@/theme';
import { Button, Icon, type IconName, Text } from './ui';

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View style={[{ backgroundColor: colors.navy100, borderRadius: radius.md }, style, animated]} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={colors.gold600} />
      </View>
      <Text variant="heading" center>
        {title}
      </Text>
      {body ? (
        <Text variant="body" color={colors.muted} center>
          {body}
        </Text>
      ) : null}
      {action ? <Button label={action} onPress={onAction} variant="secondary" size="md" style={{ marginTop: space.sm }} /> : null}
    </Animated.View>
  );
}

export function OfflineNotice({ visible, style }: { visible?: boolean; style?: StyleProp<ViewStyle> }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn} style={[styles.notice, style]}>
      <Icon name="cloud-offline-outline" size={16} color={colors.warning} />
      <Text variant="small" color={colors.warning} style={{ flex: 1 }}>
        You are offline or DMRC could not be reached. Showing saved content.
      </Text>
    </Animated.View>
  );
}

export function DemoBanner({ text, style }: { text?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.demo, style]} accessibilityRole="alert">
      <Icon name="information-circle" size={18} color={colors.warning} />
      <Text variant="small" color={colors.warning} style={{ flex: 1 }}>
        {text ?? 'Demo payment: DMRC has not connected a payment provider yet. No money is taken and no card details are stored.'}
      </Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Animated.View entering={FadeIn} style={[styles.notice, { backgroundColor: colors.dangerSoft, borderColor: '#f2c9c4' }]}>
      <Icon name="alert-circle" size={16} color={colors.danger} />
      <Text variant="small" color={colors.danger} style={{ flex: 1 }}>
        {message}
      </Text>
    </Animated.View>
  );
}

/** Animated success seal used at the end of every flow. */
export function SuccessMark({ size = 96 }: { size?: number }) {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.set(withDelay(250, withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 0 })), 3)));
  }, [ring]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - ring.get()),
    transform: [{ scale: 1 + ring.get() * 0.7 }],
  }));
  const pop = useSharedValue(0.6);
  useEffect(() => {
    pop.set(withSpring(1, { damping: 9, stiffness: 160 }));
  }, [pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  return (
    <View style={{ width: size * 1.8, height: size * 1.8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: colors.gold300 }, ringStyle]} />
      <Animated.View entering={ZoomIn.springify()} style={[styles.successCore, { width: size, height: size, borderRadius: size }, popStyle]}>
        <Icon name="checkmark" size={size * 0.5} color={colors.navy950} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: 48, paddingHorizontal: space.xxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold50,
    borderWidth: 1,
    borderColor: colors.gold100,
    marginBottom: space.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: '#f1dfb8',
  },
  demo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: '#f1dfb8',
  },
  successCore: { backgroundColor: colors.gold400, alignItems: 'center', justifyContent: 'center' },
});
