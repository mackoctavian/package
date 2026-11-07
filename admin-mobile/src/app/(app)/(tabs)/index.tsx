import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, ErrorState, Group, ListRow, Progress, RowDivider, StatTile, StatusPill, TabHeader } from '@/components/admin';
import { MonthBars } from '@/components/charts';
import { Skeleton } from '@/components/feedback';
import { Card, Icon, type IconName, Img, PressableScale, Text } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { compactTZS, firstName, formatDate, greeting, relativeTime } from '@/lib/format';
import { useOverview } from '@/lib/queries';
import { can, canScan, useSession } from '@/lib/session';
import { colors, radius, space, TAB_BAR_SPACE } from '@/theme';

type Href = Parameters<typeof router.push>[0];

export default function Home() {
  const user = useSession((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useOverview();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const attention = data
    ? ([
        data.can.retreats && data.stats.pendingBookings > 0 && { label: 'Bookings to approve', count: data.stats.pendingBookings, icon: 'ticket', href: { pathname: '/bookings', params: { status: 'pending' } } },
        data.can.intentions && data.stats.newIntentions > 0 && { label: 'Mass intentions to schedule', count: data.stats.newIntentions, icon: 'flame', href: { pathname: '/giving', params: { tab: 'mass-intentions' } } },
        data.can.donations && data.stats.newDonations > 0 && { label: 'New gifts to acknowledge', count: data.stats.newDonations, icon: 'heart', href: { pathname: '/giving', params: { tab: 'donations' } } },
        data.can.inbox && data.stats.unreadMessages > 0 && { label: 'Unread messages', count: data.stats.unreadMessages, icon: 'mail-unread', href: '/inbox' },
        data.can.leave && (data.stats.pendingLeave ?? 0) > 0 && { label: 'Leave to approve', count: data.stats.pendingLeave ?? 0, icon: 'airplane', href: '/leave' },
      ].filter(Boolean) as { label: string; count: number; icon: IconName; href: Href }[])
    : [];

  const quick = [
    canScan(user) && { label: 'Scan tickets', icon: 'qr-code-outline', href: '/scan' },
    can(user, 'retreats') && { label: 'Retreats', icon: 'leaf-outline', href: '/retreats' },
    can(user, 'publications') && { label: 'Publications', icon: 'book-outline', href: { pathname: '/content/[type]', params: { type: 'publications' } } },
    can(user, 'feedback') && { label: 'Inbox', icon: 'mail-outline', href: '/inbox' },
    can(user, 'news') && { label: 'News', icon: 'newspaper-outline', href: { pathname: '/content/[type]', params: { type: 'news' } } },
    can(user, 'members') && { label: 'Members', icon: 'people-circle-outline', href: '/members' },
    can(user, 'leave') && { label: 'Leave', icon: 'airplane-outline', href: '/leave' },
    can(user, 'team') && { label: 'Team', icon: 'people-outline', href: '/team' },
  ].filter(Boolean) as { label: string; icon: IconName; href: Href }[];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + space.lg }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.gold500} />}>
      <TabHeader
        eyebrow={`${greeting()} · ${today}`}
        title={firstName(user?.name ?? '')}
        right={
          <PressableScale onPress={() => router.push('/account')} accessibilityLabel="Your account">
            <Avatar name={user?.name ?? ''} size={44} tone="gold" />
          </PressableScale>
        }
      />

      <View style={{ paddingHorizontal: space.xl, gap: space.xxl }}>
        {quick.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} style={{ marginHorizontal: -space.xl }}>
            <View style={{ width: space.xl - space.sm }} />
            {quick.map((item) => (
              <PressableScale key={item.label} onPress={() => router.push(item.href)} style={styles.quick} accessibilityRole="button" accessibilityLabel={item.label}>
                <View style={styles.quickIcon}>
                  <Icon name={item.icon} size={20} color={colors.navy800} />
                </View>
                <Text variant="smallStrong">{item.label}</Text>
              </PressableScale>
            ))}
            <View style={{ width: space.xl - space.sm }} />
          </ScrollView>
        ) : null}

        {error && !data ? <ErrorState message={errorMessage(error)} onRetry={refetch} /> : null}

        {isLoading ? (
          <View style={{ gap: space.md }}>
            <Skeleton style={{ height: 96, borderRadius: radius.lg }} />
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Skeleton style={{ flex: 1, height: 120, borderRadius: radius.lg }} />
              <Skeleton style={{ flex: 1, height: 120, borderRadius: radius.lg }} />
            </View>
            <Skeleton style={{ height: 180, borderRadius: radius.lg }} />
          </View>
        ) : null}

        {data ? (
          <>
            {attention.length ? (
              <Animated.View entering={FadeInDown.duration(350)}>
                <Card padded={false} style={styles.attention}>
                  <View style={styles.attentionHeader}>
                    <Icon name="notifications" size={16} color={colors.gold300} />
                    <Text variant="caption" color={colors.gold300}>
                      Needs your attention
                    </Text>
                  </View>
                  {attention.map((item, index) => (
                    <PressableScale key={item.label} onPress={() => router.push(item.href)} style={[styles.attentionRow, index > 0 && styles.attentionDivider]} scaleTo={0.98}>
                      <Icon name={item.icon} size={18} color={colors.gold300} />
                      <Text variant="bodyStrong" color={colors.white} style={{ flex: 1 }}>
                        {item.label}
                      </Text>
                      <View style={styles.attentionCount}>
                        <Text variant="smallStrong" color={colors.navy950}>
                          {item.count}
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={16} color={colors.navy300} />
                    </PressableScale>
                  ))}
                </Card>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.duration(350)} style={styles.allClear}>
                <Icon name="checkmark-done-circle" size={22} color={colors.success} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  All caught up. Nothing is waiting on you.
                </Text>
              </Animated.View>
            )}

            <View style={styles.grid}>
              {data.can.retreats ? (
                <StatTile label="Bookings" hint="Last 30 days" value={data.stats.bookings30} icon="ticket-outline" onPress={() => router.push('/bookings')} />
              ) : null}
              {data.can.retreats || data.can.checkIn ? (
                <StatTile label="Check-ins" hint="Last 30 days" value={data.stats.checkedIn30} icon="checkmark-circle-outline" tone="green" />
              ) : null}
              {data.can.donations ? (
                <StatTile
                  label="Giving this month"
                  hint={`${data.stats.giftsThisMonth} gifts recorded`}
                  value={compactTZS(data.stats.givingThisMonth)}
                  icon="heart-outline"
                  tone="gold"
                  onPress={() => router.push({ pathname: '/giving', params: { tab: 'donations' } })}
                />
              ) : null}
              {data.can.intentions ? (
                <StatTile
                  label="New intentions"
                  hint="Waiting to be scheduled"
                  value={data.stats.newIntentions}
                  icon="flame-outline"
                  tone="rose"
                  onPress={() => router.push({ pathname: '/giving', params: { tab: 'mass-intentions' } })}
                />
              ) : null}
              {data.can.team ? <StatTile label="Team" hint="Active members" value={data.stats.teamSize} icon="people-outline" onPress={() => router.push('/team')} /> : null}
              {data.can.leave && data.stats.awayToday !== undefined ? (
                <StatTile label="Away today" hint="On approved leave" value={data.stats.awayToday} icon="airplane-outline" onPress={() => router.push('/leave')} />
              ) : null}
            </View>

            {data.can.donations && data.givingMonths.length ? (
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: space.lg }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="caption">Giving</Text>
                    <Text variant="heading">Last six months</Text>
                  </View>
                  <Text variant="smallStrong" color={colors.gold600}>
                    Paid gifts
                  </Text>
                </View>
                <MonthBars data={data.givingMonths} />
              </Card>
            ) : null}

            {data.openRetreats.length ? (
              <Group title="Open retreats" action={data.can.retreats ? 'All retreats' : undefined} onAction={() => router.push('/retreats')}>
                {data.openRetreats.map((retreat, index) => {
                  const ratio = retreat.capacity ? retreat.booked / retreat.capacity : 0;
                  return (
                    <View key={retreat.id}>
                      {index > 0 ? <RowDivider /> : null}
                      <PressableScale
                        scaleTo={0.985}
                        onPress={() =>
                          data.can.retreats
                            ? router.push({ pathname: '/retreat/[id]', params: { id: retreat.id } })
                            : router.push({ pathname: '/scan', params: { retreatId: retreat.id } })
                        }
                        style={styles.retreat}>
                        <Img uri={retreat.imageSrc} style={styles.retreatImage} />
                        <View style={{ flex: 1, gap: 6 }}>
                          <Text variant="bodyStrong" numberOfLines={1}>
                            {retreat.title}
                          </Text>
                          <Text variant="small" numberOfLines={1}>
                            {retreat.dateRange}
                          </Text>
                          <Progress value={ratio} tone={ratio >= 0.9 ? 'danger' : 'navy'} />
                          <Text variant="small" style={{ fontSize: 12 }}>
                            {retreat.booked} of {retreat.capacity || '—'} booked
                            {retreat.capacity ? ` · ${Math.max(retreat.capacity - retreat.booked, 0)} left` : ''}
                          </Text>
                        </View>
                      </PressableScale>
                    </View>
                  );
                })}
              </Group>
            ) : null}

            {data.recentBookings.length ? (
              <Group title="Latest bookings" action="See all" onAction={() => router.push('/bookings')}>
                {data.recentBookings.map((booking, index) => (
                  <View key={booking.id}>
                    {index > 0 ? <RowDivider /> : null}
                    <ListRow
                      title={booking.fullName}
                      subtitle={booking.retreatTitle}
                      meta={relativeTime(booking.createdAt)}
                      leading={<Avatar name={booking.fullName} size={38} />}
                      trailing={<StatusPill status={booking.status} />}
                      onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}
                    />
                  </View>
                ))}
              </Group>
            ) : null}

            {data.upcomingIntentions.length ? (
              <Group title="Masses this week">
                {data.upcomingIntentions.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <RowDivider /> : null}
                    <ListRow
                      title={item.intentionFor}
                      subtitle={`${item.intentionType} · requested by ${item.fullName}`}
                      meta={`${formatDate(item.scheduledFor, { weekday: 'short', day: 'numeric', month: 'short' })}${item.celebrant ? ` · ${item.celebrant}` : ''}`}
                      leading={
                        <View style={styles.flame}>
                          <Icon name="flame" size={18} color={colors.gold600} />
                        </View>
                      }
                      onPress={() => router.push({ pathname: '/record/[kind]/[id]', params: { kind: 'mass-intentions', id: item.id } })}
                    />
                  </View>
                ))}
              </Group>
            ) : null}

            {data.activity.length ? (
              <Group title="Recent activity" action="View log" onAction={() => router.push('/activity')}>
                {data.activity.map((entry, index) => (
                  <View key={entry.id}>
                    {index > 0 ? <RowDivider /> : null}
                    <ListRow title={entry.summary} subtitle={`${entry.actorName ?? 'System'} · ${relativeTime(entry.createdAt)}`} chevron={false} />
                  </View>
                ))}
              </Group>
            ) : null}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quick: {
    alignItems: 'center',
    gap: 8,
    width: 98,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  quickIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
  attention: { backgroundColor: colors.navy900, borderColor: colors.navy800, overflow: 'hidden' },
  attentionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xs },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14 },
  attentionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)' },
  attentionCount: { minWidth: 28, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: colors.gold400, alignItems: 'center', justifyContent: 'center' },
  allClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.successSoft,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  retreat: { flexDirection: 'row', gap: space.md, padding: space.lg, backgroundColor: colors.white, alignItems: 'center' },
  retreatImage: { width: 64, height: 64, borderRadius: 14 },
  flame: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.gold50, alignItems: 'center', justifyContent: 'center' },
});
