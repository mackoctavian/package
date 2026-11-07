import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { cartCount, useAppStore } from '@/lib/store';
import { colors, fonts, shadow } from '@/theme';
import { Icon, type IconName, Text } from './ui';

const tabs: Record<string, { label: 'home' | 'retreats' | 'give' | 'shop' | 'more'; icon: IconName; active: IconName }> = {
  index: { label: 'home', icon: 'home-outline', active: 'home' },
  retreats: { label: 'retreats', icon: 'leaf-outline', active: 'leaf' },
  give: { label: 'give', icon: 'heart-outline', active: 'heart' },
  shop: { label: 'shop', icon: 'book-outline', active: 'book' },
  more: { label: 'more', icon: 'grid-outline', active: 'grid' },
};

/** Floating, blurred tab bar with a sliding gold indicator and a raised "Give" action. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const t = useT();
  const [width, setWidth] = useState(0);
  const cart = useAppStore((s) => cartCount(s.cart));
  const itemWidth = width / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(state.index * itemWidth, { damping: 18, stiffness: 180 }));
  }, [state.index, itemWidth, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, shadow.lift]} onLayout={(event) => setWidth(event.nativeEvent.layout.width - 12)}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={90} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 30, overflow: 'hidden' }]} />
        ) : null}
        {width > 0 ? (
          <Animated.View style={[styles.indicatorWrap, { width: itemWidth }, indicator]}>
            {state.routes[state.index]?.name !== 'give' ? <View style={styles.indicator} /> : null}
          </Animated.View>
        ) : null}
        {state.routes.map((route, index) => {
          const known = tabs[route.name];
          const meta = known
            ? { ...known, label: t(`tabs.${known.label}`) }
            : { label: descriptors[route.key]?.options.title ?? route.name, icon: 'ellipse-outline' as IconName, active: 'ellipse' as IconName };
          const focused = index === state.index;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            haptic.select();
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          if (route.name === 'give') {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={t('tabs.give')}>
                <LinearGradient colors={[colors.gold300, colors.gold500]} style={styles.give}>
                  <Icon name={focused ? 'heart' : 'heart-outline'} size={24} color={colors.navy950} />
                </LinearGradient>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}>
              <View>
                <Icon name={focused ? meta.active : meta.icon} size={22} color={focused ? colors.navy900 : colors.subtle} />
                {route.name === 'shop' && cart > 0 ? (
                  <View style={styles.dot}>
                    <Text style={styles.dotText}>{cart > 9 ? '9+' : cart}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, { color: focused ? colors.navy900 : colors.subtle, fontFamily: focused ? fonts.semibold : fonts.medium }]}>
                {meta.label}
              </Text>
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
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' },
  label: { fontSize: 10.5, letterSpacing: 0.2 },
  indicatorWrap: { position: 'absolute', left: 6, top: 6, bottom: 6, alignItems: 'center' },
  indicator: { width: '86%', height: '100%', borderRadius: 24, backgroundColor: colors.gold50, borderWidth: 1, borderColor: colors.gold100 },
  give: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 4,
    borderColor: colors.ivory,
  },
  dot: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: colors.gold400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontFamily: fonts.bold, fontSize: 10, color: colors.navy950 },
});
