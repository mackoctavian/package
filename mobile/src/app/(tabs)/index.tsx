import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArticleFeature, ArticleRow, PublicationCard, RetreatFeatureCard } from '@/components/cards';
import { OfflineNotice } from '@/components/feedback';
import { RoundButton } from '@/components/headers';
import { Button, Card, CrossMark, Icon, type IconName, Img, PressableScale, ScrimGradient, SectionHeader, Text } from '@/components/ui';
import { imagery, scriptureOfTheDay } from '@/data/content';
import { useHome } from '@/lib/api';
import { useT } from '@/i18n';
import { greeting } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { colors, radius, shadow, space, TAB_BAR_SPACE } from '@/theme';

const HERO = 430;

const actionsGrid: { id: 'book' | 'give' | 'mass' | 'tickets' | 'bookshop' | 'gallery' | 'news' | 'ministries'; icon: IconName; href: Href }[] = [
  { id: 'book', icon: 'leaf-outline', href: '/retreats' },
  { id: 'give', icon: 'heart-outline', href: '/donate' },
  { id: 'mass', icon: 'flame-outline', href: '/mass-intention' },
  { id: 'tickets', icon: 'ticket-outline', href: '/tickets' },
  { id: 'bookshop', icon: 'book-outline', href: '/shop' },
  { id: 'gallery', icon: 'images-outline', href: '/gallery' },
  { id: 'news', icon: 'newspaper-outline', href: '/news' },
  { id: 'ministries', icon: 'people-outline', href: '/ministries' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const { width } = useWindowDimensions();
  const { data, refetch, isRefetching } = useHome();
  const name = useAppStore((s) => s.profile.fullName.split(' ')[0]);
  const ticketCount = useAppStore((s) => s.tickets.length);
  const [testimonial, setTestimonial] = useState(0);
  const home = data?.data;
  const scripture = scriptureOfTheDay();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  const heroImage = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.get(), [-HERO, 0, HERO], [-HERO / 2, 0, HERO * 0.4]) },
      { scale: interpolate(scrollY.get(), [-HERO, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));
  const heroCopy = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, 180], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [0, 180], [0, -24], Extrapolation.CLAMP) }],
  }));
  const bar = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [HERO - 200, HERO - 120], [0, 1], Extrapolation.CLAMP) }));

  if (!home) return null;

  const upcoming = home.retreats.filter((retreat) => !retreat.ended);
  const featured = upcoming.length ? upcoming : home.retreats.slice(0, 3);
  const cardWidth = width - space.xl * 2 - 24;
  const heroUri = home.heroSlides[0]?.imageUrl ?? imagery.heroChapel;
  const quote = home.testimonials[testimonial % Math.max(home.testimonials.length, 1)];

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <StatusBar style="light" />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.gold300} progressViewOffset={insets.top} />}>
        {/* Hero */}
        <View style={{ height: HERO, overflow: 'hidden', backgroundColor: colors.navy900 }}>
          <Animated.View style={[StyleSheet.absoluteFill, heroImage]}>
            <Img uri={heroUri} style={StyleSheet.absoluteFill} priority="high" />
            <LinearGradient colors={['rgba(10,20,38,0.55)', 'rgba(10,20,38,0.1)']} style={[StyleSheet.absoluteFill, { height: 160 }]} />
            <ScrimGradient strength={0.95} />
          </Animated.View>
          <View style={[styles.heroTop, { top: insets.top + 8 }]}>
            <View style={styles.brand}>
              <CrossMark />
              <View>
                <Text variant="subtitle" color={colors.white} style={{ letterSpacing: 2 }}>
                  DMRC
                </Text>
                <Text variant="small" color={colors.navy100} style={{ fontSize: 11, lineHeight: 13 }}>
                  {t('home.place')}
                </Text>
              </View>
            </View>
            <RoundButton icon="ticket-outline" label={t('home.actions.tickets')} badge={ticketCount} onPress={() => router.push('/tickets')} />
          </View>
          <Animated.View style={[styles.heroCopy, heroCopy]}>
            <Text variant="caption" color={colors.gold300}>
              {name ? t('home.greetingName', { greeting: t(`home.greeting.${greeting()}`), name }) : t(`home.greeting.${greeting()}`)}
            </Text>
            <Text variant="hero" color={colors.white} style={{ marginTop: 8 }}>
              {home.heroSlides[0]?.title || t('home.heroFallback')}
            </Text>
          </Animated.View>
        </View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.actionsCard}>
          {actionsGrid.map((action) => (
            <PressableScale key={action.id} onPress={() => router.push(action.href)} style={styles.action} accessibilityRole="button" accessibilityLabel={t(`home.actions.${action.id}`)}>
              <View style={styles.actionIcon}>
                <Icon name={action.icon} size={22} color={colors.navy800} />
              </View>
              <Text variant="small" color={colors.ink} center numberOfLines={2} style={{ fontSize: 11.5, lineHeight: 14 }}>
                {t(`home.actions.${action.id}`)}
              </Text>
            </PressableScale>
          ))}
        </Animated.View>

        <OfflineNotice visible={data?.offline} style={{ marginHorizontal: space.xl, marginTop: space.lg }} />

        {/* Scripture of the day */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={{ paddingHorizontal: space.xl, marginTop: space.xxl }}>
          <LinearGradient colors={[colors.navy800, colors.navy950]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scripture}>
            <Icon name="sparkles" size={18} color={colors.gold300} />
            <Text variant="caption" color={colors.gold300} style={{ marginTop: 10 }}>
              {t('home.wordForToday')}
            </Text>
            <Text variant="quote" color={colors.white} style={{ marginTop: 8, fontSize: 22, lineHeight: 30 }}>
              “{t(`content.scriptures.${scripture}.text`)}”
            </Text>
            <Text variant="small" color={colors.gold200} style={{ marginTop: 10 }}>
              {t(`content.scriptures.${scripture}.ref`)}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Retreats */}
        <View style={{ marginTop: 36 }}>
          <SectionHeader
            eyebrow={upcoming.length ? t('home.retreatsUpcoming') : t('home.retreatsRecent')}
            title={t('home.retreatsTitle')}
            action={t('common.seeAll')}
            onAction={() => router.push('/retreats')}
          />
          {featured.length ? (
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + space.md}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.md, paddingBottom: space.lg }}
              renderItem={({ item }) => <RetreatFeatureCard retreat={item} width={cardWidth} />}
            />
          ) : null}
          {!upcoming.length ? (
            <Text variant="small" style={{ paddingHorizontal: space.xl }}>
              {t('home.retreatsEmpty')}
            </Text>
          ) : null}
        </View>

        {/* Mass intention promo */}
        <View style={{ paddingHorizontal: space.xl, marginTop: 28 }}>
          <PressableScale onPress={() => router.push('/mass-intention')} style={styles.promo} accessibilityRole="button" accessibilityLabel={t('home.massA11y')}>
            <Img uri={imagery.candles} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['rgba(10,20,38,0.92)', 'rgba(10,20,38,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={{ padding: space.xl, gap: 8, maxWidth: '78%' }}>
              <Text variant="caption" color={colors.gold300}>
                {t('home.massEyebrow')}
              </Text>
              <Text variant="title" color={colors.white}>
                {t('home.massTitle')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Text variant="smallStrong" color={colors.gold200}>
                  {t('home.massCta')}
                </Text>
                <Icon name="arrow-forward" size={14} color={colors.gold200} />
              </View>
            </View>
          </PressableScale>
        </View>

        {/* Bookshop */}
        {home.publications.length ? (
          <View style={{ marginTop: 36 }}>
            <SectionHeader eyebrow={t('home.bookshopEyebrow')} title={t('home.bookshopTitle')} action={t('home.bookshopAction')} onAction={() => router.push('/shop')} />
            <FlatList
              horizontal
              data={home.publications}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.lg }}
              renderItem={({ item }) => <PublicationCard item={item} width={150} />}
            />
          </View>
        ) : null}

        {/* News */}
        {home.news.length ? (
          <View style={{ marginTop: 36 }}>
            <SectionHeader eyebrow={t('home.newsEyebrow')} title={t('home.newsTitle')} action={t('home.newsAction')} onAction={() => router.push('/news')} />
            <View style={{ paddingHorizontal: space.xl, gap: space.lg }}>
              <ArticleFeature article={home.news[0]} width={width - space.xl * 2} />
              {home.news.slice(1, 4).map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Gallery */}
        {home.gallery.length ? (
          <View style={{ marginTop: 36 }}>
            <SectionHeader eyebrow={t('home.galleryEyebrow')} title={t('home.galleryTitle')} action={t('home.galleryAction')} onAction={() => router.push('/gallery')} />
            <FlatList
              horizontal
              data={home.gallery}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.sm }}
              renderItem={({ item, index }) => (
                <PressableScale onPress={() => router.push('/gallery')} accessibilityLabel={item.title}>
                  <Img uri={item.src} style={{ width: index % 3 === 0 ? 200 : 130, height: 160, borderRadius: radius.lg }} />
                </PressableScale>
              )}
            />
          </View>
        ) : null}

        {/* Testimonial */}
        {quote ? (
          <View style={{ paddingHorizontal: space.xl, marginTop: 36 }}>
            <Card style={{ padding: space.xl }}>
              <Icon name="chatbox-ellipses-outline" size={22} color={colors.gold500} />
              <Text variant="quote" style={{ marginTop: space.md }}>
                “{quote.quote}”
              </Text>
              <View style={styles.quoteFooter}>
                <Img uri={quote.imageUrl} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text variant="smallStrong">{quote.name}</Text>
                  <Text variant="small">{quote.role}</Text>
                </View>
                {home.testimonials.length > 1 ? (
                  <RoundButton icon="arrow-forward" tone="solid" label={t('home.nextTestimonial')} onPress={() => setTestimonial((value) => value + 1)} />
                ) : null}
              </View>
            </Card>
          </View>
        ) : null}

        {/* Visit */}
        <View style={{ paddingHorizontal: space.xl, marginTop: 36 }}>
          <Card style={{ padding: space.xl, gap: space.md }}>
            <Text variant="caption">{t('home.visit')}</Text>
            <Text variant="heading">{home.site.name}</Text>
            <Text variant="small">
              {home.site.contact.address} · {home.site.contact.postal}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
              <Button label={t('common.directions')} icon="navigate-outline" size="md" variant="primary" style={{ flex: 1 }} onPress={() => Linking.openURL(home.site.contact.mapsHref)} />
              <Button label={t('common.call')} icon="call-outline" size="md" variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(home.site.contact.phoneHref)} />
            </View>
          </Card>
        </View>
      </Animated.ScrollView>

      {/* Compact bar */}
      <Animated.View pointerEvents="none" style={[styles.bar, { height: insets.top + 52 }, bar]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(251,249,245,0.97)' }]} />
        )}
        <View style={{ position: 'absolute', top: insets.top + 12, left: 0, right: 0, alignItems: 'center' }}>
          <Text variant="subtitle" style={{ letterSpacing: 2 }}>
            DMRC
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTop: { position: 'absolute', left: space.xl, right: space.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroCopy: { position: 'absolute', left: space.xl, right: space.xl, bottom: 72 },
  actionsCard: {
    marginTop: -48,
    marginHorizontal: space.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: space.lg,
    ...shadow.lift,
  },
  action: { width: '25%', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.gold50,
    borderWidth: 1,
    borderColor: colors.gold100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scripture: { borderRadius: radius.xxl, padding: space.xxl, overflow: 'hidden' },
  promo: { height: 190, borderRadius: radius.xxl, overflow: 'hidden', justifyContent: 'center', backgroundColor: colors.navy900 },
  quoteFooter: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
