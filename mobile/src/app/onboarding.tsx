import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Button, CrossMark, Text } from '@/components/ui';
import { LanguagePicker } from '@/components/LanguagePicker';
import { onboardingSlides } from '@/data/content';
import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { actions } from '@/lib/store';
import { colors, space } from '@/theme';

type Slide = (typeof onboardingSlides)[number];

function SlideView({ slide, index, scrollX, width, height }: { slide: Slide; index: number; scrollX: SharedValue<number>; width: number; height: number }) {
  const t = useT();
  const range = [(index - 1) * width, index * width, (index + 1) * width];
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scrollX.get(), range, [-width * 0.45, 0, width * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.get(), range, [1.25, 1.05, 1.25], Extrapolation.CLAMP) },
    ],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.get(), range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollX.get(), range, [40, 0, 40], Extrapolation.CLAMP) }],
  }));
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <Image source={{ uri: slide.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} cachePolicy="memory-disk" />
      </Animated.View>
      <LinearGradient
        colors={['rgba(10,20,38,0.35)', 'rgba(10,20,38,0.05)', 'rgba(10,20,38,0.75)', colors.navy950]}
        locations={[0, 0.3, 0.62, 0.9]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.copy, textStyle]}>
        <Text variant="caption" color={colors.gold300}>
          {t(`onboarding.slides.${slide.key}.eyebrow`)}
        </Text>
        <Text variant="hero" color={colors.white} style={{ marginTop: 10 }}>
          {t(`onboarding.slides.${slide.key}.title`)}
        </Text>
        <Text variant="body" color={colors.navy100} style={{ marginTop: 12, fontSize: 16, lineHeight: 24 }}>
          {t(`onboarding.slides.${slide.key}.body`)}
        </Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    const position = scrollX.get() / width;
    const distance = Math.abs(position - index);
    return {
      width: interpolate(distance, [0, 1], [28, 8], Extrapolation.CLAMP),
      opacity: interpolate(distance, [0, 1], [1, 0.4], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

export default function Onboarding() {
  const { width, height } = useWindowDimensions();
  const t = useT();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const listRef = useRef<Animated.ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === onboardingSlides.length - 1;

  useEffect(() => {
    Image.prefetch(onboardingSlides.map((slide) => slide.image)).catch(() => undefined);
  }, []);

  const pageValue = useSharedValue(0);
  const onPageChange = (next: number) => {
    haptic.select();
    setPage(next);
  };
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.set(event.contentOffset.x);
    const next = Math.round(event.contentOffset.x / width);
    if (next !== pageValue.get()) {
      pageValue.set(next);
      scheduleOnRN(onPageChange, next);
    }
  });

  const finish = () => {
    haptic.success();
    actions.completeOnboarding();
    router.replace('/');
  };

  const next = () => {
    if (last) return finish();
    listRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy950 }}>
      <StatusBar style="light" />
      <Animated.ScrollView
        ref={listRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
>
        {onboardingSlides.map((slide, index) => (
          <SlideView key={slide.key} slide={slide} index={index} scrollX={scrollX} width={width} height={height} />
        ))}
      </Animated.ScrollView>

      <Animated.View entering={FadeIn.delay(200)} style={[styles.top, { top: insets.top + 8 }]}>
        <View style={styles.brand}>
          <CrossMark />
          <Text variant="subtitle" color={colors.white} style={{ letterSpacing: 2 }}>
            DMRC
          </Text>
        </View>
        <View style={styles.topRight}>
          <LanguagePicker tone="dark" compact />
          {!last ? (
            <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
              <Text variant="smallStrong" color={colors.white}>
                {t('onboarding.skip')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {onboardingSlides.map((slide, index) => (
            <Dot key={slide.key} index={index} scrollX={scrollX} width={width} />
          ))}
        </View>
        <Button label={last ? t('onboarding.getStarted') : t('common.continue')} iconRight={last ? 'checkmark' : 'arrow-forward'} variant="gold" onPress={next} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { position: 'absolute', left: space.xxl, right: space.xxl, bottom: 190 },
  top: { position: 'absolute', left: space.xxl, right: space.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  bottom: { position: 'absolute', left: space.xxl, right: space.xxl, bottom: 0, gap: space.xxl },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.gold300 },
});
