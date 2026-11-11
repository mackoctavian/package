import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { PublicationCard } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { QuantityStepper } from '@/components/form';
import { ParallaxScreen, RoundButton, ScreenHeader } from '@/components/headers';
import { Badge, Button, Card, Icon, Img, SectionHeader, Text } from '@/components/ui';
import { useCatalogue } from '@/lib/api';
import { useFormat, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { actions, cartCount, useAppStore } from '@/lib/store';
import { colors, radius, shadow, space } from '@/theme';

export default function PublicationDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = useT();
  const { money, date } = useFormat();
  const { data } = useCatalogue();
  const cart = useAppStore((s) => cartCount(s.cart));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const catalogue = data?.data;
  const item = catalogue?.items.find((entry) => entry.slug === slug);

  if (!item || !catalogue) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={t('shop.title')} />
        <EmptyState icon="book-outline" title={t('shop.notFound')} action={t('shop.backToShop')} onAction={() => router.replace('/shop')} />
      </View>
    );
  }

  const related = catalogue.items.filter((entry) => entry.id !== item.id && entry.category === item.category).slice(0, 6);
  const inStock = item.inStock !== false;
  const add = () => {
    actions.addToCart({ id: item.id, slug: item.slug, title: item.title, coverImage: item.coverImage, price: item.price }, quantity, catalogue.maxQuantity);
    haptic.success();
    setAdded(true);
  };

  return (
    <>
      <StatusBar style="light" />
      <ParallaxScreen
        image={item.coverImage}
        title={item.title}
        heroHeight={420}
        right={<RoundButton icon="bag-outline" label={t('shop.cart')} badge={cart} onPress={() => router.push('/cart')} />}
        hero={
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.lg }}>
            <Animated.View entering={ZoomIn.springify()} style={[styles.cover, shadow.lift]}>
              <Img uri={item.coverImage} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <Badge label={item.categoryLabel ?? item.category} tone="light" />
                {item.badge ? <Badge label={item.badge} /> : null}
              </View>
              <Text variant="title" color={colors.white} numberOfLines={3}>
                {item.title}
              </Text>
              <Text variant="small" color={colors.navy100}>
                {item.author}
              </Text>
            </View>
          </View>
        }
        footer={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            {added ? (
              <Button label={t('shop.viewCart')} icon="bag-check-outline" style={{ flex: 1 }} onPress={() => router.push('/cart')} />
            ) : (
              <>
                <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={catalogue.maxQuantity} compact />
                <Button label={inStock ? t('shop.add', { amount: money(item.price * quantity) }) : t('shop.outOfStock')} variant="gold" disabled={!inStock} style={{ flex: 1 }} onPress={add} />
              </>
            )}
          </View>
        }>
        <View style={{ paddingHorizontal: space.xl, gap: space.xl }}>
          <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text variant="display">{money(item.price)}</Text>
            {item.originalPrice && item.originalPrice > item.price ? (
              <Text variant="body" color={colors.subtle} style={{ textDecorationLine: 'line-through' }}>
                {money(item.originalPrice)}
              </Text>
            ) : null}
          </Animated.View>
          {item.subtitle ? <Text variant="quote">{item.subtitle}</Text> : null}
          <Text variant="body" style={{ fontSize: 16, lineHeight: 26 }}>
            {item.description}
          </Text>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[
              ['format', t('shop.format'), item.formatLabel ?? item.format],
              ['published', t('shop.published'), date(item.publishedOn, { month: 'short', year: 'numeric' })],
              ['availability', t('shop.availability'), inStock ? t('shop.inStock') : t('shop.soldOut')],
            ].map(([id, label, value]) => (
              <View key={id} style={{ alignItems: 'center', flex: 1, gap: 2 }}>
                <Text variant="small">{label}</Text>
                <Text variant="smallStrong" color={id === 'availability' && !inStock ? colors.danger : colors.ink}>
                  {value}
                </Text>
              </View>
            ))}
          </Card>
          <View style={styles.note}>
            <Icon name="cube-outline" size={18} color={colors.gold600} />
            <Text variant="small" style={{ flex: 1 }}>
              {t('shop.deliveryNote', { fee: money(catalogue.deliveryFee) })}
            </Text>
          </View>
        </View>
        {related.length ? (
          <View style={{ marginTop: 36 }}>
            <SectionHeader eyebrow={t('shop.youMayLike')} title={t('shop.more', { category: item.categoryLabel ?? item.category })} />
            <FlatList
              horizontal
              data={related}
              keyExtractor={(entry) => entry.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.lg }}
              renderItem={({ item: entry }) => <PublicationCard item={entry} width={140} />}
            />
          </View>
        ) : null}
      </ParallaxScreen>
    </>
  );
}

const styles = StyleSheet.create({
  cover: { width: 112, height: 156, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.navy700 },
  note: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.gold50, borderWidth: 1, borderColor: colors.gold100 },
});
