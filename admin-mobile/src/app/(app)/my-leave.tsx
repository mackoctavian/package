import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { confirm, ErrorState, Group, ListRow, ListSkeleton, Progress, RowDivider, StackHeader, StatusPill, toast } from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { Button, Card, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { labelOf, LEAVE_TYPES, leaveRange } from '@/lib/people';
import type { LeaveRequest } from '@/lib/types';
import { colors, space } from '@/theme';

type MyLeave = { member: { id: string; fullName: string; annualLeaveDays: number }; annualLeaveUsed: number; requests: LeaveRequest[] } | null;

const todayIso = () => new Date().toISOString().slice(0, 10);

/** The signed-in person's own leave. Open to everyone whose login is linked to a member profile. */
export default function MyLeaveScreen() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['my-leave'],
    queryFn: ({ signal }) => api<{ data: MyLeave }>('/api/admin/me/leave', { signal }).then((r) => r.data),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api(`/api/admin/leave/${id}`, { method: 'PATCH', body: { status: 'cancelled' } }),
    onSuccess: () => {
      toast('Leave cancelled');
      client.invalidateQueries({ queryKey: ['my-leave'] });
      client.invalidateQueries({ queryKey: ['leave'] });
      client.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const data = query.data;
  const left = data ? Math.max(data.member.annualLeaveDays - data.annualLeaveUsed, 0) : 0;
  const today = todayIso();
  const cancellable = (item: LeaveRequest) => item.status === 'pending' || (item.status === 'approved' && item.startDate > today);

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title="My leave" />
      {query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : !data ? (
        <EmptyState
          icon="link-outline"
          title="Not linked yet"
          body="Your login is not linked to a member profile, so you can’t request leave here. Ask an administrator to link it in Members."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}>
          <Card style={{ gap: space.sm, backgroundColor: colors.navy900, borderColor: colors.navy800 }}>
            <Text variant="caption" color={colors.gold300}>
              Annual leave {new Date().getFullYear()}
            </Text>
            <Text variant="title" color={colors.white}>
              {left} day{left === 1 ? '' : 's'} left
            </Text>
            <Text variant="small" color={colors.navy200}>
              {data.annualLeaveUsed} of {data.member.annualLeaveDays} days used or booked
            </Text>
            <Progress value={data.member.annualLeaveDays ? data.annualLeaveUsed / data.member.annualLeaveDays : 0} tone={left <= 2 ? 'danger' : 'gold'} />
          </Card>

          <Button label="Request leave" icon="airplane-outline" onPress={() => router.push({ pathname: '/leave-request', params: { mode: 'self' } })} />

          {data.requests.length ? (
            <Group title="Your requests">
              {data.requests.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <RowDivider /> : null}
                  <ListRow
                    title={`${labelOf(LEAVE_TYPES, item.leaveType)} · ${item.days} day${item.days === 1 ? '' : 's'}`}
                    subtitle={[leaveRange(item.startDate, item.endDate), item.reviewNote].filter(Boolean).join(' · ')}
                    trailing={<StatusPill status={item.status} label={item.status === 'rejected' ? 'declined' : item.status} />}
                    chevron={false}
                    onPress={
                      cancellable(item)
                        ? async () => {
                            if (await confirm('Cancel this leave?', `${labelOf(LEAVE_TYPES, item.leaveType)}, ${leaveRange(item.startDate, item.endDate)}.`, 'Cancel leave', true)) cancel.mutate(item.id);
                          }
                        : undefined
                    }
                  />
                </View>
              ))}
            </Group>
          ) : (
            <Text variant="small" center>
              You have no leave requests yet.
            </Text>
          )}
          {data.requests.some(cancellable) ? (
            <Text variant="small" center style={{ fontSize: 12 }}>
              Tap a pending or upcoming request to cancel it.
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
