import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ErrorState, FilterChips, ListSkeleton, SearchField, SegmentTabs, StatusPill, TabHeader } from '@/components/admin';
import { MonthBars } from '@/components/charts';
import { EmptyState } from '@/components/feedback';
import { Card, Icon, Text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { compactTZS, formatDate, formatTZS, relativeTime } from '@/lib/format';
import { useDebounced } from '@/lib/hooks';
import { useRecords } from '@/lib/queries';
import { useCan } from '@/lib/session';
import type { Donation, MassIntention } from '@/lib/types';
import { colors, fonts, radius, space, TAB_BAR_SPACE } from '@/theme';

type Tab = 'donations' | 'mass-intentions';

const METHOD: Record<string, string> = { mpesa: 'M-Pesa', 'm-pesa': 'M-Pesa', tigopesa: 'Tigo Pesa', airtel: 'Airtel Money', card: 'Card', bank: 'Bank transfer', cash: 'Cash' };
const method = (value: string) => METHOD[value.toLowerCase()] ?? value;

export default function Giving() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const canDonations = useCan('donations');
  const canIntentions = useCan('mass-intentions');
  const [tab, setTab] = useState<Tab>(params.tab ?? (canDonations ? 'donations' : 'mass-intentions'));

  const [appliedTab, setAppliedTab] = useState(params.tab);
  if (params.tab !== appliedTab) {
    setAppliedTab(params.tab);
    if (params.tab) setTab(params.tab);
  }

  const tabs = [
    canDonations && { value: 'donations' as const, label: 'Donations' },
    canIntentions && { value: 'mass-intentions' as const, label: 'Mass intentions' },
  ].filter(Boolean) as { value: Tab; label: string }[];

  return (
    <View style={{ flex: 1 }}>
      <TabHeader eyebrow="Giving" title={tab === 'donations' ? 'Donations' : 'Intentions'} />
      {tabs.length > 1 ? <SegmentTabs options={tabs} value={tab} onChange={setTab} style={{ marginHorizontal: space.xl, marginBottom: space.md }} /> : null}
      {tab === 'donations' && canDonations ? <DonationsList /> : null}
      {tab === 'mass-intentions' && canIntentions ? <IntentionsList /> : null}
    </View>
  );
}

function DonationsList() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const filters: Record<string, string> = { q, ...(['pending', 'paid', 'failed', 'refunded'].includes(status) ? { payment: status } : { status }) };
  const query = useRecords<Donation>('donations', filters);
  const first = query.data?.pages[0];
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  const giving = first?.summary.giving;

  const header = (
    <View style={{ gap: space.md, marginBottom: space.md }}>
      {giving ? (
        <Animated.View entering={FadeIn} style={{ paddingHorizontal: space.xl, gap: space.md }}>
          <Card style={styles.hero}>
            <Text variant="caption" color={colors.gold300}>
              This month
            </Text>
            <Text style={styles.heroValue}>{formatTZS(giving.thisMonth)}</Text>
            <Text variant="small" color={colors.navy200}>
              {giving.lastMonth ? `${giving.thisMonth >= giving.lastMonth ? '▲' : '▼'} vs ${compactTZS(giving.lastMonth)} last month` : 'Paid gifts only'} · {compactTZS(giving.thisYear)} this year
            </Text>
            <View style={{ marginTop: space.lg }}>
              <MonthBars data={giving.months.slice(-6)} height={90} dark />
            </View>
          </Card>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Card style={{ flex: 1, gap: 2 }}>
              <Text variant="small">Awaiting payment</Text>
              <Text variant="subtitle">{compactTZS(giving.pendingTotal)}</Text>
              <Text variant="small" style={{ fontSize: 12 }}>
                {giving.pendingCount} gifts
              </Text>
            </Card>
            <Card style={{ flex: 1, gap: 2 }}>
              <Text variant="small">Top method</Text>
              <Text variant="subtitle" numberOfLines={1}>
                {giving.byMethod[0] ? method(giving.byMethod[0].method) : '—'}
              </Text>
              <Text variant="small" style={{ fontSize: 12 }}>
                {giving.byMethod[0] ? compactTZS(giving.byMethod[0].total) : 'No paid gifts yet'}
              </Text>
            </Card>
          </View>
        </Animated.View>
      ) : null}
      <View style={{ paddingHorizontal: space.xl }}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Donor, phone or intention" />
      </View>
      <FilterChips
        value={status}
        onChange={setStatus}
        options={[
          { value: 'all', label: 'All' },
          { value: 'new', label: 'New', count: first?.summary.status.new ?? 0 },
          { value: 'pending', label: 'Unpaid' },
          { value: 'paid', label: 'Paid' },
          { value: 'acknowledged', label: 'Thanked', count: first?.summary.status.acknowledged ?? 0 },
          { value: 'archived', label: 'Archived', count: first?.summary.status.archived ?? 0 },
        ]}
      />
    </View>
  );

  if (query.isLoading) return <ListSkeleton rows={7} />;
  if (query.error && !rows.length) return <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: '/record/[kind]/[id]', params: { kind: 'donations', id: item.id } })} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.badge, { backgroundColor: colors.gold50 }]}>
            <Icon name="heart" size={18} color={colors.gold600} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {item.fullName}
            </Text>
            <Text variant="small" numberOfLines={1}>
              {method(item.paymentMethod)} · {relativeTime(item.createdAt)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
              <StatusPill status={item.paymentStatus} label={item.paymentStatus === 'pending' ? 'unpaid' : item.paymentStatus} />
              {item.status !== 'acknowledged' ? <StatusPill status={item.status} /> : null}
            </View>
          </View>
          <Text style={styles.amount}>{formatTZS(item.amount)}</Text>
        </Pressable>
      )}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + space.lg }}
      onEndReachedThreshold={0.4}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
      ListEmptyComponent={<EmptyState icon="heart-outline" title="No gifts here" body="Donations that match this filter will show here." />}
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold500} style={{ margin: space.xl }} /> : undefined}
      removeClippedSubviews
    />
  );
}

