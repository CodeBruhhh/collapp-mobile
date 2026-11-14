import * as Crypto from 'expo-crypto';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A readable temporary password with letters and digits (meets the password rules). */
export function generatePassword(): string {
  const bytes = Crypto.getRandomBytes(14);
  const body = Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('');
  return `${body.slice(0, 7)}-${body.slice(7)}${(bytes[0] % 8) + 2}`;
}

/** Sign-in details an admin shares with a new representative. */
export function signInMessage(collegeName: string, email: string, password: string): string {
  return `Your CollApp representative account for ${collegeName}\nEmail: ${email}\nTemporary password: ${password}\nPlease change it after signing in (Settings › Change password).`;
}
