import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Avatar, ErrorState, FilterChips, IconButton, ListSkeleton, SearchField, StackHeader, StatusPill } from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { labelOf, leaveRange, MEMBER_TYPES } from '@/lib/people';
import { useCan } from '@/lib/session';
import type { Member } from '@/lib/types';
import { colors, space } from '@/theme';

type MembersResponse = { data: Member[]; counts: Record<string, number>; awayToday: number };

export default function Members() {
  const canEdit = useCan('members', 'edit');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const query = useQuery({
    queryKey: ['members', type, q],
    queryFn: ({ signal }) => api<MembersResponse>(`/api/admin/members?type=${type}&status=all${q ? `&q=${encodeURIComponent(q)}` : ''}`, { signal }),
  });
  const counts = query.data?.counts ?? {};
  const rows = query.data?.data ?? [];

  return (
    <View style={{ flex: 1 }}>
      <StackHeader
        title="Members"
        subtitle={query.data ? `${Object.values(counts).reduce((a, b) => a + b, 0)} active · ${query.data.awayToday} away today` : 'Priests, religious, staff and volunteers'}
        right={canEdit ? <IconButton icon="person-add" label="Add member" tone="dark" onPress={() => router.push('/member/edit')} /> : null}
      />
      <View style={{ paddingHorizontal: space.xl, marginBottom: space.md }}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Name, role, department or phone" />
      </View>
      <View style={{ marginBottom: space.md }}>
        <FilterChips value={type} onChange={setType} options={[{ value: 'all', label: 'Everyone' }, ...MEMBER_TYPES.map((item) => ({ value: item.value, label: item.label, count: counts[item.value] ?? 0 }))]} />
      </View>
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: '/member/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.navy50 }]}>
              <Avatar name={item.fullName} size={44} tone={item.memberType === 'priest' || item.memberType === 'religious' ? 'gold' : 'navy'} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.fullName}
                </Text>
                <Text variant="small" numberOfLines={1}>
                  {[item.position || labelOf(MEMBER_TYPES, item.memberType), item.department].filter(Boolean).join(' · ')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                  {item.awayUntil ? <StatusPill status="away" tone="warning" label={`Away until ${leaveRange(item.awayUntil, item.awayUntil)}`} /> : null}
                  {item.status === 'inactive' ? <StatusPill status="inactive" /> : null}
                  {item.annualLeaveDays ? (
                    <Text variant="small" style={{ fontSize: 12 }}>
                      {Math.max(item.annualLeaveDays - item.annualLeaveUsed, 0)} of {item.annualLeaveDays} leave days left
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No members found" body={canEdit ? 'Tap + to add someone to the directory.' : undefined} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 13 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.xl + 44 + space.md },
});
