import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { PageHeading } from '@/components/PageHeading';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTheme } from '@/hooks/useTheme';
import { ask, notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';

import { createAccountStyles } from '../accountStyles';

const CONFIRMATION = 'DELETE';

const DELETED_DATA = [
  'Your account, name, email and profile photo',
  'Your academic profile and AI matches',
  'All applications, including submitted ones, and every uploaded document',
  'Your messages, attachments and notifications',
];

/** SDD screen 18 — permanent account deletion for students (RA 10173 right to erasure). */
export function DeleteAccountScreen() {
  const { colors } = useTheme();
  const styles = createAccountStyles(colors);
  const { deleteAccount } = useAuth();
  const online = useIsOnline();
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  function confirm() {
    ask(
      'Delete your account forever?',
      'This cannot be undone. Colleges you applied to will no longer see your application.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // On success the session ends and the app returns to sign-in.
              await deleteAccount();
            } catch (e) {
              setDeleting(false);
              notify.error('Could not delete your account', getErrorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <FormScreen underHeader>
      <Stack.Screen options={{ title: 'Delete account' }} />
      <View style={styles.form}>
        <PageHeading title="Delete your CollApp account" subtitle="This permanently removes:" />
        <View>
          {DELETED_DATA.map((item) => (
            <View key={item} style={styles.loss}>
              <Icon name="close-circle" size={18} color={colors.danger} />
              <Text style={styles.lossText}>{item}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.hint}>Want a copy first? Go back and choose Download my data.</Text>
        <TextField
          label={`Type ${CONFIRMATION} to confirm`}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect={false}
        />
        {!online ? (
          <Text style={styles.hint}>Connect to the internet to delete your account.</Text>
        ) : null}
        <Button
          variant="danger"
          label="Delete my account"
          onPress={confirm}
          loading={deleting}
          disabled={!online || typed.trim().toUpperCase() !== CONFIRMATION}
        />
      </View>
    </FormScreen>
  );
}
