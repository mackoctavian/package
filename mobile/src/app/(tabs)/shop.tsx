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
import { useCatalogue } from '@/lib/api';
import { cartCount, useAppStore } from '@/lib/store';
import { colors, space, TAB_BAR_SPACE } from '@/theme';

const sorts = ['Featured', 'Price: low', 'Price: high', 'Newest'] as const;

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const { data, refetch, isRefetching } = useCatalogue();
  const cart = useAppStore((s) => cartCount(s.cart));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<(typeof sorts)[number]>('Featured');
  const items = useMemo(() => data?.data.items ?? [], [data]);
  const categories = useMemo(() => ['All', ...new Set(items.map((item) => item.category))], [items]);
  const columnWidth = (width - space.xl * 2 - space.lg) / 2;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = items.filter(
      (item) =>
        (category === 'All' || item.category === category) &&
        (!term || [item.title, item.author, item.subtitle, item.category].some((value) => value?.toLowerCase().includes(term))),
    );
    if (sort === 'Price: low') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'Price: high') return [...list].sort((a, b) => b.price - a.price);
    if (sort === 'Newest') return [...list].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
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
          <TabHeader eyebrow="DMRC Publications" title="Bookshop" right={<RoundButton icon="bag-outline" tone="solid" label="Cart" badge={cart} onPress={() => router.push('/cart')} />}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search Bibles, books, CDs" />
          </TabHeader>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.sm }}>
            {categories.map((value) => (
              <Chip key={value} label={value} active={category === value} onPress={() => setCategory(value)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.sm }}>
            {sorts.map((value) => (
              <Chip key={value} label={value} icon={value === sort ? 'swap-vertical' : undefined} active={sort === value} onPress={() => setSort(value)} />
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
      ListEmptyComponent={<EmptyState icon="book-outline" title="Nothing found" body="Try another search or category." />}
    />
  );
}
