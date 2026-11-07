import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  confirm,
  ErrorState,
  Group,
  IconButton,
  KeyValue,
  ListSkeleton,
  RowDivider,
  SegmentTabs,
  Sheet,
  SheetOption,
  StackHeader,
  StatusPill,
  toast,
  ViewOnlyNote,
} from '@/components/admin';
import { ContactBar } from '@/components/contact';
import { TextField } from '@/components/form';
import { Button, Card, Icon, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatTZS, isoDay } from '@/lib/format';
import { invalidateRecords, keys } from '@/lib/queries';
import { useCan } from '@/lib/session';
import type { Donation, MassIntention, Message, RecordKind } from '@/lib/types';
import { colors, fonts, radius, space } from '@/theme';

type AnyRecord = Omit<Donation & MassIntention & Message, 'status'> & { status: string };

const TITLES: Record<RecordKind, string> = { donations: 'Donation', 'mass-intentions': 'Mass intention', feedback: 'Message' };

export default function RecordScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: RecordKind; id: string }>();
  const canEdit = useCan(kind, 'edit');
  const client = useQueryClient();
  const [notes, setNotes] = useState<string | null>(null);
  const [celebrant, setCelebrant] = useState<string | null>(null);
  const [datePicker, setDatePicker] = useState(false);

  const record = useQuery({
    queryKey: keys.record(kind, id),
    queryFn: ({ signal }) => api<{ data: AnyRecord }>(`/api/admin/records/${kind}/${id}`, { signal }).then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/admin/records/${kind}/${id}`, { method: 'PATCH', body }),
    onSuccess: (_data, body) => {
      toast('Saved');
      if ('adminNotes' in body) setNotes(null);
      if ('celebrant' in body) setCelebrant(null);
      invalidateRecords(client, kind);
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/admin/records/${kind}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast('Deleted');
      invalidateRecords(client, kind);
      router.back();
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const data = record.data;
  const name = data ? (kind === 'feedback' ? `${data.firstName} ${data.lastName}`.trim() : data.fullName) : '';

  return (
    <View style={{ flex: 1 }}>
      <StackHeader
        title={TITLES[kind]}
        subtitle={data ? formatDate(data.createdAt) : undefined}
        right={
          canEdit && data ? (
            <IconButton
              icon="trash-outline"
              label="Delete"
              onPress={async () => {
                if (await confirm(`Delete this ${TITLES[kind].toLowerCase()}?`, 'This cannot be undone. It will be recorded in the activity log.', 'Delete', true)) remove.mutate();
              }}
            />
          ) : null
        }
      />
      {record.isLoading ? (
        <ListSkeleton rows={5} />
      ) : record.error || !data ? (
        <ErrorState message={errorMessage(record.error)} onRetry={record.refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={record.isRefetching} onRefresh={() => void record.refetch()} tintColor={colors.gold500} />}
          keyboardShouldPersistTaps="handled">
          {/* Summary card */}
          <Animated.View entering={FadeIn}>
            {kind === 'donations' ? (
              <Card style={styles.hero}>
                <Text variant="caption" color={colors.gold300}>
                  Gift from {name}
                </Text>
                <Text style={styles.amount}>{formatTZS(data.amount)}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <StatusPill status={data.paymentStatus} label={data.paymentStatus === 'pending' ? 'unpaid' : data.paymentStatus} />
                  <StatusPill status={data.status} />
                </View>
              </Card>
            ) : kind === 'mass-intentions' ? (
              <Card style={styles.hero}>
                <Text variant="caption" color={colors.gold300}>
                  {data.intentionType}
                </Text>
                <Text variant="title" color={colors.white}>
                  {data.intentionFor}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <StatusPill status={data.status} />
                  {data.scheduledFor ? (
                    <Text variant="small" color={colors.navy200}>
                      {formatDate(data.scheduledFor, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                  ) : null}
                </View>
              </Card>
            ) : (
              <Card style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Text variant="subtitle" style={{ flex: 1 }}>
                    {name}
                  </Text>
                  <StatusPill status={data.status} />
                </View>
                <Text variant="body" selectable>
                  {data.message}
                </Text>
              </Card>
            )}
          </Animated.View>

          <ContactBar phone={kind === 'feedback' ? data.phoneNumber : data.phone} email={data.email} />

          {!canEdit ? <ViewOnlyNote /> : null}

          {/* Donation controls */}
          {kind === 'donations' ? (
            <>
              <View style={{ gap: space.sm }}>
                <Text variant="caption">Payment</Text>
                <SegmentTabs
                  value={data.paymentStatus}
                  onChange={(value) => canEdit && save.mutate({ paymentStatus: value })}
                  options={[
                    { value: 'pending', label: 'Unpaid' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'failed', label: 'Failed' },
                    { value: 'refunded', label: 'Refunded' },
                  ]}
                />
                <Text variant="small" style={{ fontSize: 12 }}>
                  Online payments are in demo mode until a payment provider is connected, so confirm gifts against M-Pesa or bank statements.
                </Text>
              </View>
              {canEdit ? (
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {data.status !== 'acknowledged' ? (
                    <Button label="Mark thanked" icon="checkmark-done" size="md" onPress={() => save.mutate({ status: 'acknowledged' })} style={{ flex: 1 }} />
                  ) : null}
                  {data.status !== 'archived' ? (
                    <Button label="Archive" icon="archive-outline" size="md" variant="secondary" onPress={() => save.mutate({ status: 'archived' })} style={{ flex: 1 }} />
                  ) : (
                    <Button label="Restore" icon="refresh" size="md" variant="secondary" onPress={() => save.mutate({ status: 'new' })} style={{ flex: 1 }} />
                  )}
                </View>
              ) : null}
              <Group title="Details">
                <KeyValue label="Method" value={data.paymentMethod} icon="card-outline" />
                <RowDivider />
                <KeyValue label="Received" value={formatDateTime(data.createdAt)} icon="time-outline" />
                <RowDivider />
                <KeyValue label="Phone" value={data.phone} icon="call-outline" />
                <RowDivider />
                <KeyValue label="Email" value={data.email} icon="mail-outline" />
              </Group>
              {data.prayerIntention ? (
                <Card style={{ gap: space.sm }}>
                  <Text variant="caption">Prayer intention</Text>
                  <Text variant="quote">“{data.prayerIntention}”</Text>
                </Card>
              ) : null}
            </>
          ) : null}

          {/* Mass intention controls */}
          {kind === 'mass-intentions' ? (
            <>
              {canEdit ? (
                <View style={{ gap: space.sm }}>
                  <Button
                    label={data.scheduledFor ? 'Change the date' : 'Schedule this Mass'}
                    icon="calendar"
                    variant={data.status === 'new' ? 'gold' : 'secondary'}
                    onPress={() => setDatePicker(true)}
                  />
                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    {data.status === 'scheduled' ? (
                      <Button label="Celebrated" icon="checkmark-done" size="md" onPress={() => save.mutate({ status: 'celebrated' })} style={{ flex: 1 }} />
                    ) : null}
                    {data.status !== 'cancelled' ? (
                      <Button
                        label="Cancel"
                        size="md"
                        variant="danger"
                        onPress={async () => {
                          if (await confirm('Cancel this intention?', 'The request stays on record as cancelled.', 'Cancel intention', true)) save.mutate({ status: 'cancelled' });
                        }}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <Button label="Restore" icon="refresh" size="md" variant="secondary" onPress={() => save.mutate({ status: 'new' })} style={{ flex: 1 }} />
                    )}
                  </View>
                </View>
              ) : null}
              <Card style={{ gap: space.md }}>
                <TextField
                  label="Celebrant"
                  icon="person-outline"
                  value={celebrant ?? data.celebrant ?? ''}
                  onChangeText={setCelebrant}
                  editable={canEdit}
                  placeholder="e.g. Fr. Joseph"
                />
                {canEdit && celebrant !== null && celebrant !== (data.celebrant ?? '') ? (
                  <Button label="Save celebrant" size="md" onPress={() => save.mutate({ celebrant })} />
                ) : null}
              </Card>
              <Group title="Request">
                <KeyValue label="Requested by" value={data.fullName} icon="person-outline" />
                <RowDivider />
                <KeyValue label="Masses" value={String(data.numberOfMasses)} icon="albums-outline" />
                <RowDivider />
                <KeyValue label="Preferred date" value={data.preferredDate ? formatDate(data.preferredDate) : 'Any date'} icon="calendar-outline" />
                {data.donationAmount ? (
                  <>
                    <RowDivider />
                    <KeyValue label="Offering" value={/^\d+$/.test(data.donationAmount) ? formatTZS(Number(data.donationAmount)) : data.donationAmount} icon="heart-outline" />
                  </>
                ) : null}
                <RowDivider />
                <KeyValue label="Received" value={formatDateTime(data.createdAt)} icon="time-outline" />
              </Group>
              {data.intentionDetails ? (
                <Card style={{ gap: space.sm }}>
                  <Text variant="caption">Intention</Text>
                  <Text variant="body" selectable>
                    {data.intentionDetails}
                  </Text>
                </Card>
              ) : null}
            </>
          ) : null}

          {/* Message controls */}
          {kind === 'feedback' ? (
            <>
              {canEdit ? (
                <View style={{ gap: space.sm }}>
                  <Button
                    label="Reply by email"
                    icon="arrow-undo"
                    variant="gold"
                    onPress={() => {
                      Linking.openURL(`mailto:${data.email}?subject=${encodeURIComponent('Re: your message to Divine Mercy Retreat Center')}`).catch(() => undefined);
                      if (data.status !== 'replied') save.mutate({ status: 'replied' });
                    }}
                  />
                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    {data.status === 'new' ? <Button label="Mark read" size="md" variant="secondary" onPress={() => save.mutate({ status: 'read' })} style={{ flex: 1 }} /> : null}
                    {data.status !== 'archived' ? (
                      <Button label="Archive" icon="archive-outline" size="md" variant="secondary" onPress={() => save.mutate({ status: 'archived' })} style={{ flex: 1 }} />
                    ) : (
                      <Button label="Move to inbox" size="md" variant="secondary" onPress={() => save.mutate({ status: 'read' })} style={{ flex: 1 }} />
                    )}
                  </View>
                </View>
              ) : null}
              <Group title="Sender">
                <KeyValue label="Email" value={data.email} icon="mail-outline" />
                {data.phoneNumber ? (
                  <>
                    <RowDivider />
                    <KeyValue label="Phone" value={data.phoneNumber} icon="call-outline" />
                  </>
                ) : null}
                <RowDivider />
                <KeyValue label="Sent" value={formatDateTime(data.createdAt)} icon="time-outline" />
              </Group>
            </>
          ) : null}

          <Card style={{ gap: space.md }}>
            <TextField
              label="Private notes"
              multiline
              editable={canEdit}
              value={notes ?? data.adminNotes ?? ''}
              onChangeText={setNotes}
              placeholder={canEdit ? 'Only the team sees these notes' : 'No notes'}
            />
            {canEdit && notes !== null && notes !== (data.adminNotes ?? '') ? (
              <Button label="Save notes" size="md" loading={save.isPending} onPress={() => save.mutate({ adminNotes: notes })} />
            ) : null}
          </Card>
        </ScrollView>
      )}

      <Sheet visible={datePicker} onClose={() => setDatePicker(false)} title="Choose the Mass date">
        <View style={styles.dates}>
          {Array.from({ length: 28 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() + index);
            const value = isoDay(date);
            const current = data?.scheduledFor ? isoDay(new Date(data.scheduledFor)) === value : false;
            const preferred = data?.preferredDate ? isoDay(new Date(data.preferredDate)) === value : false;
            return (
              <View key={value} style={{ width: '25%', padding: 4 }}>
                <Button
                  label={`${date.toLocaleDateString('en-GB', { weekday: 'short' })} ${date.getDate()}`}
                  size="md"
                  variant={current ? 'primary' : preferred ? 'gold' : 'secondary'}
                  onPress={() => {
                    setDatePicker(false);
                    save.mutate({ scheduledFor: `${value}T08:00:00.000Z`, status: 'scheduled' });
                  }}
                  style={{ paddingHorizontal: 4 }}
                />
              </View>
            );
          })}
        </View>
        {data?.preferredDate ? (
          <View style={styles.legend}>
            <Icon name="star" size={14} color={colors.gold600} />
            <Text variant="small">Gold is the date the requester asked for.</Text>
          </View>
        ) : null}
        {data?.scheduledFor ? (
          <SheetOption label="Remove the date" icon="close-circle-outline" danger onPress={() => {
            setDatePicker(false);
            save.mutate({ scheduledFor: null, status: 'new' });
          }} />
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy900, borderColor: colors.navy800, gap: space.sm },
  amount: { fontFamily: fonts.bold, fontSize: 36, color: colors.white, letterSpacing: -0.8 },
  dates: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: space.md },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.md, padding: space.sm, borderRadius: radius.md, backgroundColor: colors.gold50 },
});
