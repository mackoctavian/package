import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useT } from '@/i18n';
import { useAppStore } from '@/lib/store';
import { colors } from '@/theme';

export default function TabLayout() {
  const onboarded = useAppStore((s) => s.onboarded);
  const t = useT();
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ivory }, animation: 'fade' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="retreats" options={{ title: t('tabs.retreats') }} />
      <Tabs.Screen name="give" options={{ title: t('tabs.give') }} />
      <Tabs.Screen name="shop" options={{ title: t('tabs.shop') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.more') }} />
    </Tabs>
  );
}
