import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  ScrollView,
  TurboModuleRegistry,
  View,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';

import type * as KeyboardController from 'react-native-keyboard-controller';

type Lib = typeof KeyboardController;

/**
 * react-native-keyboard-controller, loaded only when this build has its native
 * side. Dev builds made before it was added would crash on import, so they get
 * plain fallbacks (the old keyboard behaviour) until they are rebuilt.
 */
function load(): Lib | null {
  if (!TurboModuleRegistry.get('KeyboardController')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-keyboard-controller') as Lib;
  } catch {
    return null;
  }
}

const lib = load();

function PlainProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function PlainScrollView({
  bottomOffset: _,
  ...props
}: ScrollViewProps & { bottomOffset?: number }) {
  return <ScrollView automaticallyAdjustKeyboardInsets {...props} />;
}

function PlainStickyView({ offset: _, ...props }: ViewProps & { offset?: unknown }) {
  return <View {...props} />;
}

/** Tracks the keyboard for the views below; mount once at the root. */
export const KeyboardProvider: Lib['KeyboardProvider'] =
  lib?.KeyboardProvider ?? (PlainProvider as unknown as Lib['KeyboardProvider']);

/** A ScrollView that keeps the focused field `bottomOffset` above the keyboard. */
export const KeyboardAwareScrollView: Lib['KeyboardAwareScrollView'] =
  lib?.KeyboardAwareScrollView ?? (PlainScrollView as unknown as Lib['KeyboardAwareScrollView']);

/** Moves with the keyboard, e.g. a footer that stays just above it. */
export const KeyboardStickyView: Lib['KeyboardStickyView'] =
  lib?.KeyboardStickyView ?? (PlainStickyView as unknown as Lib['KeyboardStickyView']);

/** Same API as React Native's, but also follows the keyboard inside Android modals. */
export const KeyboardAvoidingView: Lib['KeyboardAvoidingView'] =
  lib?.KeyboardAvoidingView ?? (RNKeyboardAvoidingView as unknown as Lib['KeyboardAvoidingView']);
