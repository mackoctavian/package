import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ArticleRow } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { ParallaxScreen, RoundButton, ScreenHeader } from '@/components/headers';
import { Badge, Divider, Img, Text } from '@/components/ui';
import { useNews } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useFormat, useT } from '@/i18n';
import { readingTimeLabel } from '@/lib/format';
import { colors, radius, space } from '@/theme';

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = useT();
  const { date } = useFormat();
  const { data } = useNews();
  const articles = data?.data ?? [];
  const article = articles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={t('news.title')} />
        <EmptyState icon="newspaper-outline" title={t('news.notFound')} action={t('news.allNews')} onAction={() => router.replace('/news')} />
      </View>
    );
  }

  const more = articles.filter((item) => item.id !== article.id).slice(0, 3);

  return (
    <>
      <StatusBar style="light" />
      <ParallaxScreen
        image={article.heroImage}
        title={article.title}
        right={
          <RoundButton
            icon="share-outline"
            label={t('common.share')}
            onPress={() => Share.share({ message: `${article.title}\n${API_URL}${t.locale === 'sw' ? '/sw' : ''}/news/${article.slug}` })}
          />
        }
        hero={
          <View style={{ gap: 8 }}>
            {article.tag ? <Badge label={article.tag} tone="light" /> : null}
            <Text variant="display" color={colors.white}>
              {article.title}
            </Text>
            <Text variant="small" color={colors.navy100}>
              {[article.author, date(article.publishedOn), readingTimeLabel(article.readingTime, t)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        }>
        <View style={{ paddingHorizontal: space.xl, gap: space.lg }}>
          <Text variant="quote" style={{ fontSize: 22, lineHeight: 30 }}>
            {article.summary}
          </Text>
          {(article.sections ?? []).map((section, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 40)} style={{ gap: space.md }}>
              {section.heading ? <Text variant="heading">{section.heading}</Text> : null}
              {section.paragraphs.map((paragraph, j) => (
                <Text key={j} variant="body" style={{ fontSize: 16.5, lineHeight: 27 }}>
                  {paragraph}
                </Text>
              ))}
            </Animated.View>
          ))}
          {article.featuredQuote || article.featuredScripture ? (
            <View style={styles.pull}>
              <Text variant="quote">“{article.featuredQuote ?? article.featuredScripture}”</Text>
              {article.featuredQuote && article.featuredScripture ? (
                <Text variant="small" style={{ marginTop: space.sm }}>
                  {article.featuredScripture}
                </Text>
              ) : null}
            </View>
          ) : null}
          {(article.gallery ?? []).map((uri) => (
            <Img key={uri} uri={uri} style={{ width: '100%', height: 220, borderRadius: radius.lg }} />
          ))}
          {more.length ? (
            <>
              <Divider style={{ marginVertical: space.lg }} />
              <Text variant="caption">{t('news.more')}</Text>
              {more.map((item) => (
                <ArticleRow key={item.id} article={item} />
              ))}
            </>
          ) : null}
        </View>
      </ParallaxScreen>
    </>
  );
}

const styles = StyleSheet.create({
  pull: { borderLeftWidth: 3, borderLeftColor: colors.gold400, paddingLeft: space.lg, paddingVertical: space.sm },
});
