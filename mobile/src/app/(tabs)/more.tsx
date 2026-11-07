import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { TextField } from '@/components/form';
import { TabHeader } from '@/components/TabHeader';
import { Button, Card, Divider, Icon, type IconName, Text } from '@/components/ui';
import { useHome } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { haptic } from '@/lib/haptics';
import { actions, cartCount, useAppStore } from '@/lib/store';
import { colors, space, TAB_BAR_SPACE } from '@/theme';

type Item = { label: string; icon: IconName; onPress: () => void; value?: string };

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="caption" style={{ marginLeft: space.xs }}>
        {title}
      </Text>
      <Card padded={false}>
        {items.map((item, index) => (
          <View key={item.label}>
            {index ? <Divider style={{ marginLeft: 60 }} /> : null}
            <Pressable onPress={item.onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.navy50 }]} accessibilityRole="button">
              <View style={styles.rowIcon}>
                <Icon name={item.icon} size={18} color={colors.navy700} />
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {item.label}
              </Text>
              {item.value ? <Text variant="small">{item.value}</Text> : null}
              <Icon name="chevron-forward" size={16} color={colors.subtle} />
            </Pressable>
          </View>
        ))}
      </Card>
    </View>
  );
}

const socialIcons: Record<string, IconName> = { facebook: 'logo-facebook', instagram: 'logo-instagram', youtube: 'logo-youtube' };

export default function MoreScreen() {
  const { data } = useHome();
  const site = data?.data.site;
  const profile = useAppStore((s) => s.profile);
  const tickets = useAppStore((s) => s.tickets.length);
  const cart = useAppStore((s) => cartCount(s.cart));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const go = (href: Href) => () => router.push(href);
  const initials = profile.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.ivory }} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }} showsVerticalScrollIndicator={false}>
      <TabHeader eyebrow="Divine Mercy Retreat Center" title="More" />
      <View style={{ paddingHorizontal: space.xl, gap: space.xl }}>
        <Card style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={styles.avatar}>
              {initials ? (
                <Text variant="heading" color={colors.gold300}>
                  {initials}
                </Text>
              ) : (
                <Icon name="person" size={24} color={colors.gold300} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="subtitle">{profile.fullName || 'Welcome, friend'}</Text>
              <Text variant="small" numberOfLines={1}>
                {profile.email || 'Save your details to fill forms faster'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setDraft(profile);
                setEditing((value) => !value);
              }}
              hitSlop={10}>
              <Text variant="smallStrong" color={colors.gold600}>
                {editing ? 'Close' : 'Edit'}
              </Text>
            </Pressable>
          </View>
          {editing ? (
            <Animated.View entering={FadeIn} style={{ gap: space.md }}>
              <TextField label="Full name" value={draft.fullName} onChangeText={(v) => setDraft((d) => ({ ...d, fullName: v }))} />
              <TextField label="Email" keyboardType="email-address" autoCapitalize="none" value={draft.email} onChangeText={(v) => setDraft((d) => ({ ...d, email: v }))} />
              <TextField label="Phone" keyboardType="phone-pad" value={draft.phone} onChangeText={(v) => setDraft((d) => ({ ...d, phone: v }))} />
              <Button
                label="Save details"
                size="md"
                onPress={() => {
                  actions.saveProfile(draft);
                  haptic.success();
                  setEditing(false);
                }}
              />
              <Text variant="small">Kept only on this phone and used to pre-fill bookings and gifts.</Text>
            </Animated.View>
          ) : null}
        </Card>

        <Group
          title="My activity"
          items={[
            { label: 'My retreat tickets', icon: 'ticket-outline', onPress: go('/tickets'), value: tickets ? String(tickets) : undefined },
            { label: 'Cart', icon: 'bag-outline', onPress: go('/cart'), value: cart ? String(cart) : undefined },
            { label: 'Giving history', icon: 'receipt-outline', onPress: go('/give') },
          ]}
        />
        <Group
          title="Explore"
          items={[
            { label: 'Gallery', icon: 'images-outline', onPress: go('/gallery') },
            { label: 'News & stories', icon: 'newspaper-outline', onPress: go('/news') },
            { label: 'Ministries', icon: 'people-outline', onPress: go('/ministries') },
            { label: 'About DMRC', icon: 'information-circle-outline', onPress: go('/about') },
            { label: 'Visit the website', icon: 'globe-outline', onPress: () => WebBrowser.openBrowserAsync(API_URL).catch(() => undefined) },
          ]}
        />
        {site ? (
          <Group
            title="Contact"
            items={[
              { label: 'Call the office', icon: 'call-outline', value: site.contact.phone, onPress: () => Linking.openURL(site.contact.phoneHref) },
              { label: 'Email us', icon: 'mail-outline', onPress: () => Linking.openURL(`mailto:${site.contact.email}`) },
              { label: 'Get directions', icon: 'navigate-outline', onPress: () => Linking.openURL(site.contact.mapsHref) },
            ]}
          />
        ) : null}

        {site?.social.length ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.md }}>
            {site.social.map((social) => (
              <Pressable
                key={social.label}
                onPress={() => WebBrowser.openBrowserAsync(social.href).catch(() => undefined)}
                style={styles.social}
                accessibilityLabel={social.label}>
                <Icon name={socialIcons[social.icon] ?? 'link-outline'} size={20} color={colors.navy800} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Group
          title="App"
          items={[
            { label: 'Replay the welcome tour', icon: 'play-circle-outline', onPress: () => {
                actions.resetOnboarding();
                router.replace('/onboarding');
              },
            },
            {
              label: 'Clear data on this phone',
              icon: 'trash-outline',
              onPress: () =>
                Alert.alert('Clear saved data?', 'This removes saved tickets, cart, receipts and your details from this phone. Your bookings stay with DMRC.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => actions.clearAll() },
                ]),
            },
          ]}
        />
        <Text variant="small" center>
          DMRC · version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navy900, alignItems: 'center', justifyContent: 'center' },
  social: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
