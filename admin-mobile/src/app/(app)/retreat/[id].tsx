import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ErrorState, Group, KeyValue, ListSkeleton, Progress, RowDivider, SegmentTabs, StackHeader, StatTile, toast, ViewOnlyNote } from '@/components/admin';
import { Skeleton } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Card, Img, ScrimGradient, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatTZS } from '@/lib/format';
import { keys } from '@/lib/queries';
import { canScan, useCan, useSession } from '@/lib/session';
import type { BookingDetail, Retreat } from '@/lib/types';
import { colors, radius, space } from '@/theme';

type RetreatWithBookings = Retreat & { bookings?: BookingDetail[] };
type Draft = { dateRange: string; timeRange: string; location: string; price: string; total: string; male: string; female: string };

const party = (booking: BookingDetail) => 1 + (booking.familyMembers?.length ?? 0);

export default function RetreatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const canEdit = useCan('retreats', 'edit');
  const scan = useSession((s) => canScan(s.user));
  const client = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  const query = useQuery({
    queryKey: keys.retreat(id),
    queryFn: ({ signal }) => api<{ data: RetreatWithBookings }>(`/api/retreats/${id}`, { signal }).then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/retreats/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      toast('Retreat updated');
      setDraft(null);
      client.invalidateQueries({ queryKey: keys.retreat(id) });
      client.invalidateQueries({ queryKey: keys.retreats });
      client.invalidateQueries({ queryKey: keys.overview });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const data = query.data;
  const bookings = (data?.bookings ?? []).filter((booking) => booking.status !== 'cancelled');
  const guests = bookings.reduce((sum, booking) => sum + party(booking), 0);
  const approved = bookings.filter((booking) => booking.status === 'approved');
  const pending = bookings.filter((booking) => booking.status === 'pending').length;
  const paid = bookings.filter((booking) => booking.paymentStatus === 'paid').length;
  const arrived = approved.filter((booking) => booking.attended).reduce((sum, booking) => sum + party(booking), 0);
  const capacity = data?.availability.total ?? 0;

  const startEdit = () =>
    data &&
    setDraft({
      dateRange: data.dateRange,
      timeRange: data.timeRange,
      location: data.location,
      price: data.price != null ? String(data.price) : '',
      total: String(data.availability.total ?? 0),
      male: String(data.availability.male ?? 0),
      female: String(data.availability.female ?? 0),
    });

  const submit = () => {
    if (!draft) return;
    const number = (value: string) => Math.max(0, Math.round(Number(value.replace(/[^\d.]/g, '')) || 0));
    save.mutate({
      dateRange: draft.dateRange.trim(),
      timeRange: draft.timeRange.trim(),
      location: draft.location.trim(),
      price: draft.price.trim() ? number(draft.price) : null,
      availability: { total: number(draft.total), male: number(draft.male), female: number(draft.female) },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title={data?.title ?? 'Retreat'} subtitle={data?.dateRange} />
      {query.isLoading ? (
        <View style={{ padding: space.xl, gap: space.md }}>
          <Skeleton style={{ height: 180, borderRadius: radius.xl }} />
          <ListSkeleton rows={3} />
        </View>
      ) : query.error || !data ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeIn} style={styles.hero}>
            <Img uri={data.imageSrc} style={StyleSheet.absoluteFill} />
            <ScrimGradient />
            <View style={{ padding: space.lg, gap: 4 }}>
              <Text variant="caption" color={colors.gold300}>
                {data.category}
              </Text>
              <Text variant="title" color={colors.white} numberOfLines={2}>
                {data.title}
              </Text>
              <Text variant="small" color={colors.navy100}>
                {data.speaker}
              </Text>
            </View>
          </Animated.View>

          <Card style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">
                {guests} of {capacity || '—'} places taken
              </Text>
              <Text variant="small">{capacity ? `${Math.max(capacity - guests, 0)} left` : ''}</Text>
            </View>
            <Progress value={capacity ? guests / capacity : 0} tone={capacity && guests / capacity >= 0.9 ? 'danger' : 'gold'} />
          </Card>

          <View style={styles.grid}>
            <StatTile label="To approve" value={pending} icon="hourglass-outline" tone="rose" onPress={() => router.push({ pathname: '/bookings', params: { retreatId: id, status: 'pending' } })} />
            <StatTile label="Approved" value={approved.length} icon="checkmark-circle-outline" tone="green" onPress={() => router.push({ pathname: '/bookings', params: { retreatId: id, status: 'approved' } })} />
            <StatTile label="Paid" value={`${paid}/${bookings.length}`} icon="cash-outline" tone="gold" />
            <StatTile label="Arrived" value={`${arrived}/${approved.reduce((sum, booking) => sum + party(booking), 0)}`} icon="enter-outline" />
          </View>

          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Bookings" icon="ticket-outline" variant="secondary" size="md" onPress={() => router.push({ pathname: '/bookings', params: { retreatId: id, status: 'all' } })} style={{ flex: 1 }} />
            {scan ? <Button label="Check-in desk" icon="qr-code-outline" size="md" onPress={() => router.push({ pathname: '/scan', params: { retreatId: id } })} style={{ flex: 1 }} /> : null}
          </View>

          <View style={{ gap: space.sm }}>
            <Text variant="caption">Registration</Text>
            <SegmentTabs
              value={data.status}
              onChange={(status) => (canEdit ? save.mutate({ status }) : toast('You have view-only access to retreats.', 'info'))}
              options={[
                { value: 'Registration Open', label: 'Open' },
                { value: 'Waitlist', label: 'Waitlist' },
                { value: 'Closed', label: 'Closed' },
              ]}
            />
          </View>

          {!canEdit ? <ViewOnlyNote /> : null}

          {draft ? (
            <Card style={{ gap: space.md }}>
              <TextField label="Dates" value={draft.dateRange} onChangeText={(dateRange) => setDraft({ ...draft, dateRange })} />
              <TextField label="Times" value={draft.timeRange} onChangeText={(timeRange) => setDraft({ ...draft, timeRange })} />
              <TextField label="Location" value={draft.location} onChangeText={(location) => setDraft({ ...draft, location })} />
              <TextField label="Contribution (TZS)" hint="Leave empty for a free-will offering." keyboardType="number-pad" value={draft.price} onChangeText={(price) => setDraft({ ...draft, price })} />
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField label="Places" keyboardType="number-pad" value={draft.total} onChangeText={(total) => setDraft({ ...draft, total })} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField label="Men" keyboardType="number-pad" value={draft.male} onChangeText={(male) => setDraft({ ...draft, male })} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField label="Women" keyboardType="number-pad" value={draft.female} onChangeText={(female) => setDraft({ ...draft, female })} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button label="Cancel" variant="secondary" size="md" onPress={() => setDraft(null)} style={{ flex: 1 }} />
                <Button label="Save" size="md" loading={save.isPending} onPress={submit} style={{ flex: 1 }} />
              </View>
            </Card>
          ) : (
            <Group title="Details" action={canEdit ? 'Edit' : undefined} onAction={startEdit}>
              <KeyValue label="Dates" value={data.dateRange} icon="calendar-outline" />
              <RowDivider />
              <KeyValue label="Times" value={data.timeRange} icon="time-outline" />
              <RowDivider />
              <KeyValue label="Location" value={data.location} icon="location-outline" />
              <RowDivider />
              <KeyValue label="Conductor" value={data.conductor} icon="person-outline" />
              <RowDivider />
              <KeyValue label="Contribution" value={data.isPaid === false || !data.price ? 'Free-will offering' : formatTZS(data.price)} icon="cash-outline" />
              <RowDivider />
              <KeyValue label="Places" value={`${data.availability.total} (${data.availability.male} men, ${data.availability.female} women)`} icon="people-outline" />
            </Group>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 190, borderRadius: radius.xl, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: colors.navy800 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
