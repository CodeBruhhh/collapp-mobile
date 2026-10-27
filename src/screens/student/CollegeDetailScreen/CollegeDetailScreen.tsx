import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useApplicationsWithLocal } from '@/features/applications/offline';
import { deadlineLabel } from '@/features/applications/status';
import { collegeLocation, requirementsFor } from '@/features/colleges/api';
import { useCollege, useFollowedColleges, useToggleFollow } from '@/features/colleges/hooks';
import { useStartThread } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './CollegeDetailScreen.styles';

type Tab = 'about' | 'programs' | 'requirements';
type IconName = ComponentProps<typeof Ionicons>['name'];

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

/** One compact fact (icon + short value) for a program card. */
function Fact({ icon, label }: { icon: IconName; label: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.factText}>{label}</Text>
    </View>
  );
}

/** SDD screen 9 — college profile, programs and requirements, with Save and Apply. */
export function CollegeDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [tab, setTab] = useState<Tab>('about');

  const college = useCollege(id);
  const followed = useFollowedColleges();
  const toggleFollow = useToggleFollow();
  const startThread = useStartThread();
  const applications = useApplicationsWithLocal();

  if (college.isPending) return <LoadingState variant="detail" />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;

  const c = college.data;
  const isSaved = followed.data?.includes(c.id) ?? false;
  const existing = applications.data?.find((a) => a.college_id === c.id);
  const openPrograms = c.programs.filter((p) => p.is_open);
  const upcoming = openPrograms
    .filter((p) => p.deadline)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
    .slice(0, 3);
  const generalRequirements = requirementsFor(c, null).filter((r) => r.program_id === null);

  async function handleSave() {
    try {
      await toggleFollow.mutateAsync({ collegeId: c.id, following: !isSaved });
    } catch (e) {
      Alert.alert('Could not update', getErrorMessage(e));
    }
  }

  // Formal inquiry to this college's representatives (SRS 3.6.5).
  async function handleMessage() {
    try {
      const thread = await startThread.mutateAsync({ collegeId: c.id });
      router.push({ pathname: '/student/thread/[id]', params: { id: thread.id } });
    } catch (e) {
      Alert.alert('Could not open conversation', getErrorMessage(e));
    }
  }

  const apply = () =>
    router.push({ pathname: '/student/apply/[collegeId]', params: { collegeId: c.id } });

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <CollegeLogo name={c.name} logoPath={c.logo_path} size={64} />
          <View style={styles.heroText}>
            <Text accessibilityRole="header" style={styles.name}>
              {c.name}
            </Text>
            <Text style={styles.meta}>{collegeLocation(c)}</Text>
          </View>
        </View>

        <FilterTabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'about', label: 'About' },
            { value: 'programs', label: 'Programs', count: c.programs.length },
            { value: 'requirements', label: 'Requirements' },
          ]}
        />

        {tab === 'about' ? (
          <View style={styles.section}>
            <Card>
              <Text style={c.description ? styles.body : styles.meta}>
                {c.description || 'No description yet.'}
              </Text>
              {c.website ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => WebBrowser.openBrowserAsync(c.website!)}
                  style={styles.link}>
                  <Ionicons name="globe-outline" size={16} color={colors.primary} />
                  <Text style={styles.linkText}>Visit website</Text>
                </Pressable>
              ) : null}
            </Card>
            <Card>
              <View style={styles.kv}>
                <Text style={styles.kvLabel}>Open programs</Text>
                <Text style={styles.kvValue}>{openPrograms.length}</Text>
              </View>
              {upcoming.map((p) => (
                <View key={p.id} style={styles.kv}>
                  <Text style={styles.kvLabel} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.kvValue}>{deadlineLabel(p.deadline)}</Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {tab === 'programs' ? (
          <View style={styles.section}>
            {c.programs.length === 0 ? (
              <EmptyState icon="book-outline" title="No programs yet" />
            ) : (
              c.programs.map((p) => (
                <Card key={p.id}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{p.name}</Text>
                    {!p.is_open ? <Text style={styles.closed}>Closed</Text> : null}
                  </View>
                  {p.description ? (
                    <Text style={styles.body} numberOfLines={3}>
                      {p.description}
                    </Text>
                  ) : null}
                  <View style={styles.facts}>
                    {p.deadline ? (
                      <Fact
                        icon="calendar-outline"
                        label={deadlineLabel(p.deadline) ?? p.deadline}
                      />
                    ) : null}
                    {p.tuition_per_year !== null ? (
                      <Fact icon="cash-outline" label={`${peso.format(p.tuition_per_year)}/yr`} />
                    ) : null}
                    {p.min_gpa !== null ? (
                      <Fact icon="ribbon-outline" label={`Min. ${p.min_gpa}`} />
                    ) : null}
                    {p.strands.length ? (
                      <Fact icon="school-outline" label={p.strands.join(', ')} />
                    ) : null}
                  </View>
                  {p.prerequisites ? (
                    <Text style={styles.meta} numberOfLines={2}>
                      {p.prerequisites}
                    </Text>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        ) : null}

        {tab === 'requirements' ? (
          <View style={styles.section}>
            <Text style={styles.meta}>For every program</Text>
            {generalRequirements.map((r) => (
              <Card key={r.id}>
                <View style={styles.reqRow}>
                  <Ionicons
                    name={r.kind === 'essay' ? 'create-outline' : 'document-text-outline'}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{r.label}</Text>
                    {r.description ? (
                      <Text style={styles.meta} numberOfLines={2}>
                        {r.description}
                      </Text>
                    ) : null}
                  </View>
                  {!r.is_required ? <Text style={styles.optional}>Optional</Text> : null}
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from saved' : 'Save university'}
          accessibilityState={{ selected: isSaved, busy: toggleFollow.isPending }}
          disabled={toggleFollow.isPending}
          onPress={handleSave}
          style={[styles.iconAction, isSaved && styles.iconActionActive]}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={colors.primary}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message admissions"
          accessibilityState={{ busy: startThread.isPending }}
          disabled={startThread.isPending}
          onPress={handleMessage}
          style={styles.iconAction}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.flex}>
          {existing && existing.status !== 'draft' ? (
            <Button
              label="View application"
              onPress={() =>
                router.push({ pathname: '/student/application/[id]', params: { id: existing.id } })
              }
            />
          ) : existing ? (
            <Button label="Continue draft" onPress={apply} />
          ) : (
            <Button label="Apply now" disabled={openPrograms.length === 0} onPress={apply} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
