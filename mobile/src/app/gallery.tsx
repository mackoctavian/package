import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, OfflineNotice } from '@/components/feedback';
import { ScreenHeader } from '@/components/headers';
import { Chip, Icon, Img, PressableScale, ScrimGradient, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { useGallery } from '@/lib/api';
import { mediaUrl } from '@/lib/config';
import type { GalleryMedia } from '@/lib/types';
import { colors, radius, space } from '@/theme';

const tabs = [
  { id: 'photos', icon: 'images-outline' },
  { id: 'videos', icon: 'play-circle-outline' },
  { id: 'audio', icon: 'musical-notes-outline' },
  { id: 'cds', icon: 'disc-outline' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const openMedia = (item: GalleryMedia) => {
  const url = item.youtubeId ? `https://www.youtube.com/watch?v=${item.youtubeId}` : mediaUrl(item.src);
  if (url && url !== '#') WebBrowser.openBrowserAsync(url, { controlsColor: colors.gold500, toolbarColor: colors.navy900 }).catch(() => undefined);
};

function Viewer({ items, index, onClose }: { items: GalleryMedia[]; index: number | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const t = useT();
  const [current, setCurrent] = useState(index ?? 0);
  if (index === null) return null;
  const item = items[current];
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#05090f' }}>
        <StatusBar style="light" />
        <FlatList
          data={items}
          horizontal
          pagingEnabled
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(entry) => entry.id}
          onMomentumScrollEnd={(event) => setCurrent(Math.round(event.nativeEvent.contentOffset.x / width))}
          renderItem={({ item: entry }) => (
            <View style={{ width, height, justifyContent: 'center' }}>
              <Img uri={entry.src} style={{ width, height: height * 0.72, backgroundColor: 'transparent' }} contentFit="contain" />
            </View>
          )}
        />
        <View style={[styles.viewerTop, { top: insets.top + 8 }]}>
          <Text variant="smallStrong" color={colors.white}>
            {current + 1} / {items.length}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel={t('common.close')}>
            <Icon name="close" size={22} color={colors.white} />
          </Pressable>
        </View>
        {item ? (
          <Animated.View key={item.id} entering={FadeIn} style={[styles.viewerCaption, { paddingBottom: insets.bottom + 24 }]}>
            {item.caption ? (
              <Text variant="caption" color={colors.gold300}>
                {item.caption}
              </Text>
            ) : null}
            <Text variant="heading" color={colors.white}>
              {item.title}
            </Text>
            {item.description ? (
              <Text variant="small" color={colors.navy200} numberOfLines={3}>
                {item.description}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

export default function GalleryScreen() {
  const { width } = useWindowDimensions();
  const t = useT();
  const { data } = useGallery();
  const [tab, setTab] = useState<TabId>('photos');
  const [viewer, setViewer] = useState<number | null>(null);
  const gallery = data?.data;
  const items = gallery?.[tab] ?? [];
  const column = (width - space.xl * 2 - space.md) / 2;

  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  const photoHeight = (item: GalleryMedia, i: number) => (item.orientation === 'portrait' ? column * 1.4 : item.orientation === 'square' ? column : i % 3 === 0 ? column * 1.25 : column * 0.85);

  const photoTile = (item: GalleryMedia, i: number) => (
    <Animated.View key={item.id} entering={FadeInDown.delay(Math.min(i, 8) * 50).springify()}>
      <PressableScale onPress={() => setViewer(items.indexOf(item))} accessibilityLabel={item.title} style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
        <Img uri={item.src} style={{ width: column, height: photoHeight(item, i) }} />
        <ScrimGradient strength={0.7} />
        <Text variant="smallStrong" color={colors.white} numberOfLines={2} style={styles.tileTitle}>
          {item.title}
        </Text>
      </PressableScale>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title={t('gallery.title')} subtitle={t('gallery.subtitle')} />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.sm, paddingBottom: space.md }}>
          {tabs.map((item) => (
            <Chip key={item.id} label={`${t(`gallery.tabs.${item.id}`)}${gallery ? ` · ${gallery[item.id].length}` : ''}`} icon={item.icon} active={tab === item.id} onPress={() => setTab(item.id)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 60, gap: space.md }}>
        <OfflineNotice visible={data?.offline} />
        {!items.length ? <EmptyState icon="images-outline" title={t('gallery.emptyTitle')} body={t('gallery.emptyText')} /> : null}

        {tab === 'photos' ? (
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ gap: space.md }}>{left.map((item, i) => photoTile(item, i * 2))}</View>
            <View style={{ gap: space.md }}>{right.map((item, i) => photoTile(item, i * 2 + 1))}</View>
          </View>
        ) : null}

        {tab === 'videos'
          ? items.map((item, i) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).springify()}>
                <PressableScale onPress={() => openMedia(item)} style={styles.video} accessibilityLabel={t('gallery.play', { title: item.title })}>
                  <Img uri={item.poster ?? item.src} style={StyleSheet.absoluteFill} />
                  <ScrimGradient />
                  <View style={styles.play}>
                    <Icon name="play" size={26} color={colors.navy950} />
                  </View>
                  <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg }}>
                    <Text variant="heading" color={colors.white}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text variant="small" color={colors.navy100} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </PressableScale>
              </Animated.View>
            ))
          : null}

        {tab === 'audio' || tab === 'cds'
          ? items.map((item, i) => {
              const available = tab === 'cds' || (item.src && item.src !== '#');
              return (
                <Animated.View key={item.id} entering={FadeInDown.delay(i * 50).springify()}>
                  <PressableScale
                    disabled={!available}
                    onPress={() => (tab === 'cds' ? router.push('/shop') : openMedia(item))}
                    style={styles.track}
                    accessibilityLabel={item.title}>
                    <Img uri={item.coverArt} style={styles.art} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text variant="small" numberOfLines={1}>
                        {[item.artist, item.duration].filter(Boolean).join(' · ') || item.description}
                      </Text>
                    </View>
                    {tab === 'cds' ? (
                      <Text variant="smallStrong" color={colors.gold600}>
                        {t('gallery.shop')}
                      </Text>
                    ) : available ? (
                      <View style={styles.playSmall}>
                        <Icon name="play" size={16} color={colors.white} />
                      </View>
                    ) : (
                      <Text variant="small">{t('common.comingSoon')}</Text>
                    )}
                  </PressableScale>
                </Animated.View>
              );
            })
          : null}
      </ScrollView>
      {viewer !== null ? <Viewer key={viewer} items={gallery?.photos ?? []} index={viewer} onClose={() => setViewer(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tileTitle: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  video: { height: 220, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.navy900 },
  play: { position: 'absolute', top: 70, alignSelf: 'center', width: 60, height: 60, borderRadius: 30, backgroundColor: colors.gold400, alignItems: 'center', justifyContent: 'center' },
  track: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  art: { width: 56, height: 56, borderRadius: radius.sm },
  playSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navy900, alignItems: 'center', justifyContent: 'center' },
  viewerTop: { position: 'absolute', left: space.xl, right: space.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  viewerCaption: { position: 'absolute', left: space.xl, right: space.xl, bottom: 0, gap: 4 },
});
