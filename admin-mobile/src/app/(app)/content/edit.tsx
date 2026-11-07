import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm, FilterChips, IconButton, SegmentTabs, toast, ViewOnlyNote } from '@/components/admin';
import { ErrorBanner } from '@/components/feedback';
import { TextField } from '@/components/form';
import { Button, Card, Icon, Img, Text } from '@/components/ui';
import { api, errorMessage, uploadImage } from '@/lib/api';
import { CONTENT_LABELS, PUBLICATION_FORMATS } from '@/lib/content';
import { isoDay } from '@/lib/format';
import { keys, useContent } from '@/lib/queries';
import { useCan } from '@/lib/session';
import type { ContentItem, ContentType } from '@/lib/types';
import { colors, radius, space } from '@/theme';

type Form = {
  title: string;
  summary: string;
  body: string;
  category: string;
  status: 'draft' | 'published';
  mediaUrl: string;
  publishDate: string;
  author: string;
  format: string;
  price: string;
  originalPrice: string;
  inStock: boolean;
};

const fromItem = (item?: ContentItem): Form => {
  const meta = item?.metadata ?? {};
  const text = (value: unknown) => (typeof value === 'string' ? value : value != null ? String(value) : '');
  return {
    title: item?.title ?? '',
    summary: item?.summary ?? '',
    body: item?.body ?? '',
    category: item?.category ?? '',
    status: item?.status === 'published' ? 'published' : 'draft',
    mediaUrl: item?.mediaUrl ?? '',
    publishDate: item?.publishDate ? item.publishDate.slice(0, 10) : '',
    author: text(meta.author),
    format: text(meta.format) || 'Paperback',
    price: text(meta.price),
    originalPrice: text(meta.originalPrice),
    inStock: meta.inStock !== undefined ? Boolean(meta.inStock) : true,
  };
};

