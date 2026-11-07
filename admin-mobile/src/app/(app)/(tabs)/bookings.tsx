import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';

import {
  Avatar,
  confirm,
  ErrorState,
  FilterChips,
  IconButton,
  ListSkeleton,
  SearchField,
  Sheet,
  SheetOption,
  StatusPill,
  TabHeader,
  toast,
} from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { Icon, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useDebounced } from '@/lib/hooks';
import { invalidateBookings, useBookings } from '@/lib/queries';
import { useCan } from '@/lib/session';
import type { BookingRow } from '@/lib/types';
import { colors, fonts, radius, shadow, space, TAB_BAR_SPACE } from '@/theme';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rescheduled' | 'cancelled' | 'unpaid' | 'arrived';

const BULK = [
  { action: 'approve', label: 'Approve', icon: 'checkmark-circle-outline' },
  { action: 'mark_paid', label: 'Mark paid', icon: 'cash-outline' },
  { action: 'check_in', label: 'Check in', icon: 'enter-outline' },
  { action: 'cancel', label: 'Cancel', icon: 'close-circle-outline' },
] as const;

export default function Bookings() {
  const params = useLocalSearchParams<{ status?: string; retreatId?: string }>();
  const canEdit = useCan('retreats', 'edit');
  const client = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>((params.status as StatusFilter) || 'all');
  const [retreatId, setRetreatId] = useState(params.retreatId ?? 'all');
  const [search, setSearch] = useState('');
  const [picker, setPicker] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const q = useDebounced(search.trim());

  // Links from Home or a retreat set the filters; apply them when they change.
  const paramKey = `${params.status ?? ''}|${params.retreatId ?? ''}`;
  const [appliedKey, setAppliedKey] = useState(paramKey);
  if (paramKey !== appliedKey) {
    setAppliedKey(paramKey);
    if (params.status) setStatus(params.status as StatusFilter);
    if (params.retreatId) setRetreatId(params.retreatId);
  }

  const filters: Record<string, string> = {
    retreatId,
    q,
    ...(status === 'unpaid' ? { payment: 'pending' } : status === 'arrived' ? { attended: 'yes' } : { status }),
  };
  const query = useBookings(filters);
  const first = query.data?.pages[0];
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  const summary = first?.summary;
  const retreats = first?.retreats ?? [];
  const retreatTitle = retreats.find((retreat) => retreat.id === retreatId)?.title;
  const selecting = selected.size > 0;

  const bulk = useMutation({
    mutationFn: (action: string) => api<{ data: { updated: number; skipped: number } }>('/api/admin/bookings/bulk', { method: 'POST', body: { action, ids: [...selected] } }),
    onSuccess: (response, action) => {
      const label = BULK.find((item) => item.action === action)?.label ?? 'Updated';
      toast(`${label}: ${response.data.updated} booking${response.data.updated === 1 ? '' : 's'}${response.data.skipped ? ` (${response.data.skipped} skipped)` : ''}`);
      setSelected(new Set());
      invalidateBookings(client);
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const toggle = (id: string) => {
    haptic.select();
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (action: (typeof BULK)[number]['action']) => {
    if (action === 'cancel' && !(await confirm('Cancel bookings?', `Cancel ${selected.size} booking${selected.size === 1 ? '' : 's'}? Guests keep their record but lose their place.`, 'Cancel bookings', true))) return;
    bulk.mutate(action);
  };

  const chips = [
    { value: 'all' as const, label: 'All', count: summary?.all },
    { value: 'pending' as const, label: 'To approve', count: summary?.status.pending ?? 0 },
    { value: 'approved' as const, label: 'Approved', count: summary?.status.approved ?? 0 },
    { value: 'unpaid' as const, label: 'Unpaid', count: summary?.payment.pending ?? 0 },
    { value: 'arrived' as const, label: 'Checked in', count: summary?.checkedIn ?? 0 },
    { value: 'rescheduled' as const, label: 'Rescheduled', count: summary?.status.rescheduled ?? 0 },
    { value: 'cancelled' as const, label: 'Cancelled', count: summary?.status.cancelled ?? 0 },
  ];

  const renderItem = ({ item }: { item: BookingRow }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        onPress={() => (selecting ? toggle(item.id) : router.push({ pathname: '/booking/[id]', params: { id: item.id } }))}
        onLongPress={canEdit ? () => toggle(item.id) : undefined}
        delayLongPress={280}
        style={({ pressed }) => [styles.row, isSelected && styles.rowSelected, pressed && !isSelected && { backgroundColor: colors.navy50 }]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityHint={canEdit ? 'Long press to select several bookings' : undefined}>
        {selecting ? (
          <View style={[styles.check, isSelected && styles.checkOn]}>{isSelected ? <Icon name="checkmark" size={16} color={colors.white} /> : null}</View>
        ) : (
          <Avatar name={item.fullName} size={42} />
        )}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {item.fullName}
            </Text>
            {item.partySize > 1 ? (
              <View style={styles.party}>
                <Icon name="people" size={11} color={colors.navy600} />
                <Text style={styles.partyText}>{item.partySize}</Text>
              </View>
            ) : null}
            <Text variant="small" style={{ fontSize: 11.5, marginLeft: 'auto', paddingLeft: space.sm }}>
              {relativeTime(item.createdAt)}
            </Text>
          </View>
          <Text variant="small" numberOfLines={1}>
            {item.retreatTitle}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <StatusPill status={item.status} />
            {item.status !== 'cancelled' ? <StatusPill status={item.paymentStatus} label={item.paymentStatus === 'pending' ? 'unpaid' : item.paymentStatus} /> : null}
            {item.attended ? <StatusPill status="checked in" /> : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TabHeader
        eyebrow={summary ? `${summary.all} bookings` : 'Retreats'}
        title="Bookings"
        right={<IconButton icon="options-outline" label="Choose retreat" onPress={() => setPicker(true)} badge={retreatId !== 'all' ? 1 : undefined} />}
      />
      <View style={{ paddingHorizontal: space.xl, gap: space.md, marginBottom: space.md }}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Name, phone, email or ticket" />
        {retreatTitle ? (
          <Animated.View entering={FadeIn} style={styles.scope}>
            <Icon name="leaf" size={14} color={colors.gold600} />
            <Text variant="smallStrong" style={{ flex: 1 }} numberOfLines={1}>
              {retreatTitle}
            </Text>
            <Pressable onPress={() => setRetreatId('all')} hitSlop={10} accessibilityLabel="Show all retreats">
              <Icon name="close" size={16} color={colors.muted} />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
      <View style={{ marginBottom: space.md }}>
        <FilterChips options={chips} value={status} onChange={setStatus} />
      </View>

      {query.isLoading ? (
        <ListSkeleton rows={7} />
      ) : query.error && !rows.length ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + (selecting ? 90 : space.lg) }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          ListEmptyComponent={<EmptyState icon="ticket-outline" title="No bookings here" body={q ? 'Nothing matches your search.' : 'Bookings that match this filter will show here.'} />}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold500} style={{ margin: space.xl }} /> : undefined}
          initialNumToRender={12}
          windowSize={9}
          removeClippedSubviews
        />
      )}

      {selecting ? (
        <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOutDown} style={[styles.bulk, shadow.lift]}>
          <View style={styles.bulkHeader}>
            <Text variant="smallStrong" color={colors.white} style={{ flex: 1 }}>
              {selected.size} selected
            </Text>
            <Pressable onPress={() => setSelected(new Set(rows.map((row) => row.id)))} hitSlop={8}>
              <Text variant="smallStrong" color={colors.gold300}>
                Select all
              </Text>
            </Pressable>
            <Pressable onPress={() => setSelected(new Set())} hitSlop={8} accessibilityLabel="Clear selection">
              <Icon name="close" size={20} color={colors.navy200} />
            </Pressable>
          </View>
          <View style={styles.bulkActions}>
            {BULK.map((item) => (
              <Pressable key={item.action} onPress={() => runBulk(item.action)} disabled={bulk.isPending} style={({ pressed }) => [styles.bulkButton, pressed && { opacity: 0.7 }]}>
                {bulk.isPending && bulk.variables === item.action ? (
                  <ActivityIndicator color={colors.gold300} size="small" />
                ) : (
                  <Icon name={item.icon} size={20} color={item.action === 'cancel' ? '#ff9c92' : colors.gold300} />
                )}
                <Text style={styles.bulkLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      ) : null}

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Filter by retreat">
        <SheetOption
          label="All retreats"
          icon="albums-outline"
          selected={retreatId === 'all'}
          onPress={() => {
            setRetreatId('all');
            setPicker(false);
          }}
        />
        {retreats.map((retreat) => (
          <SheetOption
            key={retreat.id}
            label={retreat.title}
            description={`${retreat.dateRange} · ${retreat.status}`}
            selected={retreatId === retreat.id}
            onPress={() => {
              setRetreatId(retreat.id);
              setPicker(false);
            }}
          />
        ))}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 14, backgroundColor: colors.ivory, alignItems: 'center' },
  rowSelected: { backgroundColor: colors.gold50 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.xl + 42 + space.md },
  check: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.navy200, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  party: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.navy50 },
  partyText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.navy600 },
  scope: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.gold50,
    borderWidth: 1,
    borderColor: colors.gold100,
  },
  bulk: { position: 'absolute', left: 16, right: 16, bottom: TAB_BAR_SPACE - 10, borderRadius: 24, backgroundColor: colors.navy950, padding: space.md, gap: space.sm },
  bulkHeader: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: space.xs },
  bulkActions: { flexDirection: 'row', gap: space.sm },
  bulkButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
  bulkLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white },
});
