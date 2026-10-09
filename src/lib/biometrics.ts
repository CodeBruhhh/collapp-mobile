import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Biometrics only gate an existing session on this device; they never replace
// the password (SPMP R10). The opt-in flag is stored per user in the keychain.
const keyFor = (userId: string) => `collapp.biometric.${userId}`;

/** True when the device has Face ID / fingerprint hardware with an enrolled biometric. */
export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

export async function isBiometricEnabled(userId: string): Promise<boolean> {
  return (await SecureStore.getItemAsync(keyFor(userId))) === 'on';
}

export async function setBiometricEnabled(userId: string, enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(keyFor(userId), 'on');
  } else {
    await SecureStore.deleteItemAsync(keyFor(userId));
  }
}

/** After a password sign-in, offer biometric unlock once if the device supports it. */
export async function offerBiometricUnlock(userId: string): Promise<void> {
  if (!(await isBiometricAvailable()) || (await isBiometricEnabled(userId))) return;
  Alert.alert('Unlock faster next time?', 'Use Face ID or your fingerprint to open CollApp.', [
    { text: 'Not now', style: 'cancel' },
    {
      text: 'Enable',
      onPress: async () => {
        if (await authenticateWithBiometrics()) await setBiometricEnabled(userId, true);
      },
    },
  ]);
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock CollApp',
    cancelLabel: 'Use password instead',
    disableDeviceFallback: false,
  });
  return result.success;
}
