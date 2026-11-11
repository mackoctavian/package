import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChips, IconButton, ListRow, SearchField, Sheet, SheetOption, toast } from '@/components/admin';
import { RangeCalendar } from '@/components/calendar';
import { ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Card, Icon, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { labelOf, LEAVE_TYPES, leaveRange, MEMBER_TYPES } from '@/lib/people';
import { useCan } from '@/lib/session';
import { colors, space } from '@/theme';

type MemberOption = { id: string; fullName: string; memberType: string };

const dayCount = (start: string, end: string) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;

/** Request leave for yourself (mode=self) or record it for a member (needs Leave: edit). */
export default function LeaveRequestScreen() {
  const params = useLocalSearchParams<{ mode?: 'self' | 'manage'; memberId?: string; memberName?: string }>();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const manage = params.mode !== 'self';
  const canManage = useCan('leave', 'edit');
  const [member, setMember] = useState<MemberOption | null>(params.memberId ? { id: params.memberId, fullName: params.memberName ?? 'Member', memberType: '' } : null);
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [leaveType, setLeaveType] = useState('annual');
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [approve, setApprove] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const members = useQuery({
    queryKey: ['leave', 'members'],
    enabled: manage,
    queryFn: ({ signal }) => api<{ members: MemberOption[] }>('/api/admin/leave?status=pending', { signal }).then((r) => r.members),
  });

  const submit = useMutation({
    mutationFn: () => {
      if (manage && !member) throw new Error('Choose who the leave is for.');
      if (!start) throw new Error('Choose the dates on the calendar.');
      const body = { leaveType, startDate: start, endDate: end ?? start, reason: reason.trim() || undefined };
      return manage
        ? api('/api/admin/leave', { method: 'POST', body: { ...body, memberId: member!.id, approve: canManage && approve } })
        : api('/api/admin/me/leave', { method: 'POST', body });
    },
    onSuccess: () => {
      toast(manage ? (approve ? 'Leave recorded and approved' : 'Leave request added') : 'Leave requested. Your manager will review it.');
      client.invalidateQueries({ queryKey: ['leave'] });
      client.invalidateQueries({ queryKey: ['my-leave'] });
      client.invalidateQueries({ queryKey: ['member'] });
      client.invalidateQueries({ queryKey: ['members'] });
      client.invalidateQueries({ queryKey: ['overview'] });
      router.back();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const term = search.trim().toLowerCase();
  const options = (members.data ?? []).filter((item) => !term || item.fullName.toLowerCase().includes(term));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ivory }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm }]}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <Text variant="subtitle" style={{ flex: 1, textAlign: 'center' }}>
          {manage ? 'Record leave' : 'Request leave'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />
        {manage ? (
          <View style={styles.group}>
            <ListRow
              title={member?.fullName ?? 'Choose a member'}
              subtitle={member?.memberType ? labelOf(MEMBER_TYPES, member.memberType) : 'Who is going on leave?'}
              leading={<Icon name="person-circle-outline" size={28} color={colors.navy600} />}
              onPress={params.memberId ? undefined : () => setPicker(true)}
            />
          </View>
        ) : null}

        <View style={{ gap: space.sm }}>
          <Text variant="label">Type of leave</Text>
          <View style={{ marginHorizontal: -space.xl }}>
            <FilterChips value={leaveType} onChange={setLeaveType} options={LEAVE_TYPES.map((item) => ({ value: item.value, label: item.label }))} />
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text variant="label" style={{ flex: 1 }}>
              Dates
            </Text>
            <Text variant="smallStrong" color={colors.gold700}>
              {start ? `${leaveRange(start, end ?? start)} · ${dayCount(start, end ?? start)} day${dayCount(start, end ?? start) === 1 ? '' : 's'}` : 'Tap the first and last day'}
            </Text>
          </View>
          <RangeCalendar
            start={start}
            end={end}
            onChange={(a, b) => {
              setStart(a);
              setEnd(b);
            }}
          />
        </View>

        <TextField label="Reason" value={reason} onChangeText={setReason} multiline placeholder="Optional. Only managers see this." />

        {manage && canManage ? (
          <Card style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Approve now</Text>
              <Text variant="small">Turn off to leave it waiting for review.</Text>
            </View>
            <Switch value={approve} onValueChange={setApprove} trackColor={{ true: colors.gold400, false: colors.navy100 }} thumbColor={colors.white} />
          </Card>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label={manage ? (approve && canManage ? 'Record approved leave' : 'Add request') : 'Send request'} icon="paper-plane" loading={submit.isPending} onPress={() => submit.mutate()} />
      </View>

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Who is going on leave?">
        <View style={{ gap: space.sm }}>
          <SearchField value={search} onChangeText={setSearch} placeholder="Search members" />
          {options.map((item) => (
            <SheetOption
              key={item.id}
              label={item.fullName}
              description={labelOf(MEMBER_TYPES, item.memberType)}
              selected={member?.id === item.id}
              onPress={() => {
                setMember(item);
                setPicker(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  group: { backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.ivory, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
