import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createAccountStyles } from '../accountStyles';

const CONFIRMATION = 'DELETE';

const DELETED_DATA = [
  'Your account, name and email',
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
    Alert.alert(
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
              Alert.alert('Could not delete your account', getErrorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Delete account' }} />
      <View style={styles.form}>
        <Text accessibilityRole="header" style={styles.title}>
          Delete your CollApp account
        </Text>
        <Text style={styles.body}>This permanently removes:</Text>
        {DELETED_DATA.map((item) => (
          <Text key={item} style={styles.body}>
            • {item}
          </Text>
        ))}
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
          label="Delete my account"
          onPress={confirm}
          loading={deleting}
          disabled={!online || typed.trim().toUpperCase() !== CONFIRMATION}
        />
      </View>
    </FormScreen>
  );
}
