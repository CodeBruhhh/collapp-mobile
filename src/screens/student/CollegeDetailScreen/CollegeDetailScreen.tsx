import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { Icon, type IconName } from '@/components/Icon';
import { InfoRow } from '@/components/InfoRow';
import { LedgerRow } from '@/components/LedgerRow';
import { Masthead } from '@/components/Masthead';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { StatusBadge } from '@/components/StatusBadge';
import { StickyActionBar } from '@/components/StickyActionBar';
import { useApplicationsWithLocal } from '@/features/applications/offline';
import { daysUntil, deadlineLabel } from '@/features/applications/status';
import { collegeLocation, requirementsFor } from '@/features/colleges/api';
import { useCollege, useFollowedColleges, useToggleFollow } from '@/features/colleges/hooks';
import { useStartThread } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './CollegeDetailScreen.styles';

type Tab = 'about' | 'programs' | 'requirements';
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
      <Icon name={icon} size={14} color={colors.textMuted} />
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

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => router.back()}
      style={styles.navButton}>
      <Icon name="chevron-back" size={22} color={colors.onPrimary} />
    </Pressable>
  );

  // The masthead replaces the navigation bar, so every state keeps a way back.
  if (college.isPending || college.isError) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <Masthead top={back} />
        {college.isPending ? (
          <LoadingState variant="detail" />
        ) : (
          <ErrorState error={college.error} onRetry={college.refetch} />
        )}
      </View>
    );
  }

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
      notify.error('Could not update', getErrorMessage(e));
    }
  }

  // Formal inquiry to this college's representatives (SRS 3.6.5).
  async function handleMessage() {
    try {
      const thread = await startThread.mutateAsync({ collegeId: c.id });
      router.push({ pathname: '/student/thread/[id]', params: { id: thread.id } });
    } catch (e) {
      notify.error('Could not open conversation', getErrorMessage(e));
    }
  }

  const apply = () =>
    router.push({ pathname: '/student/apply/[collegeId]', params: { collegeId: c.id } });

  const nextDays = daysUntil(upcoming[0]?.deadline);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Masthead
          title={c.name}
          subtitle={collegeLocation(c)}
          logo={<CollegeLogo name={c.name} logoPath={c.logo_path} size={56} />}
          top={
            <>
              {back}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove from saved' : 'Save university'}
                accessibilityState={{ selected: isSaved, busy: toggleFollow.isPending }}
                disabled={toggleFollow.isPending}
                onPress={handleSave}
                style={styles.navButton}>
                <Icon
                  name={isSaved ? 'bookmark-filled' : 'bookmark'}
                  size={22}
                  color={colors.onPrimary}
                />
              </Pressable>
            </>
          }
          stats={[
            { label: 'Programs', value: c.programs.length },
            { label: 'Open now', value: openPrograms.length },
            ...(nextDays !== null && nextDays >= 0
              ? [{ label: 'Next deadline', value: `${nextDays}d` }]
              : []),
          ]}
        />

        <View style={styles.tabs}>
          <FilterTabs<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'about', label: 'About' },
              { value: 'programs', label: 'Programs', count: c.programs.length },
              { value: 'requirements', label: 'Requirements' },
            ]}
          />
        </View>

        {tab === 'about' ? (
          <View style={styles.section}>
            <Text style={c.description ? styles.body : styles.meta}>
              {c.description || 'No description yet.'}
            </Text>
            {c.website ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => WebBrowser.openBrowserAsync(c.website!)}
                style={styles.link}>
                <Icon name="globe" size={16} color={colors.primary} />
                <Text style={styles.linkText}>Visit website</Text>
              </Pressable>
            ) : null}
            <View style={styles.ledger}>
              <InfoRow label="Open programs" value={String(openPrograms.length)} />
              {upcoming.map((p) => (
                <InfoRow key={p.id} label={p.name} value={deadlineLabel(p.deadline) ?? undefined} />
              ))}
            </View>
          </View>
        ) : null}

        {tab === 'programs' ? (
          <View style={styles.section}>
            {c.programs.length === 0 ? (
              <EmptyState icon="book" title="No programs yet" />
            ) : (
              c.programs.map((p) => (
                <View key={p.id} style={styles.program}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{p.name}</Text>
                    <StatusBadge
                      label={p.is_open ? 'Open' : 'Closed'}
                      color={p.is_open ? colors.primary : colors.textMuted}
                    />
                  </View>
                  {p.description ? (
                    <Text style={styles.meta} numberOfLines={3}>
                      {p.description}
                    </Text>
                  ) : null}
                  <View style={styles.facts}>
                    {p.deadline ? (
                      <Fact icon="calendar" label={deadlineLabel(p.deadline) ?? p.deadline} />
                    ) : null}
                    {p.tuition_per_year !== null ? (
                      <Fact icon="cash" label={`${peso.format(p.tuition_per_year)}/yr`} />
                    ) : null}
                    {p.min_gpa !== null ? <Fact icon="ribbon" label={`Min. ${p.min_gpa}`} /> : null}
                    {p.strands.length ? <Fact icon="school" label={p.strands.join(', ')} /> : null}
                  </View>
                  {p.prerequisites ? (
                    <Text style={styles.meta} numberOfLines={2}>
                      {p.prerequisites}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'requirements' ? (
          <View style={styles.section}>
            <Text style={styles.meta}>For every program</Text>
            <View>
              {generalRequirements.map((r) => (
                <LedgerRow
                  key={r.id}
                  title={r.label}
                  subtitle={r.description ?? undefined}
                  leading={
                    <Icon
                      name={r.kind === 'essay' ? 'create' : 'document-text'}
                      size={18}
                      color={colors.primary}
                    />
                  }
                  trailing={!r.is_required ? <Text style={styles.optional}>Optional</Text> : null}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <StickyActionBar>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message admissions"
          accessibilityState={{ busy: startThread.isPending }}
          disabled={startThread.isPending}
          onPress={handleMessage}
          style={styles.iconAction}>
          <Icon name="chatbubble-ellipses" size={20} color={colors.text} />
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
      </StickyActionBar>
    </View>
  );
}
