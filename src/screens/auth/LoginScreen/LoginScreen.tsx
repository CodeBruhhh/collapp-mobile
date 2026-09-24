import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { ROLE_LABELS, type Role } from '@/types/roles';

import { createStyles } from './LoginScreen.styles';

const ROLES: Role[] = ['student', 'school_rep', 'admin'];

export function LoginScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { signInAs } = useAuth();

  return (
    <View style={styles.root}>
      <Text accessibilityRole="header" style={styles.title}>
        CollApp
      </Text>
      <Text style={styles.subtitle}>
        Development sign-in. Real email/password, OAuth and biometrics will replace this with
        Supabase Auth.
      </Text>

      <View style={styles.actions}>
        {ROLES.map((role) => (
          <Button
            key={role}
            label={`Continue as ${ROLE_LABELS[role]}`}
            onPress={() => signInAs(role)}
          />
        ))}
      </View>
    </View>
  );
}
