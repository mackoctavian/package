import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { TabHeader } from '@/components/TabHeader';
import { Card, Icon, Img, PressableScale, ScrimGradient, Text } from '@/components/ui';
import { givingFunds, imagery } from '@/data/content';
import { formatDate, formatTZS } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { colors, radius, shadow, space, TAB_BAR_SPACE } from '@/theme';

export default function GiveScreen() {
  const receipts = useAppStore((s) => s.receipts);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.ivory }} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }} showsVerticalScrollIndicator={false}>
      <TabHeader eyebrow="Generosity is a prayer" title="Give & pray" />

      <View style={{ paddingHorizontal: space.xl, gap: space.lg }}>
        <Animated.View entering={FadeInDown.springify()}>
          <PressableScale onPress={() => router.push('/donate')} style={styles.hero} accessibilityRole="button" accessibilityLabel="Give a gift">
            <Img uri={imagery.prayerHands} style={StyleSheet.absoluteFill} />
            <ScrimGradient strength={0.95} />
            <View style={styles.heroBody}>
              <Text variant="caption" color={colors.gold300}>
                Support the mission
              </Text>
              <Text variant="display" color={colors.white} style={{ marginTop: 6 }}>
                Give a gift of mercy
              </Text>
              <Text variant="body" color={colors.navy100} style={{ marginTop: 6 }}>
                Your gift keeps retreats open to all, cares for the sick and sustains the chapel.
              </Text>
              <View style={styles.heroCta}>
                <Text variant="bodyStrong" color={colors.navy950}>
                  Give now
                </Text>
                <Icon name="arrow-forward" size={16} color={colors.navy950} />
              </View>
            </View>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <PressableScale onPress={() => router.push('/mass-intention')} accessibilityRole="button" accessibilityLabel="Request a Mass intention">
            <LinearGradient colors={[colors.navy800, colors.navy950]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mass}>
              <View style={styles.massIcon}>
                <Icon name="flame" size={26} color={colors.gold300} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="heading" color={colors.white}>
                  Request a Mass intention
                </Text>
                <Text variant="small" color={colors.navy200}>
                  Thanksgiving, healing, the faithful departed or a special intention.
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.gold300} />
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()} style={{ gap: space.md, marginTop: space.md }}>
          <Text variant="caption">Where your gift goes</Text>
          <View style={styles.funds}>
            {givingFunds.map((fund) => (
              <PressableScale
                key={fund.id}
                onPress={() => router.push({ pathname: '/donate', params: { fund: fund.id } })}
                style={styles.fund}
                accessibilityRole="button"
                accessibilityLabel={`Give to ${fund.label}`}>
                <Icon name={fund.icon} size={22} color={colors.gold600} />
                <Text variant="bodyStrong" style={{ marginTop: space.sm }}>
                  {fund.label}
                </Text>
                <Text variant="small" numberOfLines={3}>
                  {fund.text}
                </Text>
              </PressableScale>
            ))}
          </View>
        </Animated.View>

        <Card style={{ gap: space.md, marginTop: space.md }}>
          <Text variant="subtitle">Your giving history</Text>
          {receipts.length ? (
            receipts.slice(0, 8).map((receipt) => (
              <View key={receipt.reference + receipt.createdAt} style={styles.receipt}>
                <View style={styles.receiptIcon}>
                  <Icon name={receipt.kind === 'mass-intention' ? 'flame-outline' : receipt.kind === 'order' ? 'bag-outline' : 'heart-outline'} size={18} color={colors.gold600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="smallStrong" numberOfLines={1}>
                    {receipt.title}
                  </Text>
                  <Text variant="small">
                    {formatDate(receipt.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })} · {receipt.reference}
                  </Text>
                </View>
                <Text variant="smallStrong">{formatTZS(receipt.amount)}</Text>
              </View>
            ))
          ) : (
            <Text variant="small">Gifts, Mass offerings and orders you make in the app will appear here as receipts.</Text>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 360, borderRadius: radius.xxl, overflow: 'hidden', backgroundColor: colors.navy900, ...shadow.lift },
  heroBody: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl },
  heroCta: {
    marginTop: space.lg,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold400,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  mass: { flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.xl, borderRadius: radius.xxl },
  massIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  funds: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  fund: { width: '47.5%', minHeight: 150, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 2 },
  receipt: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  receiptIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.gold50, alignItems: 'center', justifyContent: 'center' },
});
