import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { FormScreen } from '@/components/FormScreen';
import { InfoRow } from '@/components/InfoRow';
import { PageHeading } from '@/components/PageHeading';
import { Select } from '@/components/Select';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import type { AdminUser } from '@/features/admin/api';
import { useAdminActions, useAdminUser, useAllColleges } from '@/features/admin/hooks';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { ROLE_LABELS, type Role } from '@/types/roles';

import { createScreenStyles } from '@/screens/screenStyles';

const ROLES: Role[] = ['student', 'school_rep', 'admin'];
const LABEL_TO_ROLE = Object.fromEntries(ROLES.map((r) => [ROLE_LABELS[r], r])) as Record<
  string,
  Role
>;

/** What changes for the person, shown before the admin confirms. */
const ROLE_EFFECTS: Record<Role, string> = {
  student:
    'They lose staff access and use CollApp as an applicant. They will be asked to complete a student profile.',
  school_rep:
    "They can manage this college's page, programs and posts, review its applicants and send decisions.",
  admin: 'They get full platform access: every college, account, broadcast and platform setting.',
};

/** Change someone's role, or move a representative to another college. */
export function UserAccessScreen({ userId }: { userId: string }) {
  const user = useAdminUser(userId);
  const colleges = useAllColleges();
  if (user.isPending || colleges.isPending) return <LoadingState variant="detail" />;
  if (user.isError) return <ErrorState error={user.error} onRetry={user.refetch} />;
  if (colleges.isError) return <ErrorState error={colleges.error} onRetry={colleges.refetch} />;
  return <UserAccessForm user={user.data} colleges={colleges.data} />;
}

function UserAccessForm({
  user,
  colleges,
}: {
  user: AdminUser;
  colleges: { id: string; name: string; suspended_at: string | null }[];
}) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const { session } = useAuth();
  const { userRole } = useAdminActions();
  const [role, setRole] = useState<Role>(user.role);
  const [collegeId, setCollegeId] = useState<string | null>(user.college_id);
  const [collegeError, setCollegeError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);

  const isMe = user.id === session?.user.id;
  const college = colleges.find((c) => c.id === collegeId) ?? null;
  const unchanged = role === user.role && (role !== 'school_rep' || collegeId === user.college_id);
  const name = user.full_name || user.email;

  function review() {
    if (role === 'school_rep' && !collegeId) {
      setCollegeError('Choose the college they will represent');
      return;
    }
    setCollegeError(undefined);
    setConfirming(true);
  }

  async function save() {
    await userRole.mutateAsync([user.id, role, role === 'school_rep' ? collegeId : null]);
    notify.success('Access updated', `${name} is now ${ROLE_LABELS[role].toLowerCase()}.`);
    router.back();
  }

  const movingCollege =
    user.role === 'school_rep' && role === 'school_rep' && collegeId !== user.college_id;

  return (
    <FormScreen underHeader>
      <Stack.Screen options={{ title: 'Role and access' }} />
      <PageHeading title={user.full_name || 'No name'} subtitle={user.email} />
      <View>
        <InfoRow label="Current role" value={ROLE_LABELS[user.role]} />
        {user.college ? <InfoRow label="College" value={user.college.name} /> : null}
        <InfoRow label="Status" value={user.status === 'active' ? 'Active' : 'Suspended'} />
      </View>

      {isMe ? (
        <Text style={styles.meta}>
          You cannot change your own role. Ask another administrator to do it.
        </Text>
      ) : (
        <>
          <ChipGroup
            label="Role"
            options={ROLES.map((r) => ROLE_LABELS[r])}
            selected={[ROLE_LABELS[role]]}
            onChange={(next) => next[0] && setRole(LABEL_TO_ROLE[next[0]])}
            max={1}
          />
          {role === 'school_rep' ? (
            <Select
              label="College"
              value={college?.name ?? null}
              options={colleges.filter((c) => !c.suspended_at).map((c) => c.name)}
              onChange={(collegeName) => {
                setCollegeId(colleges.find((c) => c.name === collegeName)?.id ?? null);
                setCollegeError(undefined);
              }}
              placeholder="Choose a college"
              error={collegeError}
            />
          ) : null}
          <Text style={styles.meta}>{ROLE_EFFECTS[role]}</Text>
          {movingCollege ? (
            <Text style={styles.meta}>
              Applications assigned to them at their current college go back to the shared queue.
            </Text>
          ) : null}
          <Button
            label="Save changes"
            onPress={review}
            disabled={unchanged}
            loading={userRole.isPending}
          />
        </>
      )}

      <ActionSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        eyebrow="Change access"
        title={
          movingCollege
            ? `Move ${name} to ${college?.name}?`
            : `Make ${name} ${ROLE_LABELS[role].toLowerCase()}?`
        }
        message={`${ROLE_EFFECTS[role]} The change applies right away and is recorded in the audit log.`}
        actions={[{ label: 'Confirm change', onPress: save }]}
      />
    </FormScreen>
  );
}
