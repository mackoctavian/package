import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OfflineNotice } from '@/components/feedback';
import { ScreenHeader } from '@/components/headers';
import { Icon, Img, PressableScale, Text } from '@/components/ui';
import { useMinistries } from '@/lib/api';
import { colors, radius, shadow, space } from '@/theme';

export default function MinistriesScreen() {
  const { data } = useMinistries();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title="Ministries" subtitle="Every way we serve the Church" />
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 60, gap: space.md }}
        ListHeaderComponent={<OfflineNotice visible={data?.offline} style={{ marginBottom: space.sm }} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).springify()}>
            <PressableScale onPress={() => router.push({ pathname: '/ministry/[slug]', params: { slug: item.slug } })} style={styles.row} accessibilityRole="button" accessibilityLabel={item.title}>
              <Img uri={item.heroImage} style={styles.image} />
              <View style={{ flex: 1, gap: 4, paddingVertical: space.md, paddingRight: space.md }}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {item.title}
                </Text>
                <Text variant="small" numberOfLines={2}>
                  {item.shortDescription}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.subtle} style={{ marginRight: space.md }} />
            </PressableScale>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow.soft },
  image: { width: 96, height: 104 },
});
