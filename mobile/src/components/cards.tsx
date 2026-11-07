import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { type T, useFormat, useT } from '@/i18n';
import { readingTimeLabel, retreatContribution } from '@/lib/format';
import type { Article, Publication, Retreat } from '@/lib/types';
import { colors, radius, shadow, space } from '@/theme';
import { Badge, Icon, Img, PressableScale, ScrimGradient, Text } from './ui';

export const retreatStatusTone = (retreat: Retreat) =>
  retreat.ended ? 'navy' : retreat.status === 'Registration Open' ? 'success' : retreat.status === 'Waitlist' ? 'warning' : 'danger';

export const retreatStatusLabel = (retreat: Retreat, t: T) => (retreat.ended ? t('retreats.ended') : (retreat.statusLabel ?? retreat.status));

function DateTile({ iso, light }: { iso: string | null; light?: boolean }) {
  const md = useFormat().monthDay(iso);
  if (!md) return null;
  return (
    <View style={[styles.dateTile, light && { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
      <Text variant="caption" color={colors.gold600} style={{ fontSize: 10, letterSpacing: 1 }}>
        {md.month}
      </Text>
      <Text variant="heading" style={{ fontSize: 22, lineHeight: 24 }}>
        {md.day}
      </Text>
    </View>
  );
}

/** Large image card for carousels. */
export function RetreatFeatureCard({ retreat, width }: { retreat: Retreat; width: number }) {
  const t = useT();
  const { money } = useFormat();
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/retreat/[slug]', params: { slug: retreat.slug } })}
      style={[styles.feature, { width }]}
      accessibilityRole="button"
      accessibilityLabel={`${retreat.title}, ${retreat.dateLabel ?? retreat.dateRange}`}>
      <Img uri={retreat.imageSrc} style={StyleSheet.absoluteFill} />
      <ScrimGradient />
      <View style={styles.featureTop}>
        <DateTile iso={retreat.startDate} light />
        <Badge label={retreatStatusLabel(retreat, t)} tone="light" />
      </View>
      <View style={styles.featureBody}>
        <Text variant="caption" color={colors.gold300}>
          {retreat.categoryLabel}
        </Text>
        <Text variant="title" color={colors.white} numberOfLines={2} style={{ marginTop: 6 }}>
          {retreat.title}
        </Text>
        <View style={styles.metaRow}>
          <Icon name="person-outline" size={14} color={colors.gold200} />
          <Text variant="small" color={colors.navy100} numberOfLines={1} style={{ flex: 1 }}>
            {retreat.speaker}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="location-outline" size={14} color={colors.gold200} />
          <Text variant="small" color={colors.navy100} numberOfLines={1} style={{ flex: 1 }}>
            {retreat.location} · {retreatContribution(retreat, t, money)}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

/** Row card for lists. */
export function RetreatListCard({ retreat }: { retreat: Retreat }) {
  const t = useT();
  const { money } = useFormat();
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/retreat/[slug]', params: { slug: retreat.slug } })}
      style={styles.listCard}
      accessibilityRole="button"
      accessibilityLabel={`${retreat.title}, ${retreat.dateLabel ?? retreat.dateRange}`}>
      <View>
        <Img uri={retreat.imageSrc} style={styles.listImage} />
        <View style={{ position: 'absolute', top: 10, left: 10 }}>
          <DateTile iso={retreat.startDate} light />
        </View>
      </View>
      <View style={{ padding: space.lg, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption">{retreat.categoryLabel}</Text>
          <Badge label={retreatStatusLabel(retreat, t)} tone={retreatStatusTone(retreat)} />
        </View>
        <Text variant="heading" numberOfLines={2}>
          {retreat.title}
        </Text>
        <View style={styles.metaRowDark}>
          <Icon name="calendar-outline" size={14} color={colors.gold600} />
          <Text variant="small">{retreat.dateLabel ?? retreat.dateRange}</Text>
        </View>
        <View style={styles.metaRowDark}>
          <Icon name="person-outline" size={14} color={colors.gold600} />
          <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>
            {retreat.speaker}
          </Text>
        </View>
        <View style={[styles.metaRowDark, { justifyContent: 'space-between', marginTop: 4 }]}>
          <Text variant="smallStrong">{retreatContribution(retreat, t, money)}</Text>
          <View style={styles.metaRowDark}>
            <Text variant="smallStrong" color={colors.gold600}>
              {retreat.ended ? t('retreats.viewDetails') : t('retreats.reserve')}
            </Text>
            <Icon name="arrow-forward" size={14} color={colors.gold600} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export function PublicationCard({ item, width }: { item: Publication; width: number }) {
  const t = useT();
  const { money } = useFormat();
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/publication/[slug]', params: { slug: item.slug } })}
      style={{ width }}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${money(item.price)}`}>
      <View style={[styles.cover, { height: width * 1.32 }]}>
        <Img uri={item.coverImage} style={StyleSheet.absoluteFill} />
        {item.badge ? <Badge label={item.badge} style={{ position: 'absolute', top: 10, left: 10 }} /> : null}
        {item.inStock === false ? <Badge label={t('shop.outOfStock')} tone="danger" style={{ position: 'absolute', bottom: 10, left: 10 }} /> : null}
      </View>
      <Text variant="small" numberOfLines={1} style={{ marginTop: 10 }}>
        {item.categoryLabel ?? item.category} · {item.formatLabel ?? item.format}
      </Text>
      <Text variant="bodyStrong" numberOfLines={2} style={{ marginTop: 2 }}>
        {item.title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <Text variant="smallStrong" color={colors.gold700}>
          {money(item.price)}
        </Text>
        {item.originalPrice && item.originalPrice > item.price ? (
          <Text variant="small" style={{ textDecorationLine: 'line-through', fontSize: 12 }}>
            {money(item.originalPrice)}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

export function ArticleRow({ article }: { article: Article }) {
  const t = useT();
  const { date } = useFormat();
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/article/[slug]', params: { slug: article.slug } })}
      style={styles.articleRow}
      accessibilityRole="button"
      accessibilityLabel={article.title}>
      <Img uri={article.heroImage} style={styles.articleImage} />
      <View style={{ flex: 1, gap: 4 }}>
        {article.tag ? <Text variant="caption">{article.tag}</Text> : null}
        <Text variant="bodyStrong" numberOfLines={2}>
          {article.title}
        </Text>
        <Text variant="small" numberOfLines={1}>
          {[date(article.publishedOn, { day: 'numeric', month: 'short', year: 'numeric' }), readingTimeLabel(article.readingTime, t)].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </PressableScale>
  );
}

export function ArticleFeature({ article, width }: { article: Article; width: number }) {
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/article/[slug]', params: { slug: article.slug } })}
      style={[styles.articleFeature, { width }]}
      accessibilityRole="button"
      accessibilityLabel={article.title}>
      <Img uri={article.heroImage} style={{ width: '100%', height: width * 0.58 }} />
      <View style={{ padding: space.lg, gap: 6 }}>
        {article.tag ? <Text variant="caption">{article.tag}</Text> : null}
        <Text variant="heading" numberOfLines={2}>
          {article.title}
        </Text>
        <Text variant="small" numberOfLines={2}>
          {article.summary}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  dateTile: {
    width: 50,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  feature: { height: 380, borderRadius: radius.xxl, overflow: 'hidden', backgroundColor: colors.navy800, ...shadow.lift },
  featureTop: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  featureBody: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaRowDark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.soft,
  },
  listImage: { width: '100%', height: 180 },
  cover: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navy100, ...shadow.soft },
  articleRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  articleImage: { width: 84, height: 84, borderRadius: radius.md },
  articleFeature: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.soft,
  },
});
