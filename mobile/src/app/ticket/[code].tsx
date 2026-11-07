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
import { useFormat, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { actions, useAppStore } from '@/lib/store';
import { colors, radius, space } from '@/theme';

export default function TicketDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { date } = useFormat();
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
    const moved = retreats?.data.find((r) => r.id === updated.retreatId);
    actions.updateTicket(code, { retreatTitle: updated.retreatTitle, dateRange: moved?.dateLabel ?? moved?.dateRange });
  };

  const cancel = () => {
    Alert.alert(t('tickets.cancelTitle'), t('tickets.cancelText'), [
      { text: t('tickets.keep'), style: 'cancel' },
      {
        text: t('tickets.cancel'),
        style: 'destructive',
        onPress: async () => {
          if (!booking) return;
          setBusy(true);
          setError(null);
          try {
            refresh((await cancelBooking(booking.id)).data);
            haptic.success();
          } catch (err) {
            setError(err instanceof Error ? err.message : t('tickets.cancelError'));
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
      setError(err instanceof Error ? err.message : t('tickets.moveError'));
      haptic.error();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title={t('tickets.detailTitle')} subtitle={code} />
      <ScrollView
        contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { query.refetch(); }} tintColor={colors.gold500} />}>
        {query.isPending ? (
          <Skeleton style={{ height: 520, borderRadius: radius.xxl }} />
        ) : !booking ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t('tickets.loadError')}
            body={query.error instanceof Error ? query.error.message : t('tickets.loadErrorText')}
            action={t('common.tryAgain')}
            onAction={() => query.refetch()}
          />
        ) : (
          <>
            <Animated.View entering={FadeInDown.springify()}>
              <TicketCard
                code={booking.ticketCode ?? code}
                retreatTitle={booking.retreatTitle}
                dateRange={retreat?.dateLabel ?? retreat?.dateRange ?? saved?.dateRange}
                fullName={booking.fullName}
                status={booking.status}
                paymentStatus={booking.paymentStatus}
                guests={booking.familyMembers?.length ?? 0}
              />
            </Animated.View>

            <Card style={{ gap: space.md }}>
              <Text variant="subtitle">{t('tickets.timeline')}</Text>
              {[
                { label: t('tickets.booked'), date: booking.createdAt, done: true },
                { label: booking.status === 'approved' ? t('tickets.approved') : t('tickets.awaiting'), date: undefined, done: booking.status === 'approved' },
                booking.rescheduledAt ? { label: t('tickets.moved'), date: booking.rescheduledAt, done: true } : null,
                booking.cancelledAt ? { label: t('tickets.cancelled'), date: booking.cancelledAt, done: true } : null,
                { label: booking.attended ? t('tickets.checkedIn') : t('tickets.checkIn'), date: booking.checkedInAt, done: booking.attended },
              ]
                .filter((item): item is { label: string; date: string | undefined; done: boolean } => Boolean(item))
                .map((item) => (
                  <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <Icon name={item.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.done ? colors.success : colors.subtle} />
                    <Text variant="body" style={{ flex: 1 }}>
                      {item.label}
                    </Text>
                    {item.date ? <Text variant="small">{date(item.date, { day: 'numeric', month: 'short' })}</Text> : null}
                  </View>
                ))}
            </Card>

            <ErrorBanner message={error} />

            {active && !booking.attended ? (
              <View style={{ gap: space.sm }}>
                {options.length ? <Button label={t('tickets.move')} icon="swap-horizontal" variant="secondary" loading={busy} onPress={() => setPicker(true)} /> : null}
                <Button label={t('tickets.cancel')} icon="close-circle-outline" variant="danger" disabled={busy} onPress={cancel} />
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
          <Text variant="small">{t('tickets.remove')}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={picker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicker(false)}>
        <View style={{ flex: 1, backgroundColor: colors.ivory, padding: space.xl, gap: space.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="title">{t('tickets.choose')}</Text>
            <Pressable onPress={() => setPicker(false)} hitSlop={10} accessibilityLabel={t('common.close')}>
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
                      {item.dateLabel ?? item.dateRange} · {item.location}
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
