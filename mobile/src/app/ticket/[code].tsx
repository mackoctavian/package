import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorBanner, Skeleton } from '@/components/feedback';
import { ScreenHeader } from '@/components/headers';
import { TicketCard } from '@/components/TicketCard';
import { Button, Card, Icon, Text } from '@/components/ui';
import { cancelBooking, lookupBooking, rescheduleBooking, useRetreats } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { actions, useAppStore } from '@/lib/store';
import { colors, radius, space } from '@/theme';

export default function TicketDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const insets = useSafeAreaInsets();
  const saved = useAppStore((s) => s.tickets.find((ticket) => ticket.code === code));
  const queryClient = useQueryClient();
  const { data: retreats } = useRetreats();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  const query = useQuery({
    queryKey: ['booking', code],
    queryFn: async () => (await lookupBooking(saved?.bookingId ?? code)).data,
    enabled: Boolean(code),
  });
  const booking = query.data;
  const retreat = retreats?.data.find((item) => item.id === booking?.retreatId);
  const active = booking && booking.status !== 'cancelled';
  const options = (retreats?.data ?? []).filter((item) => !item.ended && item.status !== 'Closed' && item.id !== booking?.retreatId);

  const refresh = (updated: NonNullable<typeof booking>) => {
    queryClient.setQueryData(['booking', code], updated);
    actions.updateTicket(code, { retreatTitle: updated.retreatTitle, dateRange: retreats?.data.find((r) => r.id === updated.retreatId)?.dateRange });
  };

  const cancel = () => {
    Alert.alert('Cancel this booking?', 'Your place will be released. Cancellations within 7 days of the retreat may not be refunded.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          if (!booking) return;
          setBusy(true);
          setError(null);
          try {
            refresh((await cancelBooking(booking.id)).data);
            haptic.success();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not cancel the booking.');
            haptic.error();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const reschedule = async (retreatId: string) => {
    if (!booking) return;
    setPicker(false);
    setBusy(true);
    setError(null);
    try {
      refresh((await rescheduleBooking(booking.id, retreatId)).data);
      haptic.success();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not move the booking.');
      haptic.error();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title="Ticket" subtitle={code} />
      <ScrollView
        contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { query.refetch(); }} tintColor={colors.gold500} />}>
        {query.isPending ? (
          <Skeleton style={{ height: 520, borderRadius: radius.xxl }} />
        ) : !booking ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Could not load this ticket"
            body={query.error instanceof Error ? query.error.message : 'Check your connection and try again.'}
            action="Try again"
            onAction={() => query.refetch()}
          />
        ) : (
          <>
            <Animated.View entering={FadeInDown.springify()}>
              <TicketCard
                code={booking.ticketCode ?? code}
                retreatTitle={booking.retreatTitle}
                dateRange={retreat?.dateRange ?? saved?.dateRange}
                fullName={booking.fullName}
                status={booking.status}
                paymentStatus={booking.paymentStatus}
                guests={booking.familyMembers?.length ?? 0}
              />
            </Animated.View>

            <Card style={{ gap: space.md }}>
              <Text variant="subtitle">Booking timeline</Text>
              {[
                { label: 'Booked', date: booking.createdAt, done: true },
                { label: booking.status === 'approved' ? 'Approved by the office' : 'Awaiting approval', date: undefined, done: booking.status === 'approved' },
                booking.rescheduledAt ? { label: 'Moved to another retreat', date: booking.rescheduledAt, done: true } : null,
                booking.cancelledAt ? { label: 'Cancelled', date: booking.cancelledAt, done: true } : null,
                { label: booking.attended ? 'Checked in' : 'Check in at reception', date: booking.checkedInAt, done: booking.attended },
              ]
                .filter((item): item is { label: string; date: string | undefined; done: boolean } => Boolean(item))
                .map((item) => (
                  <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <Icon name={item.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.done ? colors.success : colors.subtle} />
                    <Text variant="body" style={{ flex: 1 }}>
                      {item.label}
                    </Text>
                    {item.date ? <Text variant="small">{formatDate(item.date, { day: 'numeric', month: 'short' })}</Text> : null}
                  </View>
                ))}
            </Card>

            <ErrorBanner message={error} />

            {active && !booking.attended ? (
              <View style={{ gap: space.sm }}>
                {options.length ? <Button label="Move to another retreat" icon="swap-horizontal" variant="secondary" loading={busy} onPress={() => setPicker(true)} /> : null}
                <Button label="Cancel booking" icon="close-circle-outline" variant="danger" disabled={busy} onPress={cancel} />
              </View>
            ) : null}
          </>
        )}
        <Pressable
          onPress={() => {
            actions.removeTicket(code);
            router.back();
          }}
          style={{ alignSelf: 'center', padding: space.md }}>
          <Text variant="small">Remove from this phone</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={picker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicker(false)}>
        <View style={{ flex: 1, backgroundColor: colors.ivory, padding: space.xl, gap: space.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="title">Choose a retreat</Text>
            <Pressable onPress={() => setPicker(false)} hitSlop={10} accessibilityLabel="Close">
              <Icon name="close" size={24} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: space.md }}>
            {options.map((item) => (
              <Animated.View key={item.id} entering={FadeIn}>
                <Pressable onPress={() => reschedule(item.id)} style={styles.option}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{item.title}</Text>
                    <Text variant="small">
                      {item.dateRange} · {item.location}
                    </Text>
                  </View>
                  <Icon name="arrow-forward" size={18} color={colors.gold600} />
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
});
