import { router } from 'expo-router';
import { type ReactNode, useEffect, useState, useSyncExternalStore } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/haptics';
import { capitalize, initials } from '@/lib/format';
import { colors, fonts, radius, shadow, space } from '@/theme';
import { Skeleton } from './feedback';
import { Button, Icon, type IconName, PressableScale, Text } from './ui';

/* ------------------------------------------------------------ Headers */

const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

export function IconButton({
  icon,
  onPress,
  label,
  tone = 'light',
  badge,
  size = 40,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  tone?: 'light' | 'dark' | 'glass';
  badge?: number;
  size?: number;
}) {
  const palette = {
    light: { bg: colors.white, fg: colors.ink, border: colors.border },
    dark: { bg: colors.navy900, fg: colors.white, border: colors.navy900 },
    glass: { bg: 'rgba(255,255,255,0.14)', fg: colors.white, border: 'rgba(255,255,255,0.22)' },
  }[tone];
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.bg, borderColor: palette.border },
        pressed && { opacity: 0.7 },
      ]}>
      <Icon name={icon} size={20} color={palette.fg} />
      {badge ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Large title header for tab screens. */
export function TabHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabHeader, { paddingTop: insets.top + 10 }]}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text variant="caption">{eyebrow}</Text> : null}
        <Text variant="display" numberOfLines={1} style={{ marginTop: eyebrow ? 2 : 0 }}>
          {title}
        </Text>
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: space.sm }}>{right}</View> : null}
    </View>
  );
}

/** Compact header for pushed screens, with a back button and optional actions. */
export function StackHeader({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.stackHeader, { paddingTop: insets.top + 6 }]}>
      <IconButton icon="chevron-back" label="Back" onPress={onBack ?? goBack} />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: space.sm }}>
        <Text variant="subtitle" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ minWidth: 40, flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm }}>{right}</View>
    </View>
  );
}

/* ------------------------------------------------------------- Status */

type Tone = 'success' | 'warning' | 'danger' | 'navy' | 'gold' | 'muted';

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  success: { bg: colors.successSoft, fg: colors.success, dot: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning, dot: '#d99a2b' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, dot: colors.danger },
  navy: { bg: colors.navy100, fg: colors.navy700, dot: colors.navy500 },
  gold: { bg: colors.gold100, fg: colors.gold700, dot: colors.gold500 },
  muted: { bg: '#eef0f3', fg: colors.muted, dot: colors.subtle },
};

const STATUS_TONE: Record<string, Tone> = {
  pending: 'warning',
  new: 'warning',
  approved: 'success',
  paid: 'success',
  celebrated: 'success',
  replied: 'success',
  acknowledged: 'navy',
  scheduled: 'navy',
  read: 'navy',
  rescheduled: 'gold',
  published: 'success',
  draft: 'muted',
  archived: 'muted',
  refunded: 'muted',
  cancelled: 'danger',
  failed: 'danger',
  'registration open': 'success',
  waitlist: 'warning',
  closed: 'muted',
  'checked in': 'success',
  view: 'navy',
  edit: 'gold',
  active: 'success',
  inactive: 'muted',
  expired: 'muted',
  revoked: 'danger',
  accepted: 'success',
};

export const toneFor = (status: string): Tone => STATUS_TONE[status.toLowerCase()] ?? 'navy';

export function StatusPill({ status, label, tone, style }: { status: string; label?: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const palette = TONES[tone ?? toneFor(status)];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }, style]}>
      <View style={[styles.pillDot, { backgroundColor: palette.dot }]} />
      <Text style={[styles.pillText, { color: palette.fg }]}>{capitalize(label ?? status)}</Text>
    </View>
  );
}

/* -------------------------------------------------------------- Tiles */

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'navy',
  onPress,
  style,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: IconName;
  tone?: 'navy' | 'gold' | 'green' | 'rose';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    navy: [colors.navy50, colors.navy700],
    gold: [colors.gold50, colors.gold600],
    green: [colors.successSoft, colors.success],
    rose: [colors.dangerSoft, colors.danger],
  }[tone];
  const body = (
    <>
      <View style={[styles.statIcon, { backgroundColor: palette[0] }]}>
        <Icon name={icon} size={18} color={palette[1]} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="smallStrong" numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text variant="small" numberOfLines={1} style={{ fontSize: 12 }}>
          {hint}
        </Text>
      ) : null}
    </>
  );
  if (!onPress) return <View style={[styles.stat, style]}>{body}</View>;
  return (
    <PressableScale onPress={onPress} style={[styles.stat, style]} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      {body}
    </PressableScale>
  );
}

