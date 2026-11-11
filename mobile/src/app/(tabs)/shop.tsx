import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PublicationCard } from '@/components/cards';
import { EmptyState, OfflineNotice } from '@/components/feedback';
import { RoundButton } from '@/components/headers';
import { SearchBar } from '@/components/SearchBar';
import { TabHeader } from '@/components/TabHeader';
import { Chip } from '@/components/ui';
import { useT } from '@/i18n';
import { useCatalogue } from '@/lib/api';
import { cartCount, useAppStore } from '@/lib/store';
import { colors, space, TAB_BAR_SPACE } from '@/theme';

const sorts = ['featured', 'priceLow', 'priceHigh', 'newest'] as const;
const ALL = '__all__';

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const t = useT();
  const { data, refetch, isRefetching } = useCatalogue();
  const cart = useAppStore((s) => cartCount(s.cart));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState<(typeof sorts)[number]>('featured');
  const items = useMemo(() => data?.data.items ?? [], [data]);
  // [value, label]: filtering uses the English category, the chip shows the translated label.
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.category, item.categoryLabel ?? item.category));
    return [[ALL, t('shop.all')] as const, ...map.entries()];
  }, [items, t]);
  const columnWidth = (width - space.xl * 2 - space.lg) / 2;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = items.filter(
      (item) =>
        (category === ALL || item.category === category) &&
        (!term || [item.title, item.author, item.subtitle, item.category, item.categoryLabel].some((value) => value?.toLowerCase().includes(term))),
    );
    if (sort === 'priceLow') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'priceHigh') return [...list].sort((a, b) => b.price - a.price);
    if (sort === 'newest') return [...list].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
    return list;
  }, [items, category, query, sort]);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.ivory }}
      data={filtered}
      numColumns={2}
      keyExtractor={(item) => item.id}
      columnWrapperStyle={{ gap: space.lg, paddingHorizontal: space.xl }}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE, gap: space.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.gold500} />}
      ListHeaderComponent={
        <View style={{ gap: space.md }}>
          <TabHeader eyebrow={t('shop.eyebrow')} title={t('shop.title')} right={<RoundButton icon="bag-outline" tone="solid" label={t('shop.cart')} badge={cart} onPress={() => router.push('/cart')} />}>
            <SearchBar value={query} onChange={setQuery} placeholder={t('shop.search')} />
          </TabHeader>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.sm }}>
            {categories.map(([value, label]) => (
              <Chip key={value} label={label} active={category === value} onPress={() => setCategory(value)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.sm }}>
            {sorts.map((value) => (
              <Chip key={value} label={t(`shop.sorts.${value}`)} icon={value === sort ? 'swap-vertical' : undefined} active={sort === value} onPress={() => setSort(value)} />
            ))}
          </ScrollView>
          <OfflineNotice visible={data?.offline} style={{ marginHorizontal: space.xl }} />
        </View>
      }
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).springify()}>
          <PublicationCard item={item} width={columnWidth} />
        </Animated.View>
      )}
      ListEmptyComponent={<EmptyState icon="book-outline" title={t('shop.emptyTitle')} body={t('shop.emptyText')} />}
    />
  );
}
