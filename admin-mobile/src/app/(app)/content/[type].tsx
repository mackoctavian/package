import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ErrorState, FilterChips, IconButton, ListSkeleton, SearchField, StackHeader, StatusPill, toast } from '@/components/admin';
import { EmptyState } from '@/components/feedback';
import { Icon, Img, Text } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { CONTENT_LABELS } from '@/lib/content';
import { formatDate, formatTZS } from '@/lib/format';
import { keys, useContent } from '@/lib/queries';
import { useCan } from '@/lib/session';
import type { ContentItem, ContentType } from '@/lib/types';
import { colors, fonts, radius, space } from '@/theme';

export default function ContentList() {
  const { type } = useLocalSearchParams<{ type: ContentType }>();
  const label = CONTENT_LABELS[type] ?? { plural: 'Content', singular: 'item', icon: 'document-outline' as const };
  const canEdit = useCan(type, 'edit');
  const client = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [search, setSearch] = useState('');
  const query = useContent(type);
  const all = query.data ?? [];
  const term = search.trim().toLowerCase();
  const rows = all.filter(
    (item) => (filter === 'all' || item.status === filter) && (!term || item.title.toLowerCase().includes(term) || (item.category ?? '').toLowerCase().includes(term)),
  );

  const toggle = useMutation({
    mutationFn: (item: ContentItem) => api(`/api/content/${type}/${item.id}`, { method: 'PATCH', body: { status: item.status === 'published' ? 'draft' : 'published' } }),
    onSuccess: (_data, item) => {
      toast(item.status === 'published' ? 'Moved to drafts' : 'Published on the website');
      client.invalidateQueries({ queryKey: keys.content(type) });
    },
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  const renderItem = ({ item }: { item: ContentItem }) => {
    const meta = item.metadata ?? {};
    const price = typeof meta.price === 'number' ? meta.price : null;
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/content/edit', params: { type, id: item.id } })}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.navy50 }]}>
        {item.mediaUrl ? (
          <Img uri={item.mediaUrl} style={type === 'publications' ? styles.cover : styles.thumb} />
        ) : (
          <View style={[type === 'publications' ? styles.cover : styles.thumb, styles.placeholder]}>
            <Icon name={label.icon} size={20} color={colors.navy400} />
          </View>
        )}
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="small" numberOfLines={1}>
            {[typeof meta.author === 'string' ? meta.author : null, item.category, item.publishDate ? formatDate(item.publishDate) : null].filter(Boolean).join(' · ') || `Updated ${formatDate(item.updatedAt)}`}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 }}>
            <StatusPill status={item.status} />
            {price != null ? <Text style={styles.price}>{formatTZS(price)}</Text> : null}
            {meta.inStock === false ? <StatusPill status="out of stock" tone="danger" /> : null}
          </View>
        </View>
        {canEdit ? (
          <IconButton
            icon={item.status === 'published' ? 'eye-off-outline' : 'cloud-upload-outline'}
            label={item.status === 'published' ? 'Unpublish' : 'Publish'}
            size={36}
            onPress={() => toggle.mutate(item)}
          />
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <StackHeader
        title={label.plural}
        subtitle={`${all.filter((item) => item.status === 'published').length} published · ${all.filter((item) => item.status !== 'published').length} drafts`}
        right={canEdit ? <IconButton icon="add" label={`New ${label.singular}`} tone="dark" onPress={() => router.push({ pathname: '/content/edit', params: { type } })} /> : null}
      />
      <View style={{ paddingHorizontal: space.xl, marginBottom: space.md }}>
        <SearchField value={search} onChangeText={setSearch} placeholder={`Search ${label.plural.toLowerCase()}`} />
      </View>
      <View style={{ marginBottom: space.md }}>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: all.length },
            { value: 'published', label: 'Published', count: all.filter((item) => item.status === 'published').length },
            { value: 'draft', label: 'Drafts', count: all.filter((item) => item.status === 'draft').length },
          ]}
        />
      </View>
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.gold500} />}
          ListEmptyComponent={
            <EmptyState
              icon={label.icon}
              title={`No ${label.plural.toLowerCase()} yet`}
              body={canEdit ? `Tap + to add the first ${label.singular}.` : undefined}
              action={canEdit ? `New ${label.singular}` : undefined}
              onAction={() => router.push({ pathname: '/content/edit', params: { type } })}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 12 },
  cover: { width: 52, height: 72, borderRadius: 8 },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  placeholder: { backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
  price: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.gold700 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.xl },
});
