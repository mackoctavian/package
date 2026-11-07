import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Avatar, ErrorState, FilterChips, ListSkeleton, SearchField, StackHeader } from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { Text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import { useRecords } from '@/lib/queries';
import type { Message } from '@/lib/types';
import { colors, fonts, space } from '@/theme';

export default function Inbox() {
  const [status, setStatus] = useState('new');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const query = useRecords<Message>('feedback', { status, q });
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  const counts = query.data?.pages[0]?.summary.status ?? {};

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title="Inbox" subtitle={counts.new ? `${counts.new} unread` : 'Contact form messages'} />
      <View style={{ paddingHorizontal: space.xl, marginBottom: space.md }}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Name, email or words in the message" />
      </View>
      <View style={{ marginBottom: space.md }}>
        <FilterChips
          value={status}
          onChange={setStatus}
          options={[
            { value: 'new', label: 'Unread', count: counts.new ?? 0 },
            { value: 'read', label: 'Read', count: counts.read ?? 0 },
            { value: 'replied', label: 'Replied', count: counts.replied ?? 0 },
            { value: 'archived', label: 'Archived', count: counts.archived ?? 0 },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.error && !rows.length ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const name = `${item.firstName} ${item.lastName}`.trim();
            const unread = item.status === 'new';
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/record/[kind]/[id]', params: { kind: 'feedback', id: item.id } })}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.navy50 }]}>
                <View>
                  <Avatar name={name} size={44} />
                  {unread ? <View style={styles.dot} /> : null}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, fontFamily: unread ? fonts.bold : fonts.semibold }}>
                      {name}
                    </Text>
                    <Text variant="small" style={{ fontSize: 12 }}>
                      {relativeTime(item.createdAt)}
                    </Text>
                  </View>
                  <Text variant="small" numberOfLines={2} color={unread ? colors.text : colors.muted}>
                    {item.message}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          ListEmptyComponent={<EmptyState icon="mail-open-outline" title={status === 'new' ? 'Inbox zero' : 'No messages'} body={status === 'new' ? 'Every message has been read.' : undefined} />}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold500} style={{ margin: space.xl }} /> : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 14, alignItems: 'flex-start' },
  dot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold400, borderWidth: 2, borderColor: colors.ivory },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.xl + 44 + space.md },
});
