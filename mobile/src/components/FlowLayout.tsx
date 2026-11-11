import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { colors, space } from '@/theme';
import { RoundButton } from './headers';
import { Text } from './ui';

/** Modal-style multi-step flow: title, animated progress bar, scrollable body and a sticky footer. */
export function FlowLayout({
  title,
  subtitle,
  step,
  steps,
  onClose,
  onBack,
  children,
  footer,
  scrollRef,
}: {
  title: string;
  subtitle?: string;
  step?: number;
  steps?: number;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  scrollRef?: React.RefObject<ScrollViewInstance | null>;
}) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const progress = steps ? ((step ?? 0) + 1) / steps : 0;
  const bar = useAnimatedStyle(() => ({ width: withSpring(`${progress * 100}%`, { damping: 20, stiffness: 140 }) }));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.ivory }}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm }]}>
        <View style={styles.row}>
          {onBack ? <RoundButton icon="chevron-back" tone="solid" label={t('common.back')} onPress={onBack} /> : <View style={{ width: 40 }} />}
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
          <RoundButton icon="close" tone="solid" label={t('common.close')} onPress={onClose} />
        </View>
        {steps ? (
          <View style={styles.track}>
            <Animated.View style={[styles.fill, bar]} />
          </View>
        ) : null}
      </View>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: space.xl, paddingBottom: 140, gap: space.lg }}>
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.md, backgroundColor: colors.ivory },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.navy50, overflow: 'hidden', marginHorizontal: space.xs },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.gold400 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: 'rgba(251,249,245,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