function IntentionsList() {
  const [status, setStatus] = useState('new');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const query = useRecords<MassIntention>('mass-intentions', { q, status });
  const first = query.data?.pages[0];
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  const upcoming = first?.summary.upcoming ?? [];
  const counts = first?.summary.status ?? {};

  const header = (
    <View style={{ gap: space.md, marginBottom: space.md }}>
      {upcoming.length ? (
        <View style={{ paddingHorizontal: space.xl }}>
          <Card style={styles.week}>
            <Text variant="caption" color={colors.gold300}>
              This week&apos;s Masses
            </Text>
            {upcoming.slice(0, 4).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/record/[kind]/[id]', params: { kind: 'mass-intentions', id: item.id } })}
                style={styles.weekRow}>
                <View style={styles.weekDate}>
                  <Text style={styles.weekDay}>{formatDate(item.scheduledFor, { weekday: 'short' })}</Text>
                  <Text style={styles.weekNum}>{formatDate(item.scheduledFor, { day: 'numeric' })}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" color={colors.white} numberOfLines={1}>
                    {item.intentionFor}
                  </Text>
                  <Text variant="small" color={colors.navy200} numberOfLines={1}>
                    {item.intentionType}
                    {item.celebrant ? ` · ${item.celebrant}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Card>
        </View>
      ) : null}
      <View style={{ paddingHorizontal: space.xl }}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Name or intention" />
      </View>
      <FilterChips
        value={status}
        onChange={setStatus}
        options={[
          { value: 'new', label: 'To schedule', count: counts.new ?? 0 },
          { value: 'scheduled', label: 'Scheduled', count: counts.scheduled ?? 0 },
          { value: 'celebrated', label: 'Celebrated', count: counts.celebrated ?? 0 },
          { value: 'cancelled', label: 'Cancelled', count: counts.cancelled ?? 0 },
          { value: 'all', label: 'All' },
        ]}
      />
    </View>
  );

  if (query.isLoading) return <ListSkeleton rows={7} />;
  if (query.error && !rows.length) return <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/record/[kind]/[id]', params: { kind: 'mass-intentions', id: item.id } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.badge, { backgroundColor: colors.navy50 }]}>
            <Icon name="flame" size={18} color={colors.navy600} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {item.intentionFor}
            </Text>
            <Text variant="small" numberOfLines={1}>
              {item.intentionType} · {item.numberOfMasses > 1 ? `${item.numberOfMasses} Masses · ` : ''}from {item.fullName}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'center' }}>
              <StatusPill status={item.status} />
              <Text variant="small" style={{ fontSize: 12 }}>
                {item.scheduledFor
                  ? formatDate(item.scheduledFor, { weekday: 'short', day: 'numeric', month: 'short' })
                  : item.preferredDate
                    ? `Prefers ${formatDate(item.preferredDate, { day: 'numeric', month: 'short' })}`
                    : relativeTime(item.createdAt)}
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={16} color={colors.subtle} />
        </Pressable>
      )}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + space.lg }}
      onEndReachedThreshold={0.4}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
      ListEmptyComponent={<EmptyState icon="flame-outline" title="Nothing here" body="Mass intentions that match this filter will show here." />}
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold500} style={{ margin: space.xl }} /> : undefined}
      removeClippedSubviews
    />
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy900, borderColor: colors.navy800, gap: 4 },
  heroValue: { fontFamily: fonts.bold, fontSize: 32, color: colors.white, letterSpacing: -0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 14 },
  pressed: { backgroundColor: colors.navy50 },
  badge: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  amount: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.xl + 42 + space.md },
  week: { backgroundColor: colors.navy900, borderColor: colors.navy800, gap: space.sm },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 },
  weekDate: { width: 46, height: 50, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  weekDay: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.gold300, textTransform: 'uppercase' },
  weekNum: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
});