/* --------------------------------------------------------------- Rows */

export function Avatar({ name, size = 42, tone = 'navy' }: { name: string; size?: number; tone?: 'navy' | 'gold' }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone === 'navy' ? colors.navy100 : colors.gold100,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.36, color: tone === 'navy' ? colors.navy700 : colors.gold700 }}>
        {initials(name) || '?'}
      </Text>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  chevron = true,
  style,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              haptic.tap();
              onPress();
            }
          : undefined
      }
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.navy50 }, style]}>
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="small" numberOfLines={1} style={{ fontSize: 12, color: colors.subtle }}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress && chevron ? <Icon name="chevron-forward" size={16} color={colors.subtle} /> : null}
    </Pressable>
  );
}

export function Group({ title, children, style, action, onAction }: { title?: string; children: ReactNode; style?: StyleProp<ViewStyle>; action?: string; onAction?: () => void }) {
  return (
    <View style={[{ gap: space.sm }, style]}>
      {title ? (
        <View style={styles.groupHeader}>
          <Text variant="caption" style={{ flex: 1 }}>
            {title}
          </Text>
          {action ? (
            <Pressable onPress={onAction} hitSlop={10}>
              <Text variant="smallStrong" color={colors.gold600}>
                {action}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export const RowDivider = () => <View style={styles.rowDivider} />;

export function KeyValue({ label, value, icon, onPress }: { label: string; value?: string | null; icon?: IconName; onPress?: () => void }) {
  if (!value) return null;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.kv, pressed && { opacity: 0.6 }]}>
      {icon ? <Icon name={icon} size={18} color={colors.gold600} /> : null}
      <Text variant="small" style={{ width: 110 }}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={{ flex: 1, textAlign: 'right' }} selectable>
        {value}
      </Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------- Segmented */

export function SegmentTabs<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const itemWidth = options.length ? width / options.length : 0;
  const x = useSharedValue(0);
  useEffect(() => {
    x.set(withSpring(index * itemWidth, { damping: 20, stiffness: 220 }));
  }, [index, itemWidth, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View style={[styles.segments, style]} onLayout={(event) => setWidth(event.nativeEvent.layout.width - 8)}>
      {width > 0 ? <Animated.View style={[styles.segmentIndicator, { width: itemWidth }, indicator]} /> : null}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              haptic.select();
              onChange(option.value);
            }}>
            <Text variant="smallStrong" color={active ? colors.navy950 : colors.muted} numberOfLines={1}>
              {option.label}
            </Text>
            {option.count ? (
              <View style={[styles.segmentCount, active && { backgroundColor: colors.gold400 }]}>
                <Text style={[styles.segmentCountText, active && { color: colors.navy950 }]}>{option.count > 99 ? '99+' : option.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontally scrolling filter chips. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              haptic.select();
              onChange(option.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}>
            <Text variant="smallStrong" color={active ? colors.white : colors.navy700}>
              {option.label}
            </Text>
            {option.count !== undefined ? (
              <Text variant="smallStrong" color={active ? colors.gold300 : colors.subtle} style={{ fontSize: 12 }}>
                {option.count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SearchField({ value, onChangeText, placeholder = 'Search' }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  return (
    <View style={styles.search}>
      <Icon name="search" size={18} color={colors.subtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        selectionColor={colors.gold500}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        style={styles.searchInput}
        accessibilityLabel={placeholder}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search">
          <Icon name="close-circle" size={18} color={colors.subtle} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------- Sheets */

/** Bottom sheet for pickers and quick actions. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <View style={styles.sheetHandle} />
        {title ? (
          <Text variant="heading" style={{ paddingHorizontal: space.xl, marginBottom: space.md }}>
            {title}
          </Text>
        ) : null}
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.sm }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function SheetOption({ label, description, selected, icon, onPress, danger }: { label: string; description?: string; selected?: boolean; icon?: IconName; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={({ pressed }) => [styles.sheetOption, selected && styles.sheetOptionActive, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      {icon ? <Icon name={icon} size={20} color={danger ? colors.danger : colors.navy700} /> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={danger ? colors.danger : undefined}>
          {label}
        </Text>
        {description ? <Text variant="small">{description}</Text> : null}
      </View>
      {selected ? <Icon name="checkmark-circle" size={22} color={colors.gold500} /> : null}
    </Pressable>
  );
}

/* -------------------------------------------------------------- States */

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={{ gap: space.md, paddingHorizontal: space.xl }}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <Skeleton style={{ width: 42, height: 42, borderRadius: 21 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 14, width: '70%' }} />
            <Skeleton style={{ height: 12, width: '45%' }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Animated.View entering={FadeIn} style={styles.errorState}>
      <View style={styles.errorIcon}>
        <Icon name="cloud-offline-outline" size={26} color={colors.danger} />
      </View>
      <Text variant="subtitle" center>
        Couldn&apos;t load this
      </Text>
      <Text variant="small" center>
        {message}
      </Text>
      {onRetry ? <Button label="Try again" icon="refresh" variant="secondary" size="md" onPress={onRetry} style={{ marginTop: space.sm }} /> : null}
    </Animated.View>
  );
}

export function ViewOnlyNote({ text = 'You have view-only access here.' }: { text?: string }) {
  return (
    <View style={styles.viewOnly}>
      <Icon name="eye-outline" size={16} color={colors.navy600} />
      <Text variant="small" color={colors.navy700} style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

export function Progress({ value, tone = 'navy' }: { value: number; tone?: 'navy' | 'gold' | 'danger' }) {
  const percent = Math.max(0, Math.min(1, value));
  const fill = { navy: colors.navy700, gold: colors.gold400, danger: colors.danger }[tone];
  return (
    <View style={styles.progress}>
      <View style={{ width: `${percent * 100}%`, height: '100%', borderRadius: 4, backgroundColor: fill }} />
    </View>
  );
}

/* --------------------------------------------------------------- Toast */

type ToastItem = { id: number; message: string; tone: 'success' | 'error' | 'info' };
let toastState: ToastItem | null = null;
const toastListeners = new Set<() => void>();
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const toast = (message: string, tone: ToastItem['tone'] = 'success') => {
  toastState = { id: Date.now(), message, tone };
  if (tone === 'error') haptic.error();
  else if (tone === 'success') haptic.success();
  toastListeners.forEach((listener) => listener());
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastState = null;
    toastListeners.forEach((listener) => listener());
  }, 2600);
};

export function ToastHost() {
  const current = useSyncExternalStore(
    (listener) => {
      toastListeners.add(listener);
      return () => toastListeners.delete(listener);
    },
    () => toastState,
  );
  const insets = useSafeAreaInsets();
  if (!current) return null;
  const icon: IconName = current.tone === 'success' ? 'checkmark-circle' : current.tone === 'error' ? 'alert-circle' : 'information-circle';
  const tint = current.tone === 'success' ? colors.gold300 : current.tone === 'error' ? '#ff9c92' : colors.navy200;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8, alignItems: 'center' }]}>
      <Animated.View key={current.id} entering={FadeInDown.springify().damping(16)} exiting={FadeOutUp} layout={LinearTransition} style={[styles.toast, shadow.lift]}>
        <Icon name={icon} size={20} color={tint} />
        <Text variant="smallStrong" color={colors.white} style={{ flexShrink: 1 }}>
          {current.message}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Native confirm dialog. Resolves true when the admin confirms. */
export const confirm = (title: string, message: string, action = 'Confirm', destructive = false) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: action, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });

const styles = StyleSheet.create({
  iconButton: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.gold400,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ivory,
  },
  iconBadgeText: { fontFamily: fonts.bold, fontSize: 9.5, color: colors.navy950 },
  tabHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, paddingHorizontal: space.xl, paddingBottom: space.lg },
  stackHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingBottom: space.md, backgroundColor: colors.ivory },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: fonts.semibold, fontSize: 11.5 },
  stat: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.soft,
  },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  statValue: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.ink, letterSpacing: -0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 13, backgroundColor: colors.white },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.lg },
  group: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xs },
  kv: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 12 },
  segments: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.parchment,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segmentIndicator: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: radius.pill, backgroundColor: colors.white, ...shadow.soft },
  segment: { flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segmentCount: { minWidth: 20, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: colors.navy100, alignItems: 'center', justifyContent: 'center' },
  segmentCountText: { fontFamily: fonts.bold, fontSize: 10, color: colors.navy700 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 46,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  sheetBackdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.ivory, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: space.sm },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.navy200, marginBottom: space.lg },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetOptionActive: { borderColor: colors.gold300, backgroundColor: colors.gold50 },
  errorState: { alignItems: 'center', gap: space.sm, paddingVertical: 48, paddingHorizontal: space.xxl },
  errorIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  viewOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.navy50,
    borderWidth: 1,
    borderColor: colors.navy100,
  },
  progress: { height: 6, borderRadius: 4, backgroundColor: colors.navy50, overflow: 'hidden' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    maxWidth: '90%',
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.navy950,
  },
});
