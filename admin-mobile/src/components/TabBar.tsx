import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';
import { colors, fonts, shadow } from '@/theme';
import { Icon, type IconName, Text } from './ui';

const tabs: Record<string, { label: string; icon: IconName; active: IconName }> = {
  index: { label: 'Home', icon: 'grid-outline', active: 'grid' },
  bookings: { label: 'Bookings', icon: 'ticket-outline', active: 'ticket' },
  scan: { label: 'Scan', icon: 'scan-outline', active: 'scan' },
  giving: { label: 'Giving', icon: 'heart-outline', active: 'heart' },
  more: { label: 'More', icon: 'menu-outline', active: 'menu' },
};

/** Floating, blurred tab bar with a sliding indicator and a raised Scan button. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const itemWidth = state.routes.length ? width / state.routes.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(state.index * itemWidth, { damping: 18, stiffness: 180 }));
  }, [state.index, itemWidth, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const onScan = state.routes[state.index]?.name === 'scan';

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, onScan && styles.barDark, shadow.lift]} onLayout={(event) => setWidth(event.nativeEvent.layout.width - 12)}>
        {Platform.OS === 'ios' && !onScan ? (
          <BlurView intensity={90} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 30, overflow: 'hidden' }]} />
        ) : null}
        {width > 0 && !onScan ? (
          <Animated.View style={[styles.indicatorWrap, { width: itemWidth }, indicator]}>
            <View style={styles.indicator} />
          </Animated.View>
        ) : null}
        {state.routes.map((route, index) => {
          const meta = tabs[route.name] ?? { label: descriptors[route.key]?.options.title ?? route.name, icon: 'ellipse-outline', active: 'ellipse' };
          const focused = index === state.index;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            haptic.select();
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          if (route.name === 'scan') {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel="Scan tickets">
                <LinearGradient colors={[colors.gold300, colors.gold500]} style={[styles.scan, onScan && { borderColor: colors.navy950 }]}>
                  <Icon name="qr-code" size={24} color={colors.navy950} />
                </LinearGradient>
              </Pressable>
            );
          }

          const tint = onScan ? (focused ? colors.white : colors.navy300) : focused ? colors.navy900 : colors.subtle;
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}>
              <Icon name={focused ? meta.active : meta.icon} size={22} color={tint} />
              <Text style={[styles.label, { color: tint, fontFamily: focused ? fonts.semibold : fonts.medium }]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    height: 68,
    borderRadius: 30,
    paddingHorizontal: 6,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.72)' : colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  barDark: { backgroundColor: 'rgba(10,20,38,0.92)', borderColor: 'rgba(255,255,255,0.1)' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' },
  label: { fontSize: 10.5, letterSpacing: 0.2 },
  indicatorWrap: { position: 'absolute', left: 6, top: 6, bottom: 6, alignItems: 'center' },
  indicator: { width: '86%', height: '100%', borderRadius: 24, backgroundColor: colors.gold50, borderWidth: 1, borderColor: colors.gold100 },
  scan: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 4,
    borderColor: colors.ivory,
  },
});
