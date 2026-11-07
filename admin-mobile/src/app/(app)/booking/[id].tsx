import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  Avatar,
  confirm,
  ErrorState,
  Group,
  IconButton,
  KeyValue,
  ListSkeleton,
  RowDivider,
  Sheet,
  SheetOption,
  StackHeader,
  StatusPill,
  toast,
  ViewOnlyNote,
} from '@/components/admin';
import { ContactBar } from '@/components/contact';
import { TextField } from '@/components/form';
import { Button, Card, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { capitalize, formatDateTime } from '@/lib/format';
import { invalidateBookings, keys } from '@/lib/queries';
import { useCan } from '@/lib/session';
import type { BookingDetail, Retreat } from '@/lib/types';
import { colors, space } from '@/theme';

const LABELS: Record<string, string> = {
  gender: 'Gender',
  age: 'Age',
  ageGroup: 'Age group',
  parish: 'Parish',
  address: 'Address',
  city: 'City',
  region: 'Region',
  occupation: 'Occupation',
  emergencyContactName: 'Emergency contact',
  emergencyContactPhone: 'Emergency phone',
  specialNeeds: 'Special needs',
  dietaryRequirements: 'Diet',
  paymentMethod: 'Payment method',
  howDidYouHear: 'Heard about us',
};

const humanize = (key: string) => LABELS[key] ?? capitalize(key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').toLowerCase());
const SKIP = new Set(['fullName', 'email', 'phone', 'whatsapp', 'retreatId', 'retreatTitle', 'familyMembers', 'card', 'cardNumber', 'cvv', 'expiry', 'payment']);

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const canEdit = useCan('retreats', 'edit');
  const client = useQueryClient();
  const [notes, setNotes] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);

  const booking = useQuery({
    queryKey: keys.booking(id),
    queryFn: ({ signal }) => api<{ data: BookingDetail }>(`/api/retreats/bookings/${id}`, { signal }).then((r) => r.data),
  });
  const retreats = useQuery({
    queryKey: keys.retreats,
    enabled: moveOpen,
    queryFn: ({ signal }) => api<{ data: Retreat[] }>('/api/retreats', { signal }).then((r) => r.data),
  });

  const run = useMutation({
    mutationFn: async (action: string) => {
      if (action === 'approve') return api(`/api/retreats/bookings/${id}/approve`, { method: 'POST' });
      if (action === 'email') return api(`/api/retreats/bookings/${id}/email`, { method: 'POST', body: { ticketCode: booking.data?.ticketCode } });
      if (action.startsWith('move:')) return api(`/api/retreats/bookings/${id}`, { method: 'PATCH', body: { retreatId: action.slice(5) } });
      if (action === 'notes') return api(`/api/retreats/bookings/${id}`, { method: 'PATCH', body: { notes: notes ?? '' } });
      return api('/api/admin/bookings/bulk', { method: 'POST', body: { action, ids: [id] } });
    },
    onSuccess: (_data, action) => {
      const messages: Record<string, string> = {
        approve: 'Booking approved and ticket issued',
        email: 'Ticket email sent',
        cancel: 'Booking cancelled',
        mark_paid: 'Marked as paid',
        mark_unpaid: 'Marked as unpaid',
        check_in: 'Guest checked in',
        undo_check_in: 'Check-in undone',
        notes: 'Notes saved',
      };
      toast(action.startsWith('move:') ? 'Booking moved to the new retreat' : (messages[action] ?? 'Saved'));
      if (action === 'notes') setNotes(null);
      invalidateBookings(client);
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const data = booking.data;
  const busy = (action: string) => run.isPending && run.variables === action;
  const extra = data?.formPayload
    ? Object.entries(data.formPayload).filter(([key, value]) => !SKIP.has(key) && value !== null && value !== '' && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'))
    : [];

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title="Booking" subtitle={data?.ticketCode} right={data ? <IconButton icon="refresh" label="Refresh" onPress={() => booking.refetch()} /> : null} />
      {booking.isLoading ? (
        <ListSkeleton rows={5} />
      ) : booking.error || !data ? (
        <ErrorState message={errorMessage(booking.error)} onRetry={booking.refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={booking.isRefetching} onRefresh={() => void booking.refetch()} tintColor={colors.gold500} />}
          keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: space.sm }}>
            <Avatar name={data.fullName} size={72} tone="gold" />
            <Text variant="title" center>
              {data.fullName}
            </Text>
            <Text variant="small" center>
              {data.retreatTitle}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <StatusPill status={data.status} />
              {data.status !== 'cancelled' ? <StatusPill status={data.paymentStatus} label={data.paymentStatus === 'pending' ? 'unpaid' : data.paymentStatus} /> : null}
              {data.attended ? <StatusPill status="checked in" /> : null}
            </View>
          </Animated.View>

          <ContactBar phone={data.phone} whatsapp={data.whatsapp} email={data.email} />

          {canEdit ? (
            <View style={{ gap: space.sm }}>
              {data.status === 'pending' || data.status === 'rescheduled' ? (
                <Button label="Approve and issue ticket" icon="checkmark-circle" variant="gold" loading={busy('approve')} onPress={() => run.mutate('approve')} />
              ) : null}
              {data.status === 'approved' ? (
                data.attended ? (
                  <Button label="Undo check-in" icon="arrow-undo" variant="secondary" loading={busy('undo_check_in')} onPress={() => run.mutate('undo_check_in')} />
                ) : (
                  <Button label="Check in now" icon="enter" loading={busy('check_in')} onPress={() => run.mutate('check_in')} />
                )
              ) : null}
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {data.status !== 'cancelled' ? (
                  data.paymentStatus === 'paid' ? (
                    <Button label="Mark unpaid" size="md" variant="secondary" loading={busy('mark_unpaid')} onPress={() => run.mutate('mark_unpaid')} style={{ flex: 1 }} />
                  ) : (
                    <Button label="Mark paid" icon="cash-outline" size="md" variant="secondary" loading={busy('mark_paid')} onPress={() => run.mutate('mark_paid')} style={{ flex: 1 }} />
                  )
                ) : null}
                <Button label="Move" icon="swap-horizontal" size="md" variant="secondary" onPress={() => setMoveOpen(true)} style={{ flex: 1 }} />
              </View>
              {data.ticketCode && data.status === 'approved' ? (
                <Button label="Email the ticket again" icon="mail-outline" size="md" variant="ghost" loading={busy('email')} onPress={() => run.mutate('email')} />
              ) : null}
            </View>
          ) : (
            <ViewOnlyNote />
          )}

          <Group title="Booking">
            <KeyValue label="Ticket" value={data.ticketCode ?? 'Issued on approval'} icon="qr-code-outline" />
            <RowDivider />
            <KeyValue label="Booked" value={formatDateTime(data.createdAt)} icon="time-outline" />
            {data.checkedInAt ? (
              <>
                <RowDivider />
                <KeyValue label="Checked in" value={formatDateTime(data.checkedInAt)} icon="enter-outline" />
              </>
            ) : null}
            {data.rescheduledToRetreatTitle ? (
              <>
                <RowDivider />
                <KeyValue label="Moved to" value={data.rescheduledToRetreatTitle} icon="swap-horizontal" />
              </>
            ) : null}
            {data.cancelledAt ? (
              <>
                <RowDivider />
                <KeyValue label="Cancelled" value={formatDateTime(data.cancelledAt)} icon="close-circle-outline" />
              </>
            ) : null}
          </Group>

          <Group title="Contact">
            <KeyValue label="Phone" value={data.phone} icon="call-outline" />
            <RowDivider />
            <KeyValue label="Email" value={data.email} icon="mail-outline" />
            {data.whatsapp ? (
              <>
                <RowDivider />
                <KeyValue label="WhatsApp" value={data.whatsapp} icon="logo-whatsapp" />
              </>
            ) : null}
          </Group>

          {data.familyMembers?.length ? (
            <Group title={`Party · ${data.familyMembers.length + 1} people`}>
              {data.familyMembers.map((member, index) => (
                <View key={index}>
                  {index > 0 ? <RowDivider /> : null}
                  <KeyValue
                    label={String(member.relationship ?? member.relation ?? 'Guest')}
                    value={[member.name ?? member.fullName, member.age ? `${member.age} yrs` : null, member.gender].filter(Boolean).join(' · ') || 'Guest'}
                    icon="person-outline"
                  />
                </View>
              ))}
            </Group>
          ) : null}

          {extra.length ? (
            <Group title="Details from the form">
              {extra.map(([key, value], index) => (
                <View key={key}>
                  {index > 0 ? <RowDivider /> : null}
                  <KeyValue label={humanize(key)} value={typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)} />
                </View>
              ))}
            </Group>
          ) : null}

          <Card style={{ gap: space.md }}>
            <TextField
              label="Notes for the team"
              multiline
              editable={canEdit}
              value={notes ?? data.notes ?? ''}
              onChangeText={setNotes}
              placeholder={canEdit ? 'Room, dietary needs, follow-ups…' : 'No notes'}
            />
            {canEdit && notes !== null && notes !== (data.notes ?? '') ? (
              <Button label="Save notes" size="md" loading={busy('notes')} onPress={() => run.mutate('notes')} />
            ) : null}
          </Card>

          {canEdit && data.status !== 'cancelled' ? (
            <Button
              label="Cancel booking"
              variant="danger"
              icon="close-circle-outline"
              loading={busy('cancel')}
              onPress={async () => {
                if (await confirm('Cancel this booking?', `${data.fullName} will lose their place at ${data.retreatTitle}.`, 'Cancel booking', true)) run.mutate('cancel');
              }}
            />
          ) : null}
        </ScrollView>
      )}

      <Sheet visible={moveOpen} onClose={() => setMoveOpen(false)} title="Move to another retreat">
        {(retreats.data ?? [])
          .filter((retreat) => retreat.id !== data?.retreatId)
          .map((retreat) => (
            <SheetOption
              key={retreat.id}
              label={retreat.title}
              description={`${retreat.dateRange} · ${retreat.status}`}
              onPress={async () => {
                setMoveOpen(false);
                if (await confirm('Move this booking?', `Move ${data?.fullName} to ${retreat.title}? They will get an email about the change.`, 'Move')) run.mutate(`move:${retreat.id}`);
              }}
            />
          ))}
        {retreats.isLoading ? <ListSkeleton rows={3} /> : null}
      </Sheet>
    </View>
  );
}

