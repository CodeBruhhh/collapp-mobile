import { Stack } from 'expo-router';

// Tabs live in (tabs). Detail screens (e.g. an application or thread) go
// beside it in this folder so they open on top of the tab bar.
export default function RepLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
