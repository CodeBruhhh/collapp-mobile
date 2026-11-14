import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Share, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { InfoRow } from '@/components/InfoRow';
import { PageHeading } from '@/components/PageHeading';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { useAdminActions, useAllColleges } from '@/features/admin/hooks';
import { generatePassword, signInMessage } from '@/features/admin/password';
import { createRepSchema } from '@/features/admin/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createScreenStyles } from '@/screens/screenStyles';

type Form = { repName: string; repEmail: string; repPassword: string };

/** Add another representative to an existing college. Reps never self-register. */
export function AddRepScreen({ collegeId }: { collegeId: string }) {
  const colleges = useAllColleges();
  if (colleges.isPending) return <LoadingState variant="detail" />;
  if (colleges.isError) return <ErrorState error={colleges.error} onRetry={colleges.refetch} />;
  const college = colleges.data.find((c) => c.id === collegeId);
  if (!college) return <ErrorState error={new Error('College not found.')} />;
  return <AddRepForm collegeId={college.id} collegeName={college.name} />;
}

function AddRepForm({ collegeId, collegeName }: { collegeId: string; collegeName: string }) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const { addRep } = useAdminActions();
  const [form, setForm] = useState<Form>(() => ({
    repName: '',
    repEmail: '',
    repPassword: generatePassword(),
  }));
  const [errors, setErrors] = useState<FieldErrors<Form>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const set =
    <K extends keyof Form>(key: K) =>
    (value: Form[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    const result = validate(createRepSchema, form);
    setErrors(result.errors ?? {});
    if (!result.data) return;
    setSubmitError(null);
    const d = result.data;
    try {
      await addRep.mutateAsync({
        collegeId,
        rep: { fullName: d.repName, email: d.repEmail, password: d.repPassword },
      });
      setCreated({ email: d.repEmail, password: d.repPassword });
    } catch (e) {
      setSubmitError(getErrorMessage(e));
    }
  }

  return (
    <FormScreen underHeader>
      <Stack.Screen options={{ title: 'Add representative' }} />
      <PageHeading
        title={collegeName}
        subtitle="Representatives of a college share its applicant queue, page, posts and messages."
      />
      <View style={styles.section}>
        <Text style={styles.meta}>
          The account is ready to use right away; ask them to change the password after signing in.
        </Text>
        <TextField
          label="Full name"
          value={form.repName}
          onChangeText={set('repName')}
          error={errors.repName}
          autoComplete="off"
        />
        <TextField
          label="Email"
          value={form.repEmail}
          onChangeText={set('repEmail')}
          error={errors.repEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="off"
        />
        <TextField
          label="Temporary password"
          value={form.repPassword}
          onChangeText={set('repPassword')}
          error={errors.repPassword}
          autoCapitalize="none"
          autoComplete="off"
        />
        <Button
          variant="link"
          label="Generate a new password"
          onPress={() => set('repPassword')(generatePassword())}
        />
      </View>

      {submitError ? <Text style={styles.dangerText}>{submitError}</Text> : null}
      <Button label="Add representative" onPress={submit} loading={addRep.isPending} />

      {created ? (
        <ActionSheet
          visible
          onClose={() => router.back()}
          eyebrow="Representative added"
          title={collegeName}
          subtitle="Share these sign-in details with the representative securely."
          actions={[
            {
              label: 'Share sign-in details',
              hint: 'Opens your share sheet',
              onPress: () =>
                Share.share({
                  message: signInMessage(collegeName, created.email, created.password),
                }),
            },
          ]}
          cancelLabel="Done">
          <InfoRow label="Email" value={created.email} />
          <InfoRow label="Temporary password" value={created.password} />
        </ActionSheet>
      ) : null}
    </FormScreen>
  );
}
