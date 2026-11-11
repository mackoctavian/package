import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Avatar, confirm, ErrorState, FilterChips, IconButton, ListSkeleton, Sheet, StackHeader, StatusPill, toast, ViewOnlyNote } from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Card, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { labelOf, LEAVE_TYPES, leaveRange } from '@/lib/people';
import { useCan } from '@/lib/session';
import type { LeaveRequest } from '@/lib/types';
import { colors, fonts, radius, space } from '@/theme';

type LeaveResponse = { data: LeaveRequest[]; counts: Record<string, number>; upcoming: LeaveRequest[]; today: string };

export default function Leave() {
  const canEdit = useCan('leave', 'edit');
  const client = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [open, setOpen] = useState<LeaveRequest | null>(null);
  const [note, setNote] = useState('');

  const query = useQuery({
    queryKey: ['leave', status],
    queryFn: ({ signal }) => api<LeaveResponse>(`/api/admin/leave?status=${status}`, { signal }),
  });

  const review = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'approved' | 'rejected' | 'cancelled' }) =>
      api(`/api/admin/leave/${id}`, { method: 'PATCH', body: { status: next, ...(note.trim() ? { reviewNote: note.trim() } : null) } }),
    onSuccess: (_data, { next }) => {
      toast(next === 'approved' ? 'Leave approved' : next === 'rejected' ? 'Leave declined' : 'Leave cancelled');
      setOpen(null);
      setNote('');
      client.invalidateQueries({ queryKey: ['leave'] });
      client.invalidateQueries({ queryKey: ['members'] });
      client.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const data = query.data;
  const today = data?.today ?? '';
  const awayNow = (data?.upcoming ?? []).filter((item) => item.startDate <= today);
  const soon = (data?.upcoming ?? []).filter((item) => item.startDate > today);

  const header = data && (awayNow.length || soon.length) ? (
    <View style={{ paddingHorizontal: space.xl, marginBottom: space.md }}>
      <Card style={styles.away}>
        <Text variant="caption" color={colors.gold300}>
          Away now · {awayNow.length}
        </Text>
        {awayNow.length ? (
          awayNow.map((item) => (
            <Text key={item.id} variant="bodyStrong" color={colors.white} numberOfLines={1}>
              {item.member.fullName}
              <Text variant="small" color={colors.navy200}>
                {'  '}back after {leaveRange(item.endDate, item.endDate)}
              </Text>
            </Text>
          ))
        ) : (
          <Text variant="small" color={colors.navy200}>
            Everyone is in today.
          </Text>
        )}
        {soon.length ? (
          <>
            <Text variant="caption" color={colors.gold300} style={{ marginTop: space.sm }}>
              Next two weeks
            </Text>
            {soon.map((item) => (
              <Text key={item.id} variant="small" color={colors.navy100} numberOfLines={1}>
                {item.member.fullName} · {leaveRange(item.startDate, item.endDate)}
              </Text>
            ))}
          </>
        ) : null}
      </Card>
    </View>
  ) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <StackHeader
        title="Leave requests"
        subtitle={data?.counts.pending ? `${data.counts.pending} waiting for review` : undefined}
        right={canEdit ? <IconButton icon="add" label="Record leave" tone="dark" onPress={() => router.push({ pathname: '/leave-request', params: { mode: 'manage' } })} /> : null}
      />
      <View style={{ marginBottom: space.md }}>
        <FilterChips
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: 'To review', count: data?.counts.pending ?? 0 },
            { value: 'approved', label: 'Approved', count: data?.counts.approved ?? 0 },
            { value: 'rejected', label: 'Declined', count: data?.counts.rejected ?? 0 },
            { value: 'cancelled', label: 'Cancelled', count: data?.counts.cancelled ?? 0 },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <Pressable onPress={() => setOpen(item)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.navy50 }]}>
              <Avatar name={item.member.fullName} size={42} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.member.fullName}
                </Text>
                <Text variant="small" numberOfLines={1}>
                  {labelOf(LEAVE_TYPES, item.leaveType)} · {leaveRange(item.startDate, item.endDate)} · {item.days} day{item.days === 1 ? '' : 's'}
                </Text>
                <StatusPill status={item.status} label={item.status === 'rejected' ? 'declined' : item.status} style={{ marginTop: 2 }} />
              </View>
              {canEdit && item.status === 'pending' ? (
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <IconButton icon="close" label="Decline" size={38} onPress={() => setOpen(item)} />
                  <IconButton icon="checkmark" label="Approve" size={38} tone="dark" onPress={() => review.mutate({ id: item.id, next: 'approved' })} />
                </View>
              ) : null}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          ListEmptyComponent={<EmptyState icon="airplane-outline" title={status === 'pending' ? 'Nothing to review' : 'No leave here'} body={status === 'pending' ? 'New requests from the team show up here.' : undefined} />}
        />
      )}

      <Sheet visible={Boolean(open)} onClose={() => setOpen(null)} title={open?.member.fullName}>
        {open ? (
          <View style={{ gap: space.md, paddingBottom: space.sm }}>
            <View style={styles.summary}>
              <Text style={styles.days}>{open.days}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{labelOf(LEAVE_TYPES, open.leaveType)}</Text>
                <Text variant="small">{leaveRange(open.startDate, open.endDate)}</Text>
              </View>
              <StatusPill status={open.status} label={open.status === 'rejected' ? 'declined' : open.status} />
            </View>
            {open.leaveType === 'annual' ? (
              <Text variant="small">Annual allowance: {open.member.annualLeaveDays} days a year.</Text>
            ) : null}
            {open.reason ? (
              <Card>
                <Text variant="caption">Reason</Text>
                <Text variant="body">{open.reason}</Text>
              </Card>
            ) : null}
            {open.reviewedByName ? (
              <Text variant="small">
                Reviewed by {open.reviewedByName}
                {open.reviewNote ? `: “${open.reviewNote}”` : ''}
              </Text>
            ) : null}
            {canEdit ? (
              <>
                {open.status === 'pending' || open.status === 'approved' ? (
                  <TextField label="Note to include" value={note} onChangeText={setNote} placeholder="Optional" />
                ) : null}
                {open.status === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    <Button label="Decline" variant="danger" size="md" style={{ flex: 1 }} loading={review.isPending && review.variables?.next === 'rejected'} onPress={() => review.mutate({ id: open.id, next: 'rejected' })} />
                    <Button label="Approve" size="md" icon="checkmark" style={{ flex: 1 }} loading={review.isPending && review.variables?.next === 'approved'} onPress={() => review.mutate({ id: open.id, next: 'approved' })} />
                  </View>
                ) : null}
                {open.status === 'approved' ? (
                  <Button
                    label="Cancel this leave"
                    variant="secondary"
                    size="md"
                    onPress={async () => {
                      if (await confirm('Cancel this leave?', `${open.member.fullName} will be marked as working on these days.`, 'Cancel leave', true)) review.mutate({ id: open.id, next: 'cancelled' });
                    }}
                  />
                ) : null}
                <Button label="Open member profile" variant="ghost" size="md" onPress={() => {
                  setOpen(null);
                  router.push({ pathname: '/member/[id]', params: { id: open.memberId } });
                }} />
              </>
            ) : (
              <ViewOnlyNote />
            )}
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 14 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.xl + 42 + space.md },
  away: { backgroundColor: colors.navy900, borderColor: colors.navy800, gap: 4 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  days: { fontFamily: fonts.bold, fontSize: 30, color: colors.navy900, minWidth: 40, textAlign: 'center' },
});
