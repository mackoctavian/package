import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm, FilterChips, IconButton, ListRow, ListSkeleton, Sheet, SheetOption, toast } from '@/components/admin';
import { ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Icon, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { MEMBER_TYPES } from '@/lib/people';
import { useCan } from '@/lib/session';
import type { Member } from '@/lib/types';
import { colors, space } from '@/theme';

type AdminOption = { id: string; name: string; email: string; linkedMemberId: string | null };

type Draft = {
  fullName: string;
  memberType: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  startDate: string;
  annualLeaveDays: string;
  notes: string;
  adminUserId: string | null;
};

const EMPTY: Draft = { fullName: '', memberType: 'staff', position: '', department: '', phone: '', email: '', startDate: '', annualLeaveDays: '28', notes: '', adminUserId: null };

const toDraft = (member: Member): Draft => ({
  fullName: member.fullName,
  memberType: member.memberType,
  position: member.position ?? '',
  department: member.department ?? '',
  phone: member.phone ?? '',
  email: member.email ?? '',
  startDate: member.startDate?.slice(0, 10) ?? '',
  annualLeaveDays: String(member.annualLeaveDays),
  notes: member.notes ?? '',
  adminUserId: member.adminUserId,
});

/** Add a member to the directory, or edit one (?id=). Needs Members: edit. */
export default function MemberEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const canDelete = useCan('members', 'edit');
  const [draft, setDraft] = useState<Draft | null>(id ? null : EMPTY);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: ['member', id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => api<{ data: Member }>(`/api/admin/members/${id}`, { signal }).then((r) => r.data),
  });
  const admins = useQuery({
    queryKey: ['members', 'admins'],
    queryFn: ({ signal }) => api<{ admins: AdminOption[] }>('/api/admin/members?status=all&type=none', { signal }).then((r) => r.admins),
  });

  // Fill the form once the member loads (adjusting state during render, not in an effect).
  if (id && !draft && existing.data) setDraft(toDraft(existing.data));

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => (current ? { ...current, [key]: value } : current));

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error('Still loading.');
      if (!draft.fullName.trim()) throw new Error('Enter the member’s name.');
      if (draft.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate)) throw new Error('Write the start date as YYYY-MM-DD.');
      const body = {
        fullName: draft.fullName,
        memberType: draft.memberType,
        position: draft.position,
        department: draft.department,
        phone: draft.phone,
        email: draft.email,
        notes: draft.notes,
        startDate: draft.startDate || null,
        annualLeaveDays: Number(draft.annualLeaveDays || 0),
        adminUserId: draft.adminUserId ?? '',
      };
      return id
        ? api<{ data: Member }>(`/api/admin/members/${id}`, { method: 'PATCH', body })
        : api<{ data: Member }>('/api/admin/members', { method: 'POST', body });
    },
    onSuccess: (response) => {
      toast(id ? 'Member saved' : `${response.data.fullName} added`);
      client.invalidateQueries({ queryKey: ['members'] });
      client.invalidateQueries({ queryKey: ['member'] });
      client.invalidateQueries({ queryKey: ['my-leave'] });
      client.invalidateQueries({ queryKey: ['overview'] });
      if (id) router.back();
      else router.replace({ pathname: '/member/[id]', params: { id: response.data.id } });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/admin/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast('Member removed');
      client.invalidateQueries({ queryKey: ['members'] });
      client.invalidateQueries({ queryKey: ['leave'] });
      router.dismissTo('/members');
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const linked = admins.data?.find((admin) => admin.id === draft?.adminUserId);
  const linkable = (admins.data ?? []).filter((admin) => !admin.linkedMemberId || admin.linkedMemberId === id);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ivory }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm }]}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <Text variant="subtitle" style={{ flex: 1, textAlign: 'center' }}>
          {id ? 'Edit member' : 'New member'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      {!draft ? (
        existing.error ? (
          <View style={{ padding: space.xl }}>
            <ErrorBanner message={errorMessage(existing.error)} />
          </View>
        ) : (
          <ListSkeleton rows={6} />
        )
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={error} />
          <TextField label="Full name" required icon="person-outline" value={draft.fullName} onChangeText={(v) => set('fullName', v)} autoCapitalize="words" />
          <View style={{ gap: space.sm }}>
            <Text variant="label">Role in the community</Text>
            <View style={{ marginHorizontal: -space.xl }}>
              <FilterChips value={draft.memberType} onChange={(v) => set('memberType', v)} options={MEMBER_TYPES.map((item) => ({ value: item.value, label: item.label }))} />
            </View>
          </View>
          <TextField label="Position" icon="ribbon-outline" value={draft.position} onChangeText={(v) => set('position', v)} placeholder="e.g. Retreat director, Cook" />
          <TextField label="Department" icon="business-outline" value={draft.department} onChangeText={(v) => set('department', v)} placeholder="e.g. Hospitality" />
          <TextField label="Phone" icon="call-outline" value={draft.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
          <TextField label="Email" icon="mail-outline" value={draft.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <TextField label="Start date" icon="calendar-outline" value={draft.startDate} onChangeText={(v) => set('startDate', v)} placeholder="YYYY-MM-DD" hint="When they joined the centre. Optional." />
          <TextField
            label="Annual leave days"
            icon="airplane-outline"
            value={draft.annualLeaveDays}
            onChangeText={(v) => set('annualLeaveDays', v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            hint="Days of annual leave per calendar year."
          />
          <View style={{ gap: space.sm }}>
            <Text variant="label">Admin login</Text>
            <View style={styles.group}>
              <ListRow
                title={linked ? linked.name : 'Not linked'}
                subtitle={linked ? linked.email : 'Link a login so they can request their own leave.'}
                leading={<Icon name="key-outline" size={22} color={colors.navy600} />}
                onPress={() => setPicker(true)}
              />
            </View>
          </View>
          <TextField label="Notes" value={draft.notes} onChangeText={(v) => set('notes', v)} multiline placeholder="Private notes for managers" />
          {id && canDelete ? (
            <Button
              label="Remove from directory"
              variant="danger"
              icon="trash-outline"
              loading={remove.isPending}
              onPress={async () => {
                if (await confirm(`Remove ${draft.fullName}?`, 'Their leave history is deleted too. To keep it, mark them inactive instead.', 'Remove', true)) remove.mutate();
              }}
            />
          ) : null}
        </ScrollView>
      )}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label={id ? 'Save changes' : 'Add member'} icon="checkmark" loading={save.isPending} disabled={!draft?.fullName.trim()} onPress={() => save.mutate()} />
      </View>

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Link an admin login">
        <View style={{ gap: space.sm }}>
          <SheetOption
            label="Not linked"
            icon="close-circle-outline"
            selected={!draft?.adminUserId}
            onPress={() => {
              set('adminUserId', null);
              setPicker(false);
            }}
          />
          {linkable.map((admin) => (
            <SheetOption
              key={admin.id}
              label={admin.name}
              description={admin.email}
              selected={draft?.adminUserId === admin.id}
              onPress={() => {
                set('adminUserId', admin.id);
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
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.ivory, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
