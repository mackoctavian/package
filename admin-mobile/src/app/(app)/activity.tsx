import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ErrorState, FilterChips, ListSkeleton, StackHeader } from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { Icon, type IconName, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/format';
import type { ActivityEntry, Paged } from '@/lib/types';
import { colors, space } from '@/theme';

const ICONS: Record<string, IconName> = {
  signed_in: 'log-in-outline',
  signed_out: 'log-out-outline',
  checked_in: 'enter-outline',
  approved: 'checkmark-circle-outline',
  cancelled: 'close-circle-outline',
  deleted: 'trash-outline',
  invited: 'person-add-outline',
  created: 'add-circle-outline',
  deactivated: 'pause-circle-outline',
  reactivated: 'play-circle-outline',
};

const ENTITIES = [
  { value: 'all', label: 'Everything' },
  { value: 'booking', label: 'Bookings' },
  { value: 'donations', label: 'Donations' },
  { value: 'mass-intentions', label: 'Intentions' },
  { value: 'admin_user', label: 'Team' },
  { value: 'session', label: 'Sign-ins' },
];

export default function Activity() {
  const [entity, setEntity] = useState('all');
  const query = useInfiniteQuery({
    queryKey: ['activity', entity],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => api<Paged<ActivityEntry>>(`/api/mobile/admin/activity?page=${pageParam}${entity !== 'all' ? `&entity=${entity}` : ''}`, { signal }),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title="Activity log" subtitle="Who did what, and when" />
      <View style={{ marginBottom: space.md }}>
        <FilterChips value={entity} onChange={setEntity} options={ENTITIES} />
      </View>
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.error && !rows.length ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const day = formatDate(item.createdAt, { weekday: 'long', day: 'numeric', month: 'long' });
            const showDay = index === 0 || formatDate(rows[index - 1].createdAt, { weekday: 'long', day: 'numeric', month: 'long' }) !== day;
            return (
              <View>
                {showDay ? (
                  <Text variant="caption" style={styles.day}>
                    {day}
                  </Text>
                ) : null}
                <View style={styles.row}>
                  <View style={styles.icon}>
                    <Icon name={ICONS[item.action] ?? 'create-outline'} size={16} color={colors.navy600} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="body" style={{ fontSize: 14, lineHeight: 20 }}>
                      {item.summary}
                    </Text>
                    <Text variant="small" style={{ fontSize: 12 }}>
                      {item.actorName ?? 'System'} · {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          ListEmptyComponent={<EmptyState icon="pulse-outline" title="Nothing yet" body="Changes made by the team show up here." />}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold500} style={{ margin: space.xl }} /> : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  day: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.sm },
  row: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
