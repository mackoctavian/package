import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { TextField } from '@/components/form';
import { LanguagePicker } from '@/components/LanguagePicker';
import { TabHeader } from '@/components/TabHeader';
import { Button, Card, Divider, Icon, type IconName, Text } from '@/components/ui';
import { useT } from '@/i18n';
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
  const t = useT();
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
      <TabHeader eyebrow={t('more.eyebrow')} title={t('more.title')} />
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
              <Text variant="subtitle">{profile.fullName || t('more.welcome')}</Text>
              <Text variant="small" numberOfLines={1}>
                {profile.email || t('more.saveHint')}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setDraft(profile);
                setEditing((value) => !value);
              }}
              hitSlop={10}>
              <Text variant="smallStrong" color={colors.gold600}>
                {editing ? t('common.close') : t('common.edit')}
              </Text>
            </Pressable>
          </View>
          {editing ? (
            <Animated.View entering={FadeIn} style={{ gap: space.md }}>
              <TextField label={t('common.fields.fullName')} value={draft.fullName} onChangeText={(v) => setDraft((d) => ({ ...d, fullName: v }))} />
              <TextField label={t('common.fields.email')} keyboardType="email-address" autoCapitalize="none" value={draft.email} onChangeText={(v) => setDraft((d) => ({ ...d, email: v }))} />
              <TextField label={t('common.fields.phone')} keyboardType="phone-pad" value={draft.phone} onChangeText={(v) => setDraft((d) => ({ ...d, phone: v }))} />
              <Button
                label={t('more.saveDetails')}
                size="md"
                onPress={() => {
                  actions.saveProfile(draft);
                  haptic.success();
                  setEditing(false);
                }}
              />
              <Text variant="small">{t('more.keptHere')}</Text>
            </Animated.View>
          ) : null}
        </Card>

        <View style={{ gap: space.sm }}>
          <Text variant="caption" style={{ marginLeft: space.xs }}>
            {t('language.title')}
          </Text>
          <Card>
            <LanguagePicker />
          </Card>
        </View>

        <Group
          title={t('more.activity')}
          items={[
            { label: t('more.tickets'), icon: 'ticket-outline', onPress: go('/tickets'), value: tickets ? String(tickets) : undefined },
            { label: t('more.cart'), icon: 'bag-outline', onPress: go('/cart'), value: cart ? String(cart) : undefined },
            { label: t('more.history'), icon: 'receipt-outline', onPress: go('/give') },
          ]}
        />
        <Group
          title={t('more.explore')}
          items={[
            { label: t('more.gallery'), icon: 'images-outline', onPress: go('/gallery') },
            { label: t('more.news'), icon: 'newspaper-outline', onPress: go('/news') },
            { label: t('more.ministries'), icon: 'people-outline', onPress: go('/ministries') },
            { label: t('more.about'), icon: 'information-circle-outline', onPress: go('/about') },
            { label: t('more.website'), icon: 'globe-outline', onPress: () => WebBrowser.openBrowserAsync(t.locale === 'sw' ? `${API_URL}/sw` : API_URL).catch(() => undefined) },
          ]}
        />
        {site ? (
          <Group
            title={t('more.contact')}
            items={[
              { label: t('more.callOffice'), icon: 'call-outline', value: site.contact.phone, onPress: () => Linking.openURL(site.contact.phoneHref) },
              { label: t('more.emailUs'), icon: 'mail-outline', onPress: () => Linking.openURL(`mailto:${site.contact.email}`) },
              { label: t('more.directions'), icon: 'navigate-outline', onPress: () => Linking.openURL(site.contact.mapsHref) },
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
          title={t('more.app')}
          items={[
            { label: t('more.tour'), icon: 'play-circle-outline', onPress: () => {
                actions.resetOnboarding();
                router.replace('/onboarding');
              },
            },
            {
              label: t('more.clear'),
              icon: 'trash-outline',
              onPress: () =>
                Alert.alert(t('more.clearTitle'), t('more.clearText'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('more.clearConfirm'), style: 'destructive', onPress: () => actions.clearAll() },
                ]),
            },
          ]}
        />
        <Text variant="small" center>
          {t('more.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
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
