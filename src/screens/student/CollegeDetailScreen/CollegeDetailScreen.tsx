import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useApplicationsWithLocal } from '@/features/applications/offline';
import { deadlineLabel } from '@/features/applications/status';
import { collegeLocation, requirementsFor } from '@/features/colleges/api';
import { useCollege, useFollowedColleges, useToggleFollow } from '@/features/colleges/hooks';
import { useStartThread } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './CollegeDetailScreen.styles';

type Tab = 'about' | 'programs' | 'requirements';

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

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

  if (college.isPending) return <LoadingState />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;

  const c = college.data;
  const isSaved = followed.data?.includes(c.id) ?? false;
  const existing = applications.data?.find((a) => a.college_id === c.id);
  const openPrograms = c.programs.filter((p) => p.is_open);
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

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen options={{ title: c.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <CollegeLogo name={c.name} logoPath={c.logo_path} size={72} />
          <View style={styles.heroText}>
            <Text accessibilityRole="header" style={styles.name}>
              {c.name}
            </Text>
            <Text style={styles.meta}>
              <Ionicons name="location-outline" size={14} /> {collegeLocation(c)}
            </Text>
            {c.region ? <Text style={styles.meta}>{c.region}</Text> : null}
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
              <Text style={styles.cardTitle}>Overview</Text>
              <Text style={styles.body}>
                {c.description || 'This college has not added a description yet.'}
              </Text>
              {c.website ? (
                <Button
                  variant="link"
                  label="Visit website"
                  onPress={() => WebBrowser.openBrowserAsync(c.website!)}
                />
              ) : null}
            </Card>
            <Card>
              <Text style={styles.cardTitle}>Key details</Text>
              <Text style={styles.body}>
                {openPrograms.length} open program{openPrograms.length === 1 ? '' : 's'}
              </Text>
              {openPrograms
                .filter((p) => p.deadline)
                .slice(0, 3)
                .map((p) => (
                  <Text key={p.id} style={styles.meta}>
                    {p.name}: {p.deadline} ({deadlineLabel(p.deadline)})
                  </Text>
                ))}
            </Card>
          </View>
        ) : null}

        {tab === 'programs' ? (
          <View style={styles.section}>
            {c.programs.length === 0 ? (
              <Text style={styles.meta}>No programs listed yet.</Text>
            ) : (
              c.programs.map((p) => (
                <Card key={p.id}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{p.name}</Text>
                    {!p.is_open ? <Text style={styles.closed}>Closed</Text> : null}
                  </View>
                  {p.description ? <Text style={styles.body}>{p.description}</Text> : null}
                  {p.deadline ? (
                    <Text style={styles.meta}>
                      Deadline {p.deadline} · {deadlineLabel(p.deadline)}
                    </Text>
                  ) : null}
                  {p.tuition_per_year !== null ? (
                    <Text style={styles.meta}>
                      Tuition {peso.format(p.tuition_per_year)} per year
                    </Text>
                  ) : null}
                  {p.min_gpa !== null ? (
                    <Text style={styles.meta}>Minimum average {p.min_gpa}</Text>
                  ) : null}
                  {p.strands.length ? (
                    <Text style={styles.meta}>Preferred strands: {p.strands.join(', ')}</Text>
                  ) : null}
                  {p.prerequisites ? (
                    <Text style={styles.meta}>Prerequisites: {p.prerequisites}</Text>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        ) : null}

        {tab === 'requirements' ? (
          <View style={styles.section}>
            <Text style={styles.meta}>
              Required for every program. Some programs add their own requirements.
            </Text>
            {generalRequirements.map((r) => (
              <Card key={r.id}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{r.label}</Text>
                  <Text style={r.is_required ? styles.required : styles.meta}>
                    {r.is_required ? 'Required' : 'Optional'}
                  </Text>
                </View>
                {r.description ? <Text style={styles.body}>{r.description}</Text> : null}
                <Text style={styles.meta}>{r.kind === 'essay' ? 'Essay' : 'Document upload'}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerSave}>
          <Button
            variant="secondary"
            label={isSaved ? 'Saved' : 'Save'}
            onPress={handleSave}
            loading={toggleFollow.isPending}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message admissions"
          accessibilityState={{ busy: startThread.isPending }}
          disabled={startThread.isPending}
          onPress={handleMessage}
          style={styles.footerMessage}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.footerApply}>
          {existing && existing.status !== 'draft' ? (
            <Button
              label="View application"
              onPress={() =>
                router.push({ pathname: '/student/application/[id]', params: { id: existing.id } })
              }
            />
          ) : existing ? (
            <Button
              label="Continue draft"
              onPress={() =>
                router.push({ pathname: '/student/apply/[collegeId]', params: { collegeId: c.id } })
              }
            />
          ) : (
            <Button
              label="Apply now"
              disabled={openPrograms.length === 0}
              onPress={() =>
                router.push({ pathname: '/student/apply/[collegeId]', params: { collegeId: c.id } })
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
