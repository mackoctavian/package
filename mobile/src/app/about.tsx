import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ParallaxScreen } from '@/components/headers';
import { Button, Card, Icon, InfoRow, Text } from '@/components/ui';
import { about, imagery } from '@/data/content';
import { useT } from '@/i18n';
import { useHome } from '@/lib/api';
import { colors, space } from '@/theme';

export default function AboutScreen() {
  const { data } = useHome();
  const t = useT();
  const site = data?.data.site;

  return (
    <>
      <StatusBar style="light" />
      <ParallaxScreen
        image={imagery.churchInterior}
        title={t('about.title')}
        hero={
          <View style={{ gap: 10 }}>
            <Image source={require('@/assets/images/emblem.png')} style={{ width: 72, height: 72 }} contentFit="contain" accessibilityLabel={t('about.emblem')} />
            <Text variant="display" color={colors.white}>
              {t('about.name')}
            </Text>
            <Text variant="small" color={colors.navy100}>
              {t('about.since')}
            </Text>
          </View>
        }>
        <View style={{ paddingHorizontal: space.xl, gap: space.xl }}>
          <Text variant="body" style={{ fontSize: 16, lineHeight: 26 }}>
            {t('content.about.history')}
          </Text>
          <Card style={{ gap: space.sm, backgroundColor: colors.navy900, borderColor: colors.navy900 }}>
            <Text variant="caption" color={colors.gold300}>
              {t('about.mission')}
            </Text>
            <Text variant="quote" color={colors.white}>
              {t('content.about.mission')}
            </Text>
          </Card>
          <View style={{ gap: space.md }}>
            {about.pillars.map((pillar, i) => (
              <Animated.View key={pillar.id} entering={FadeInDown.delay(i * 60).springify()}>
                <Card style={{ flexDirection: 'row', gap: space.md }}>
                  <Icon name={pillar.icon} size={22} color={colors.gold600} />
                  <View style={{ flex: 1 }}>
                    <Text variant="subtitle">{t(`content.about.pillars.${pillar.id}.title`)}</Text>
                    <Text variant="small">{t(`content.about.pillars.${pillar.id}.text`)}</Text>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
          <View style={{ gap: space.md }}>
            <Text variant="caption">{t('about.journey')}</Text>
            {about.milestones.map((item) => (
              <View key={item} style={{ flexDirection: 'row', gap: space.lg }}>
                <Text variant="heading" color={colors.gold600} style={{ width: 64 }}>
                  {t(`content.about.milestones.${item}.year`)}
                </Text>
                <Text variant="body" style={{ flex: 1 }}>
                  {t(`content.about.milestones.${item}.event`)}
                </Text>
              </View>
            ))}
          </View>
          {site ? (
            <Card style={{ gap: space.lg }}>
              <Text variant="subtitle">{t('about.contact')}</Text>
              <InfoRow icon="location-outline" label={t('about.address')} value={`${site.contact.address}\n${site.contact.postal}`} />
              <InfoRow icon="call-outline" label={t('about.phone')} value={`${site.contact.phone} · ${site.contact.secondaryPhone}`} />
              <InfoRow icon="mail-outline" label={t('about.email')} value={site.contact.email} />
              <InfoRow icon="time-outline" label={t('about.hours')} value={(site.contact.officeHours ?? []).join('\n')} />
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button label={t('common.directions')} icon="navigate-outline" size="md" style={{ flex: 1 }} onPress={() => Linking.openURL(site.contact.mapsHref)} />
                <Button label={t('common.email')} icon="mail-outline" size="md" variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:${site.contact.email}`)} />
              </View>
            </Card>
          ) : null}
        </View>
      </ParallaxScreen>
    </>
  );
}
