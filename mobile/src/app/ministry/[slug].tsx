import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState } from '@/components/feedback';
import { ParallaxScreen, ScreenHeader } from '@/components/headers';
import { Button, Card, Icon, Img, Text } from '@/components/ui';
import { useMinistries } from '@/lib/api';
import { colors, radius, space } from '@/theme';

export default function MinistryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data } = useMinistries();
  const ministry = data?.data.find((item) => item.slug === slug);

  if (!ministry) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Ministry" />
        <EmptyState icon="people-outline" title="Ministry not found" action="All ministries" onAction={() => router.replace('/ministries')} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <ParallaxScreen
        image={ministry.heroImage}
        title={ministry.title}
        hero={
          <View style={{ gap: 8 }}>
            <Text variant="caption" color={colors.gold300}>
              Ministry
            </Text>
            <Text variant="display" color={colors.white}>
              {ministry.title}
            </Text>
          </View>
        }>
        <View style={{ paddingHorizontal: space.xl, gap: space.xl }}>
          {ministry.highlightScripture ? <Text variant="quote">{ministry.highlightScripture}</Text> : null}
          <Text variant="body" style={{ fontSize: 16, lineHeight: 26 }}>
            {ministry.overview || ministry.shortDescription}
          </Text>

          {ministry.focusAreas?.length ? (
            <View style={{ gap: space.md }}>
              <Text variant="caption">Focus areas</Text>
              {ministry.focusAreas.map((area, i) => (
                <Animated.View key={area.title} entering={FadeInDown.delay(i * 50).springify()}>
                  <Card style={{ flexDirection: 'row', gap: space.md }}>
                    <Icon name="sparkles-outline" size={20} color={colors.gold600} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{area.title}</Text>
                      {area.description ? <Text variant="small">{area.description}</Text> : null}
                    </View>
                  </Card>
                </Animated.View>
              ))}
            </View>
          ) : null}

          {ministry.gatherings?.length ? (
            <Card style={{ gap: space.md }}>
              <Text variant="subtitle">When we gather</Text>
              {ministry.gatherings.map((gathering) => (
                <View key={gathering.day + gathering.time} style={{ flexDirection: 'row', gap: space.md }}>
                  <Icon name="time-outline" size={18} color={colors.gold600} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text variant="smallStrong">
                      {gathering.day} · {gathering.time}
                    </Text>
                    <Text variant="small">{gathering.description}</Text>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}

          {ministry.activities?.length
            ? ministry.activities.map((activity) => (
                <Card key={activity.id} padded={false} style={{ overflow: 'hidden' }}>
                  <Img uri={activity.image} style={{ width: '100%', height: 160 }} />
                  <View style={{ padding: space.lg, gap: 4 }}>
                    <Text variant="bodyStrong">{activity.title}</Text>
                    <Text variant="small">{activity.description}</Text>
                  </View>
                </Card>
              ))
            : null}

          {ministry.contact ? (
            <Card style={{ gap: space.md, backgroundColor: colors.navy900, borderColor: colors.navy900, borderRadius: radius.xl }}>
              <Text variant="caption" color={colors.gold300}>
                Get involved
              </Text>
              <Text variant="heading" color={colors.white}>
                {ministry.contact.coordinator}
              </Text>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {ministry.contact.email ? (
                  <Button label="Email" icon="mail-outline" size="md" variant="light" style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:${ministry.contact?.email}`)} />
                ) : null}
                {ministry.contact.phone ? (
                  <Button label="Call" icon="call-outline" size="md" variant="gold" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${ministry.contact?.phone?.replace(/\s/g, '')}`)} />
                ) : null}
              </View>
            </Card>
          ) : null}
        </View>
      </ParallaxScreen>
    </>
  );
}
