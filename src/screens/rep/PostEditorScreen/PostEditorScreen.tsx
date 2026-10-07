import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import type { Post } from '@/features/rep/api';
import { uploadPostImage } from '@/features/rep/api';
import { useCollegeId, usePosts, useRepActions } from '@/features/rep/hooks';
import { POST_TYPE_LABELS, type PostType } from '@/features/rep/posts';
import { postSchema } from '@/features/rep/schemas';
import { useTheme } from '@/hooks/useTheme';
import { pickPhoto } from '@/lib/pickers';
import { publicUrl, removeFile, type LocalFile } from '@/lib/storage';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createRepStyles } from '../repStyles';

const TYPES = Object.entries(POST_TYPE_LABELS) as [PostType, string][];

/** SDD screen 25 — compose a campus post for student feeds (SRS 3.1.2.3). */
export function PostEditorScreen({ id }: { id: string }) {
  const posts = usePosts();
  if (posts.isPending) return <LoadingState />;
  if (posts.isError) return <ErrorState error={posts.error} onRetry={posts.refetch} />;
  const post = id === 'new' ? null : posts.data.find((p) => p.id === id);
  if (id !== 'new' && !post) return <ErrorState error={new Error('Post not found.')} />;
  return <PostForm post={post ?? null} />;
}

function PostForm({ post }: { post: Post | null }) {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const collegeId = useCollegeId();
  const actions = useRepActions();

  const [form, setForm] = useState({
    type: (post?.type ?? 'news') as PostType,
    title: post?.title ?? '',
    body: post?.body ?? '',
    event_at: post?.event_at?.slice(0, 10) ?? '',
  });
  const [image, setImage] = useState<LocalFile | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<typeof form>>({});
  const [saving, setSaving] = useState(false);

  const previewUri =
    image?.uri ?? (removeImage ? null : publicUrl('college-media', post?.media_path));

  async function save(publish: boolean) {
    const result = validate(postSchema, form);
    setErrors(result.errors ?? {});
    if (!result.data) return;
    setSaving(true);
    try {
      let media_path = removeImage ? null : (post?.media_path ?? null);
      if (image) media_path = await uploadPostImage(collegeId, image);
      await actions.savePost.mutateAsync({
        ...result.data,
        id: post?.id,
        college_id: collegeId,
        media_path,
        status: publish ? 'published' : 'draft',
      });
      // Clean up the file this post no longer uses.
      if (post?.media_path && post.media_path !== media_path) {
        await removeFile('college-media', post.media_path);
      }
      router.back();
    } catch (e) {
      Alert.alert('Could not save post', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!post) return;
    Alert.alert('Delete this post?', post.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await actions.deletePost.mutateAsync(post);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  async function chooseImage() {
    try {
      const file = await pickPhoto('library');
      if (file) {
        setImage(file);
        setRemoveImage(false);
      }
    } catch (e) {
      Alert.alert('Could not add image', getErrorMessage(e));
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: post ? 'Edit post' : 'New post' }} />
      <ChipGroup
        label="Post type"
        options={TYPES.map(([, label]) => label)}
        selected={[POST_TYPE_LABELS[form.type]]}
        onChange={(next) => {
          const type = TYPES.find(([, label]) => label === next[0])?.[0];
          if (type) setForm((f) => ({ ...f, type }));
        }}
        max={1}
      />
      <TextField
        label="Title"
        value={form.title}
        onChangeText={(title) => setForm((f) => ({ ...f, title }))}
        error={errors.title}
      />
      <TextField
        label="Content"
        value={form.body}
        onChangeText={(body) => setForm((f) => ({ ...f, body }))}
        error={errors.body}
        multiline
        maxLength={10000}
      />
      {form.type === 'event' || form.type === 'deadline' ? (
        <TextField
          label={form.type === 'event' ? 'Event date' : 'Deadline date'}
          value={form.event_at}
          onChangeText={(event_at) => setForm((f) => ({ ...f, event_at }))}
          error={errors.event_at}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      ) : null}

      <View style={styles.section}>
        <Text style={styles.cardTitle}>Image (optional)</Text>
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }}
            contentFit="cover"
            accessibilityLabel="Post image preview"
          />
        ) : null}
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              variant="secondary"
              label={previewUri ? 'Change image' : 'Add image'}
              onPress={chooseImage}
            />
          </View>
          {previewUri ? (
            <View style={styles.action}>
              <Button
                variant="link"
                label="Remove image"
                onPress={() => {
                  setImage(null);
                  setRemoveImage(true);
                }}
              />
            </View>
          ) : null}
        </View>
      </View>

      <Button
        label={post?.status === 'published' ? 'Update post' : 'Publish'}
        onPress={() => save(true)}
        loading={saving}
      />
      <Button
        variant="secondary"
        label="Save as draft"
        onPress={() => save(false)}
        disabled={saving}
      />
      {post ? <Button variant="link" label="Delete post" onPress={remove} /> : null}
    </ScrollView>
  );
}
