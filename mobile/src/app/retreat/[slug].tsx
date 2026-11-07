import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { retreatStatusLabel, retreatStatusTone } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { ParallaxScreen, RoundButton, ScreenHeader } from '@/components/headers';
import { Badge, Button, Card, Icon, InfoRow, Text } from '@/components/ui';
import { retreatTerms } from '@/data/content';
import { useRetreats } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { retreatContribution } from '@/lib/format';
import { colors, radius, space } from '@/theme';

function SeatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.max(4, Math.min(100, (value / total) * 100)) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="label">{label}</Text>
        <Text variant="smallStrong">{value} places</Text>
      </View>
      <View style={styles.track}>
        <Animated.View entering={FadeIn.delay(300)} style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function RetreatDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data } = useRetreats();
  const retreat = data?.data.find((item) => item.slug === slug);
  const [termsOpen, setTermsOpen] = useState(false);

  if (!retreat) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Retreat" />
        <EmptyState icon="leaf-outline" title="Retreat not found" body="It may have been removed or renamed." action="Browse retreats" onAction={() => router.replace('/retreats')} />
      </View>
    );
  }

  const closed = retreat.ended || retreat.status === 'Closed';
  const cta = retreat.ended ? 'This retreat has ended' : retreat.status === 'Closed' ? 'Registration closed' : retreat.status === 'Waitlist' ? 'Join the waitlist' : 'Reserve a place';

  return (
    <>
      <StatusBar style="light" />
      <ParallaxScreen
        image={retreat.imageSrc}
        title={retreat.title}
        right={
          <RoundButton
            icon="share-outline"
            label="Share"
            onPress={() => Share.share({ message: `${retreat.title} · ${retreat.dateRange}\n${API_URL}/retreats/${retreat.slug}` })}
          />
        }
        hero={
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Badge label={retreat.categoryLabel} tone="light" />
              <Badge label={retreatStatusLabel(retreat)} tone={retreatStatusTone(retreat)} />
            </View>
            <Text variant="hero" color={colors.white}>
              {retreat.title}
            </Text>
            {retreat.subtitle && retreat.subtitle !== retreat.title ? (
              <Text variant="body" color={colors.navy100}>
                {retreat.subtitle}
              </Text>
            ) : null}
          </View>
        }
        footer={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <View>
              <Text variant="small">Contribution</Text>
              <Text variant="subtitle">{retreatContribution(retreat)}</Text>
            </View>
            <Button
              label={cta}
              variant={closed ? 'secondary' : 'gold'}
              disabled={closed}
              iconRight={closed ? undefined : 'arrow-forward'}
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/book/[slug]', params: { slug: retreat.slug } })}
            />
          </View>
        }>
        <View style={{ paddingHorizontal: space.xl, gap: space.xl }}>
          <Animated.View entering={FadeInDown.springify()}>
            <Card style={{ gap: space.lg }}>
              <InfoRow icon="calendar-outline" label="Dates" value={retreat.dateRange} />
              <InfoRow icon="time-outline" label="Schedule" value={retreat.timeRange} />
              <InfoRow icon="location-outline" label="Venue" value={retreat.location} />
              <InfoRow icon="mic-outline" label="Preacher" value={retreat.speaker} />
              {retreat.conductor && retreat.conductor !== retreat.speaker ? <InfoRow icon="person-outline" label="Conducted by" value={retreat.conductor} /> : null}
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).springify()} style={{ gap: space.sm }}>
            <Text variant="caption">About this retreat</Text>
            <Text variant="body" style={{ fontSize: 16, lineHeight: 26 }}>
              {retreat.description}
            </Text>
          </Animated.View>

          {retreat.availability.total > 0 ? (
            <Animated.View entering={FadeInDown.delay(140).springify()}>
              <Card style={{ gap: space.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text variant="heading">Availability</Text>
                  <Text variant="smallStrong" color={colors.gold700}>
                    {retreat.availability.total} total
                  </Text>
                </View>
                <SeatBar label="Men" value={retreat.availability.male} total={retreat.availability.total} color={colors.navy700} />
                <SeatBar label="Women" value={retreat.availability.female} total={retreat.availability.total} color={colors.gold400} />
              </Card>
            </Animated.View>
          ) : null}

          <Animated.View layout={LinearTransition}>
            <Card padded={false}>
              <Pressable onPress={() => setTermsOpen((open) => !open)} style={styles.termsHeader} accessibilityRole="button" accessibilityState={{ expanded: termsOpen }}>
                <Icon name="document-text-outline" size={20} color={colors.gold600} />
                <Text variant="subtitle" style={{ flex: 1 }}>
                  Retreat terms
                </Text>
                <Icon name={termsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </Pressable>
              {termsOpen ? (
                <Animated.View entering={FadeIn} style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md }}>
                  {retreatTerms.map((term) => (
                    <View key={term.title} style={{ gap: 2 }}>
                      <Text variant="smallStrong">{term.title}</Text>
                      <Text variant="small">{term.body}</Text>
                    </View>
                  ))}
                </Animated.View>
              ) : null}
            </Card>
          </Animated.View>
        </View>
      </ParallaxScreen>
    </>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.navy50, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  termsHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
});
