import { useMemo, useState } from 'react';
import { FlatList, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ArticleFeature, ArticleRow } from '@/components/cards';
import { EmptyState, OfflineNotice } from '@/components/feedback';
import { ScreenHeader } from '@/components/headers';
import { Chip } from '@/components/ui';
import { useNews } from '@/lib/api';
import { colors, space } from '@/theme';

export default function NewsScreen() {
  const { width } = useWindowDimensions();
  const { data } = useNews();
  const [tag, setTag] = useState('All');
  const articles = useMemo(() => data?.data ?? [], [data]);
  const tags = useMemo(() => ['All', ...new Set(articles.map((a) => a.tag).filter((t): t is string => Boolean(t)))], [articles]);
  const filtered = tag === 'All' ? articles : articles.filter((a) => a.tag === tag);
  const [lead, ...rest] = filtered;

  return (
    <View style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScreenHeader title="News & stories" />
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 60, gap: space.lg }}
        ListHeaderComponent={
          <View style={{ gap: space.lg }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {tags.map((value) => (
                <Chip key={value} label={value} active={tag === value} onPress={() => setTag(value)} />
              ))}
            </ScrollView>
            <OfflineNotice visible={data?.offline} />
            {lead ? (
              <Animated.View entering={FadeInDown.springify()}>
                <ArticleFeature article={lead} width={width - space.xl * 2} />
              </Animated.View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <ArticleRow article={item} />
          </Animated.View>
        )}
        ListEmptyComponent={lead ? undefined : <EmptyState icon="newspaper-outline" title="No stories yet" />}
      />
    </View>
  );
}
