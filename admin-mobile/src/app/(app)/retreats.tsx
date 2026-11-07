import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ErrorState, FilterChips, ListSkeleton, StackHeader, StatusPill } from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { Icon, Img, PressableScale, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { keys } from '@/lib/queries';
import type { Retreat } from '@/lib/types';
import { colors, radius, shadow, space } from '@/theme';

export default function Retreats() {
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const query = useQuery({
    queryKey: keys.retreats,
    queryFn: ({ signal }) => api<{ data: Retreat[] }>('/api/retreats', { signal }).then((r) => r.data),
  });
  const all = query.data ?? [];
  const rows = all.filter((retreat) => (filter === 'all' ? true : filter === 'open' ? retreat.status !== 'Closed' : retreat.status === 'Closed'));

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title="Retreats" subtitle={`${all.length} sessions`} />
      <View style={{ marginBottom: space.md }}>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: 'Open & waitlist', count: all.filter((retreat) => retreat.status !== 'Closed').length },
            { value: 'closed', label: 'Closed', count: all.filter((retreat) => retreat.status === 'Closed').length },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 40, gap: space.md }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          renderItem={({ item }) => (
            <PressableScale onPress={() => router.push({ pathname: '/retreat/[id]', params: { id: item.id } })} style={styles.card} scaleTo={0.98}>
              <Img uri={item.imageSrc} style={styles.image} />
              <View style={{ flex: 1, gap: 4, padding: space.md }}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.meta}>
                  <Icon name="calendar-outline" size={13} color={colors.muted} />
                  <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>
                    {item.dateRange}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 }}>
                  <StatusPill status={item.status} />
                  <Text variant="small" style={{ fontSize: 12 }}>
                    {item.availability.total ? `${item.availability.total} places` : 'No limit set'}
                  </Text>
                </View>
              </View>
            </PressableScale>
          )}
          ListEmptyComponent={<EmptyState icon="leaf-outline" title="No retreats" body="Retreats you add on the web admin show up here." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.soft },
  image: { width: 104, minHeight: 112 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
