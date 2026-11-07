import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, confirm, Group, ListRow, RowDivider, Sheet, StatusPill, TabHeader } from '@/components/admin';
import { Card, Icon, type IconName, PressableScale, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { can, session, useSession } from '@/lib/session';
import type { ModuleId } from '@/lib/types';
import { colors, radius, space, TAB_BAR_SPACE } from '@/theme';

type Href = Parameters<typeof router.push>[0];
/** Items without a module are shown to everyone. */
type Item = { label: string; icon: IconName; href: Href; module?: ModuleId; hint?: string };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Retreats',
    items: [
      { label: 'Retreats', icon: 'leaf-outline', href: '/retreats', module: 'retreats', hint: 'Sessions, capacity and registration' },
    ],
  },
  {
    title: 'Inbox',
    items: [{ label: 'Messages', icon: 'mail-outline', href: '/inbox', module: 'feedback', hint: 'Contact form messages' }],
  },
  {
    title: 'Website content',
    items: [
      { label: 'Publications', icon: 'book-outline', href: { pathname: '/content/[type]', params: { type: 'publications' } }, module: 'publications', hint: 'Books and the bookshop' },
      { label: 'News', icon: 'newspaper-outline', href: { pathname: '/content/[type]', params: { type: 'news' } }, module: 'news' },
      { label: 'Events', icon: 'calendar-outline', href: { pathname: '/content/[type]', params: { type: 'events' } }, module: 'events' },
      { label: 'Articles', icon: 'document-text-outline', href: { pathname: '/content/[type]', params: { type: 'articles' } }, module: 'articles' },
    ],
  },
  {
    title: 'Organisation',
    items: [
      { label: 'Members', icon: 'people-circle-outline', href: '/members', module: 'members', hint: 'Priests, sisters, staff and volunteers' },
      { label: 'Leave requests', icon: 'airplane-outline', href: '/leave', module: 'leave', hint: 'Approve leave and see who is away' },
      { label: 'My leave', icon: 'sunny-outline', href: '/my-leave', hint: 'Your balance and requests' },
      { label: 'Team & access', icon: 'people-outline', href: '/team', module: 'team', hint: 'Invite people and set their access' },
      { label: 'Activity log', icon: 'pulse-outline', href: '/activity', module: 'team', hint: 'Who did what, and when' },
    ],
  },
];

export default function More() {
  const user = useSession((s) => s.user);
  const client = useQueryClient();
  const [accessOpen, setAccessOpen] = useState(false);
  if (!user) return null;

  const signOut = async () => {
    if (!(await confirm('Sign out?', 'You will need your password to sign in again on this phone.', 'Sign out', true))) return;
    api('/api/mobile/admin/session', { method: 'DELETE' }).catch(() => undefined);
    client.clear();
    await session.clear();
  };

  const sections = SECTIONS.map((section) => ({ ...section, items: section.items.filter((item) => !item.module || can(user, item.module)) })).filter((section) => section.items.length);
  const groups = user.role === 'SUPERADMIN' ? [] : Array.from(new Set(user.access.map((entry) => entry.group)));

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + space.lg }}>
      <TabHeader eyebrow="DMRC Admin" title="More" />
      <View style={{ paddingHorizontal: space.xl, gap: space.xxl }}>
        <PressableScale onPress={() => router.push('/account')} scaleTo={0.98}>
          <Card style={styles.profile}>
            <Avatar name={user.name} size={56} tone="gold" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="subtitle" color={colors.white} numberOfLines={1}>
                {user.name}
              </Text>
              <Text variant="small" color={colors.navy200} numberOfLines={1}>
                {user.email}
              </Text>
              <View style={styles.role}>
                <Icon name={user.role === 'SUPERADMIN' ? 'shield-checkmark' : user.role === 'VIEWER' ? 'eye' : 'shield-half'} size={12} color={colors.navy950} />
                <Text variant="smallStrong" color={colors.navy950} style={{ fontSize: 12 }}>
                  {user.roleLabel}
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.navy300} />
          </Card>
        </PressableScale>

        <Group title="Your access" action={user.role === 'SUPERADMIN' ? undefined : 'Details'} onAction={() => setAccessOpen(true)}>
          <View style={{ padding: space.lg, gap: space.sm }}>
            <Text variant="small">
              {user.role === 'SUPERADMIN'
                ? 'As an Owner you can see and change everything, including who has access.'
                : user.role === 'VIEWER'
                  ? `You can view ${user.access.length} areas. Ask an Owner if you need to make changes.`
                  : `You can edit ${user.access.filter((entry) => entry.level === 'edit').length} and view ${user.access.filter((entry) => entry.level === 'view').length} areas.`}
            </Text>
          </View>
        </Group>

        {sections.map((section) => (
          <Group key={section.title} title={section.title}>
            {section.items.map((item, index) => (
              <View key={item.label}>
                {index > 0 ? <RowDivider /> : null}
                <ListRow
                  title={item.label}
                  subtitle={item.hint}
                  leading={
                    <View style={styles.menuIcon}>
                      <Icon name={item.icon} size={18} color={colors.navy700} />
                    </View>
                  }
                  trailing={item.module && !can(user, item.module, 'edit') ? <StatusPill status="view" label="view only" /> : undefined}
                  onPress={() => router.push(item.href)}
                />
              </View>
            ))}
          </Group>
        ))}

        <Group title="App">
          <ListRow
            title="Open the web admin"
            subtitle="Homepage, gallery, ministries and Excel exports"
            leading={
              <View style={styles.menuIcon}>
                <Icon name="desktop-outline" size={18} color={colors.navy700} />
              </View>
            }
            onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/admin`).catch(() => undefined)}
          />
          <RowDivider />
          <ListRow
            title="Account & password"
            leading={
              <View style={styles.menuIcon}>
                <Icon name="key-outline" size={18} color={colors.navy700} />
              </View>
            }
            onPress={() => router.push('/account')}
          />
          <RowDivider />
          <ListRow
            title="Sign out"
            leading={
              <View style={[styles.menuIcon, { backgroundColor: colors.dangerSoft }]}>
                <Icon name="log-out-outline" size={18} color={colors.danger} />
              </View>
            }
            chevron={false}
            onPress={signOut}
          />
        </Group>

        <Text variant="small" center style={{ fontSize: 12 }}>
          DMRC Admin {Constants.expoConfig?.version ?? ''} · {API_URL.replace(/^https?:\/\//, '')}
        </Text>
      </View>

      <Sheet visible={accessOpen} onClose={() => setAccessOpen(false)} title="What you can do">
        {groups.map((group) => (
          <View key={group} style={{ marginBottom: space.md }}>
            <Text variant="caption" style={{ marginBottom: space.sm, marginLeft: space.xs }}>
              {group}
            </Text>
            <View style={styles.accessGroup}>
              {user.access
                .filter((entry) => entry.group === group)
                .map((entry, index) => (
                  <View key={entry.id}>
                    {index > 0 ? <RowDivider /> : null}
                    <ListRow title={entry.label} chevron={false} trailing={<StatusPill status={entry.level} label={entry.level === 'edit' ? 'Can edit' : 'View only'} />} />
                  </View>
                ))}
            </View>
          </View>
        ))}
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.lg, backgroundColor: colors.navy900, borderColor: colors.navy800 },
  role: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.gold300 },
  menuIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
  accessGroup: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
