import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ParallaxScreen } from '@/components/headers';
import { Button, Card, Icon, InfoRow, Text } from '@/components/ui';
import { about, imagery } from '@/data/content';
import { useHome } from '@/lib/api';
import { colors, space } from '@/theme';

export default function AboutScreen() {
  const { data } = useHome();
  const site = data?.data.site;

  return (
    <>
      <StatusBar style="light" />
      <ParallaxScreen
        image={imagery.churchInterior}
        title="About DMRC"
        hero={
          <View style={{ gap: 10 }}>
            <Image source={require('@/assets/images/emblem.png')} style={{ width: 72, height: 72 }} contentFit="contain" accessibilityLabel="DMRC emblem" />
            <Text variant="display" color={colors.white}>
              Divine Mercy Retreat Center
            </Text>
            <Text variant="small" color={colors.navy100}>
              Vikindu · Tanzania · Since 2010
            </Text>
          </View>
        }>
        <View style={{ paddingHorizontal: space.xl, gap: space.xl }}>
          <Text variant="body" style={{ fontSize: 16, lineHeight: 26 }}>
            {about.history}
          </Text>
          <Card style={{ gap: space.sm, backgroundColor: colors.navy900, borderColor: colors.navy900 }}>
            <Text variant="caption" color={colors.gold300}>
              Our mission
            </Text>
            <Text variant="quote" color={colors.white}>
              {about.mission}
            </Text>
          </Card>
          <View style={{ gap: space.md }}>
            {about.pillars.map((pillar, i) => (
              <Animated.View key={pillar.title} entering={FadeInDown.delay(i * 60).springify()}>
                <Card style={{ flexDirection: 'row', gap: space.md }}>
                  <Icon name={pillar.icon} size={22} color={colors.gold600} />
                  <View style={{ flex: 1 }}>
                    <Text variant="subtitle">{pillar.title}</Text>
                    <Text variant="small">{pillar.text}</Text>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
          <View style={{ gap: space.md }}>
            <Text variant="caption">Our journey</Text>
            {about.milestones.map((item) => (
              <View key={item.year} style={{ flexDirection: 'row', gap: space.lg }}>
                <Text variant="heading" color={colors.gold600} style={{ width: 64 }}>
                  {item.year}
                </Text>
                <Text variant="body" style={{ flex: 1 }}>
                  {item.event}
                </Text>
              </View>
            ))}
          </View>
          {site ? (
            <Card style={{ gap: space.lg }}>
              <Text variant="subtitle">Contact the office</Text>
              <InfoRow icon="location-outline" label="Address" value={`${site.contact.address}\n${site.contact.postal}`} />
              <InfoRow icon="call-outline" label="Phone" value={`${site.contact.phone} · ${site.contact.secondaryPhone}`} />
              <InfoRow icon="mail-outline" label="Email" value={site.contact.email} />
              <InfoRow icon="time-outline" label="Office hours" value={site.contact.officeHours.join('\n')} />
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button label="Directions" icon="navigate-outline" size="md" style={{ flex: 1 }} onPress={() => Linking.openURL(site.contact.mapsHref)} />
                <Button label="Email" icon="mail-outline" size="md" variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:${site.contact.email}`)} />
              </View>
            </Card>
          ) : null}
        </View>
      </ParallaxScreen>
    </>
  );
}