export default function ContentEditor() {
  const { type, id } = useLocalSearchParams<{ type: ContentType; id?: string }>();
  const insets = useSafeAreaInsets();
  const label = CONTENT_LABELS[type];
  const canEdit = useCan(type, 'edit');
  const client = useQueryClient();
  const list = useContent(type);
  const existing = id ? list.data?.find((item) => item.id === id) : undefined;
  const [form, setForm] = useState<Form | null>(id ? null : fromItem());
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const values = form ?? (existing ? fromItem(existing) : null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...(values as Form), [key]: value });
  const isPublication = type === 'publications';

  const save = useMutation({
    mutationFn: async () => {
      if (!values) return;
      if (!values.title.trim()) throw new Error('Add a title first.');
      const number = (value: string) => (value.trim() ? Math.max(0, Number(value.replace(/[^\d.]/g, '')) || 0) : undefined);
      const metadata = isPublication
        ? {
            ...(existing?.metadata ?? {}),
            author: values.author.trim(),
            format: values.format,
            price: number(values.price),
            originalPrice: number(values.originalPrice),
            inStock: values.inStock,
          }
        : (existing?.metadata ?? {});
      const body = {
        title: values.title.trim(),
        summary: values.summary.trim() || null,
        body: values.body.trim() || null,
        category: values.category.trim() || null,
        status: values.status,
        mediaUrl: values.mediaUrl.trim() || null,
        publishDate: values.publishDate ? new Date(values.publishDate).toISOString() : null,
        metadata,
      };
      return id ? api(`/api/content/${type}/${id}`, { method: 'PATCH', body }) : api(`/api/content/${type}`, { method: 'POST', body });
    },
    onSuccess: () => {
      toast(id ? 'Changes saved' : `${label.singular[0].toUpperCase()}${label.singular.slice(1)} created`);
      client.invalidateQueries({ queryKey: keys.content(type) });
      router.back();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/content/${type}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast('Deleted');
      client.invalidateQueries({ queryKey: keys.content(type) });
      router.back();
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: isPublication ? [3, 4] : [16, 9] });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const url = await uploadImage({ uri: asset.uri, name: asset.fileName, mimeType: asset.mimeType }, type);
      set('mediaUrl', url);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ivory }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm }]}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <Text variant="subtitle" style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
          {id ? `Edit ${label.singular}` : `New ${label.singular}`}
        </Text>
        {id && canEdit ? (
          <IconButton
            icon="trash-outline"
            label="Delete"
            onPress={async () => {
              if (await confirm(`Delete this ${label.singular}?`, 'It will be removed from the website. This cannot be undone.', 'Delete', true)) remove.mutate();
            }}
          />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {!values ? (
        <ActivityIndicator color={colors.gold500} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
          {!canEdit ? <ViewOnlyNote /> : null}
          <ErrorBanner message={error} />

          <Pressable onPress={canEdit ? pickImage : undefined} style={[styles.cover, isPublication ? styles.coverBook : styles.coverWide]} accessibilityRole="button" accessibilityLabel="Choose a cover image">
            {values.mediaUrl ? <Img uri={values.mediaUrl} style={StyleSheet.absoluteFill} /> : null}
            <View style={[styles.coverOverlay, values.mediaUrl ? styles.coverOverlayDark : null]}>
              {uploading ? (
                <ActivityIndicator color={values.mediaUrl ? colors.white : colors.gold500} />
              ) : (
                <>
                  <Icon name="image-outline" size={24} color={values.mediaUrl ? colors.white : colors.navy500} />
                  <Text variant="smallStrong" color={values.mediaUrl ? colors.white : colors.navy600}>
                    {values.mediaUrl ? 'Change image' : 'Add a cover image'}
                  </Text>
                </>
              )}
            </View>
          </Pressable>

          <SegmentTabs
            value={values.status}
            onChange={(status) => set('status', status)}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
            ]}
          />

          <TextField label="Title" required value={values.title} onChangeText={(value) => set('title', value)} editable={canEdit} placeholder={isPublication ? 'Book title' : 'Headline'} />
          <TextField
            label={isPublication ? 'Subtitle' : 'Summary'}
            value={values.summary}
            onChangeText={(value) => set('summary', value)}
            editable={canEdit}
            multiline={!isPublication}
            placeholder={isPublication ? 'Optional subtitle' : 'One or two sentences shown in lists'}
          />

          {isPublication ? (
            <Card style={{ gap: space.md }}>
              <TextField label="Author" icon="person-outline" value={values.author} onChangeText={(value) => set('author', value)} editable={canEdit} />
              <View style={{ gap: 6 }}>
                <Text variant="label">Format</Text>
                <View style={{ marginHorizontal: -space.xl - space.lg }}>
                  <FilterChips value={values.format} onChange={(value) => set('format', value)} options={PUBLICATION_FORMATS.map((format) => ({ value: format, label: format }))} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField label="Price (TZS)" keyboardType="number-pad" value={values.price} onChangeText={(value) => set('price', value)} editable={canEdit} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField label="Was (TZS)" keyboardType="number-pad" value={values.originalPrice} onChangeText={(value) => set('originalPrice', value)} editable={canEdit} hint="Optional" />
                </View>
              </View>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">In stock</Text>
                  <Text variant="small">Turn off to show “Out of stock” in the bookshop.</Text>
                </View>
                <Switch
                  value={values.inStock}
                  onValueChange={(value) => set('inStock', value)}
                  disabled={!canEdit}
                  trackColor={{ true: colors.gold400, false: colors.navy100 }}
                  thumbColor={colors.white}
                />
              </View>
            </Card>
          ) : null}

          <TextField label="Category" value={values.category} onChangeText={(value) => set('category', value)} editable={canEdit} placeholder={isPublication ? 'e.g. Spirituality' : 'e.g. Announcements'} />
          <View style={{ gap: 6 }}>
            <TextField
              label={type === 'events' ? 'Event date' : 'Publish date'}
              value={values.publishDate}
              onChangeText={(value) => set('publishDate', value)}
              editable={canEdit}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
            {canEdit && !values.publishDate ? (
              <Pressable onPress={() => set('publishDate', isoDay(new Date()))} hitSlop={8}>
                <Text variant="smallStrong" color={colors.gold600}>
                  Use today
                </Text>
              </Pressable>
            ) : null}
          </View>
          <TextField
            label={isPublication ? 'Description' : 'Story'}
            value={values.body}
            onChangeText={(value) => set('body', value)}
            editable={canEdit}
            multiline
            style={{ minHeight: 180 }}
            placeholder="Write the full text here"
          />
        </ScrollView>
      )}

      {values && canEdit ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Button label={id ? 'Save changes' : values.status === 'published' ? 'Publish' : 'Save draft'} icon="checkmark" loading={save.isPending} disabled={uploading} onPress={() => save.mutate()} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  cover: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.navy50, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.navy200, alignSelf: 'center' },
  coverBook: { width: 150, height: 200 },
  coverWide: { width: '100%', aspectRatio: 16 / 9 },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverOverlayDark: { backgroundColor: 'rgba(10,20,38,0.35)', top: undefined, height: 44, flexDirection: 'row' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.ivory, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
