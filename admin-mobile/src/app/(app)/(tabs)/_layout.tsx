import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { can, canScan, useSession } from '@/lib/session';
import { colors } from '@/theme';

/** Tabs follow the admin's access: a door volunteer sees Home, Scan and More only. */
export default function TabLayout() {
  const user = useSession((s) => s.user);
  const showBookings = can(user, 'retreats');
  const showScan = canScan(user);
  const showGiving = can(user, 'donations') || can(user, 'mass-intentions');

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ivory }, animation: 'fade' }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Protected guard={showBookings}>
        <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      </Tabs.Protected>
      <Tabs.Protected guard={showScan}>
        <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      </Tabs.Protected>
      <Tabs.Protected guard={showGiving}>
        <Tabs.Screen name="giving" options={{ title: 'Giving' }} />
      </Tabs.Protected>
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
