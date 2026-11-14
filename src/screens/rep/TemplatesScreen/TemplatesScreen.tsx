import { router, Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { LedgerRow } from '@/components/LedgerRow';
import { PageHeading } from '@/components/PageHeading';
import { Section } from '@/components/Section';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useTemplates } from '@/features/rep/hooks';
import { BUILT_IN_TEMPLATES, TEMPLATE_KINDS, type TemplateKind } from '@/features/rep/templates';
import { useTheme } from '@/hooks/useTheme';

import { createScreenStyles } from '@/screens/screenStyles';

const openEditor = (id: string, kind?: TemplateKind) =>
  router.push({ pathname: '/rep/template/[id]', params: kind ? { id, kind } : { id } });

/** The college's saved messages for decisions and resubmission requests. */
export function TemplatesScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const templates = useTemplates();

  if (templates.isPending) return <LoadingState variant="detail" />;
  if (templates.isError) return <ErrorState error={templates.error} onRetry={templates.refetch} />;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: 'Message templates' }} />
      <View style={styles.overview}>
        <PageHeading
          title="Message templates"
          subtitle="Saved wording your team picks from when deciding or asking for a resubmission. Names, programs and documents are filled in for each student."
        />
      </View>
      {TEMPLATE_KINDS.map(({ kind, label, hint }) => {
        const saved = templates.data.filter((t) => t.kind === kind);
        const builtIn = BUILT_IN_TEMPLATES.filter((t) => t.kind === kind);
        return (
          <Section
            key={kind}
            title={label}
            trailing={{ label: 'Add', onPress: () => openEditor('new', kind) }}>
            <Text style={[styles.meta, styles.templateHint]}>{hint}</Text>
            {saved.map((t, i) => (
              <LedgerRow
                key={t.id}
                first={i === 0}
                title={t.title}
                subtitle={t.body}
                onPress={() => openEditor(t.id!)}
              />
            ))}
            {builtIn.map((t, i) => (
              <LedgerRow
                key={t.title}
                first={!saved.length && i === 0}
                title={`${t.title} (CollApp)`}
                subtitle={t.body}
                // Built-ins can't change; opening one starts a copy to edit.
                onPress={() =>
                  router.push({
                    pathname: '/rep/template/[id]',
                    params: { id: 'new', kind, from: t.title },
                  })
                }
              />
            ))}
          </Section>
        );
      })}
    </ScrollView>
  );
}
