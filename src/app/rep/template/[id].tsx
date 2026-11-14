import { useLocalSearchParams } from 'expo-router';

import { TemplateEditorScreen } from '@/screens/rep/TemplatesScreen';

export default function RepTemplate() {
  const { id, kind, from } = useLocalSearchParams<{ id: string; kind?: string; from?: string }>();
  return <TemplateEditorScreen id={id} kind={kind} from={from} />;
}
