import { useLocalSearchParams } from 'expo-router';

import { ProgramEditorScreen } from '@/screens/rep/ProgramEditorScreen';

export default function RepProgram() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProgramEditorScreen id={id} />;
}
