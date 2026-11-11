import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { RetreatListCard } from '@/components/cards';
import { EmptyState, OfflineNotice, Skeleton } from '@/components/feedback';
import { Segmented } from '@/components/form';
import { RoundButton } from '@/components/headers';
import { SearchBar } from '@/components/SearchBar';
import { TabHeader } from '@/components/TabHeader';
import { Chip, Icon, PressableScale, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { useRetreats } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { colors, radius, space, TAB_BAR_SPACE } from '@/theme';

const segments = ['upcoming', 'past'] as const;

export default function RetreatsScreen() {
  const t = useT();
  const { data, isPending, refetch, isRefetching } = useRetreats();
  const tickets = useAppStore((s) => s.tickets.length);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [segment, setSegment] = useState<(typeof segments)[number]>('upcoming');
  const retreats = useMemo(() => data?.data ?? [], [data]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    retreats.forEach((retreat) => map.set(retreat.category, retreat.categoryLabel));
    return [...map.entries()];
  }, [retreats]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return retreats.filter((retreat) => {
      if ((segment === 'upcoming') === retreat.ended) return false;
      if (category !== 'all' && retreat.category !== category) return false;
      if (!term) return true;
      return [retreat.title, retreat.speaker, retreat.location, retreat.categoryLabel].some((value) => value?.toLowerCase().includes(term));
    });
  }, [retreats, query, category, segment]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE, gap: space.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.gold500} />}
        ListHeaderComponent={
          <View style={{ gap: space.lg }}>
            <TabHeader
              eyebrow={t('retreats.eyebrow')}
              title={t('retreats.title')}
              right={<RoundButton icon="ticket-outline" tone="solid" label={t('tickets.title')} badge={tickets} onPress={() => router.push('/tickets')} />}>
              <SearchBar value={query} onChange={setQuery} placeholder={t('retreats.search')} />
              <Segmented options={segments} value={segment} onChange={setSegment} labelFor={(option) => t(`retreats.${option}`)} />
            </TabHeader>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.sm }}>
              <Chip label={t('retreats.all')} active={category === 'all'} onPress={() => setCategory('all')} />
              {categories.map(([value, label]) => (
                <Chip key={value} label={label} active={category === value} onPress={() => setCategory(value)} />
              ))}
            </ScrollView>
            <OfflineNotice visible={data?.offline} style={{ marginHorizontal: space.xl }} />
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).springify()} layout={LinearTransition} style={{ paddingHorizontal: space.xl }}>
            <RetreatListCard retreat={item} />
          </Animated.View>
        )}
        ListEmptyComponent={
          isPending ? (
            <View style={{ paddingHorizontal: space.xl, gap: space.lg }}>
              <Skeleton style={{ height: 320, borderRadius: radius.xl }} />
              <Skeleton style={{ height: 320, borderRadius: radius.xl }} />
            </View>
          ) : (
            <EmptyState
              icon="calendar-outline"
              title={segment === 'upcoming' ? t('retreats.emptyUpcoming') : t('retreats.emptyPast')}
              body={segment === 'upcoming' ? t('retreats.emptyUpcomingText') : t('retreats.emptyPastText')}
              action={segment === 'upcoming' ? t('retreats.seePast') : undefined}
              onAction={() => setSegment('past')}
            />
          )
        }
        ListFooterComponent={
          <View style={{ paddingHorizontal: space.xl, marginTop: space.sm }}>
            <PressableScale onPress={() => router.push('/tickets')} style={styles.manage} accessibilityRole="button">
              <View style={styles.manageIcon}>
                <Icon name="qr-code-outline" size={22} color={colors.gold300} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" color={colors.white}>
                  {t('retreats.manage')}
                </Text>
                <Text variant="small" color={colors.navy200}>
                  {t('retreats.manageText')}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.navy200} />
            </PressableScale>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  manage: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.navy900 },
  manageIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
});
