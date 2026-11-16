import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Share, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { InfoRow } from '@/components/InfoRow';
import { PageHeading } from '@/components/PageHeading';
import { TextField } from '@/components/TextField';
import { useAdminActions } from '@/features/admin/hooks';
import { adminSignInMessage, generatePassword } from '@/features/admin/password';
import { createAdminSchema } from '@/features/admin/schemas';
import { useTheme } from '@/hooks/useTheme';
import { validate, type FieldErrors } from '@/lib/validation';

import { createScreenStyles } from '@/screens/screenStyles';

type Form = { name: string; email: string; password: string };

/** Add another administrator. Admins never self-register. */
export function CreateAdminScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const { addAdmin } = useAdminActions();
  const [form, setForm] = useState<Form>(() => ({
    name: '',
    email: '',
    password: generatePassword(),
  }));
  const [errors, setErrors] = useState<FieldErrors<Form>>({});
  const [confirming, setConfirming] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const set =
    <K extends keyof Form>(key: K) =>
    (value: Form[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  function review() {
    const result = validate(createAdminSchema, form);
    setErrors(result.errors ?? {});
    if (!result.data) return;
    setConfirming(true);
  }

  async function create() {
    const result = validate(createAdminSchema, form);
    if (!result.data) return;
    const d = result.data;
    // Errors (e.g. the email is already registered) show inside the confirmation sheet.
    await addAdmin.mutateAsync({ fullName: d.name, email: d.email, password: d.password });
    setCreated({ email: d.email, password: d.password });
  }

  return (
    <FormScreen underHeader>
      <Stack.Screen options={{ title: 'Add administrator' }} />
      <PageHeading
        title="New administrator"
        subtitle="Administrators can manage every college, account, broadcast and platform setting."
      />
      <View style={styles.section}>
        <Text style={styles.meta}>
          The account is ready to use right away; ask them to change the password after signing in.
        </Text>
        <TextField
          label="Full name"
          value={form.name}
          onChangeText={set('name')}
          error={errors.name}
          autoComplete="off"
        />
        <TextField
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="off"
        />
        <TextField
          label="Temporary password"
          value={form.password}
          onChangeText={set('password')}
          error={errors.password}
          autoCapitalize="none"
          autoComplete="off"
        />
        <Button
          variant="link"
          label="Generate a new password"
          onPress={() => set('password')(generatePassword())}
        />
      </View>

      <Button label="Add administrator" onPress={review} loading={addAdmin.isPending} />

      <ActionSheet
        visible={confirming && !created}
        onClose={() => setConfirming(false)}
        eyebrow="Full platform access"
        title={`Make ${form.name.trim() || 'this person'} an administrator?`}
        subtitle={form.email.trim()}
        message="They will be able to suspend accounts, change roles, publish colleges and change platform settings. Only add people you trust."
        actions={[{ label: 'Add administrator', onPress: create }]}
      />

      {created ? (
        <ActionSheet
          visible
          onClose={() => router.back()}
          eyebrow="Administrator added"
          title={form.name.trim()}
          subtitle="Share these sign-in details securely."
          actions={[
            {
              label: 'Share sign-in details',
              hint: 'Opens your share sheet',
              onPress: () =>
                Share.share({ message: adminSignInMessage(created.email, created.password) }),
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
