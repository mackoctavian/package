import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Avatar, confirm, ErrorState, Group, IconButton, KeyValue, ListRow, ListSkeleton, Progress, RowDivider, StackHeader, StatusPill, toast } from '@/components/admin';
import { ContactBar } from '@/components/contact';
import { Button, Card, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { labelOf, LEAVE_TYPES, leaveRange, MEMBER_TYPES } from '@/lib/people';
import { useCan } from '@/lib/session';
import type { LeaveRequest, Member } from '@/lib/types';
import { colors, space } from '@/theme';

export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const canEdit = useCan('members', 'edit');
  const canLeave = useCan('leave', 'edit');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['member', id],
    queryFn: ({ signal }) => api<{ data: Member & { leave: LeaveRequest[] } }>(`/api/admin/members/${id}`, { signal }).then((r) => r.data),
  });

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/api/admin/members/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      toast('Member updated');
      client.invalidateQueries({ queryKey: ['member', id] });
      client.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const data = query.data;
  const left = data ? Math.max(data.annualLeaveDays - data.annualLeaveUsed, 0) : 0;

  return (
    <View style={{ flex: 1 }}>
      <StackHeader
        title="Member"
        right={canEdit && data ? <IconButton icon="create-outline" label="Edit" onPress={() => router.push({ pathname: '/member/edit', params: { id } })} /> : null}
      />
      {query.isLoading ? (
        <ListSkeleton rows={5} />
      ) : query.error || !data ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}>
          <View style={{ alignItems: 'center', gap: space.sm }}>
            <Avatar name={data.fullName} size={76} tone="gold" />
            <Text variant="title" center>
              {data.fullName}
            </Text>
            <Text variant="small" center>
              {[data.position || labelOf(MEMBER_TYPES, data.memberType), data.department].filter(Boolean).join(' · ')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <StatusPill status={labelOf(MEMBER_TYPES, data.memberType)} tone="navy" />
              <StatusPill status={data.status} />
              {data.adminUser ? <StatusPill status="admin login" tone="gold" label="Has admin login" /> : null}
            </View>
          </View>

          <ContactBar phone={data.phone} email={data.email} />

          <Card style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text variant="subtitle" style={{ flex: 1 }}>
                Annual leave {new Date().getFullYear()}
              </Text>
              <Text variant="smallStrong" color={colors.gold700}>
                {left} of {data.annualLeaveDays} days left
              </Text>
            </View>
            <Progress value={data.annualLeaveDays ? data.annualLeaveUsed / data.annualLeaveDays : 0} tone={left <= 2 ? 'danger' : 'gold'} />
            {canLeave ? (
              <Button
                label="Record leave"
                icon="airplane-outline"
                size="md"
                variant="secondary"
                style={{ marginTop: space.sm }}
                onPress={() => router.push({ pathname: '/leave-request', params: { mode: 'manage', memberId: data.id, memberName: data.fullName } })}
              />
            ) : null}
          </Card>

          {data.leave.length ? (
            <Group title="Leave history">
              {data.leave.slice(0, 12).map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <RowDivider /> : null}
                  <ListRow
                    title={`${labelOf(LEAVE_TYPES, item.leaveType)} · ${item.days} day${item.days === 1 ? '' : 's'}`}
                    subtitle={leaveRange(item.startDate, item.endDate)}
                    trailing={<StatusPill status={item.status} label={item.status === 'rejected' ? 'declined' : item.status} />}
                    chevron={false}
                  />
                </View>
              ))}
            </Group>
          ) : null}

          <Group title="Details">
            <KeyValue label="Phone" value={data.phone} icon="call-outline" />
            <KeyValue label="Email" value={data.email} icon="mail-outline" />
            <KeyValue label="Started" value={data.startDate ? formatDate(data.startDate) : null} icon="calendar-outline" />
            <KeyValue label="Admin login" value={data.adminUser?.email} icon="key-outline" />
          </Group>

          {data.notes ? (
            <Card style={{ gap: space.sm }}>
              <Text variant="caption">Notes</Text>
              <Text variant="body">{data.notes}</Text>
            </Card>
          ) : null}

          {canEdit ? (
            <Button
              label={data.status === 'active' ? 'Mark as inactive' : 'Mark as active'}
              variant={data.status === 'active' ? 'danger' : 'secondary'}
              icon={data.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              loading={update.isPending}
              onPress={async () => {
                if (data.status === 'active' && !(await confirm(`Mark ${data.fullName} inactive?`, 'They stay in the directory with their leave history but drop out of active lists.', 'Mark inactive', true))) return;
                update.mutate({ status: data.status === 'active' ? 'inactive' : 'active' });
              }}
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
