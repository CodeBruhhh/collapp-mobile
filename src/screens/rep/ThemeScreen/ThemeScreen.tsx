import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FormScreen } from '@/components/FormScreen';
import { Icon } from '@/components/Icon';
import { PageHeading } from '@/components/PageHeading';
import { ErrorState, LoadingState } from '@/components/StateView';
import { StickyActionBar } from '@/components/StickyActionBar';
import { TextField } from '@/components/TextField';
import { BrandTheme } from '@/context/BrandThemeContext';
import type { RepCollege } from '@/features/rep/api';
import { useMyCollege, useRepActions } from '@/features/rep/hooks';
import { themeFromLogo } from '@/features/theme/logo';
import { normalizeHex, shadesOf } from '@/features/theme/palette';
import { parseCollegeTheme, type CollegeTheme } from '@/features/theme/schema';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { publicUrl } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';
import { lightColors } from '@/styles';

import { createStyles } from './ThemeScreen.styles';

type Slot = 'primary' | 'secondary' | 'accent';

const SLOTS: { key: Slot; label: string; use: string }[] = [
  { key: 'primary', label: 'Primary', use: 'Header, buttons, tabs and links' },
  { key: 'secondary', label: 'Secondary', use: 'The stripe under the header' },
  { key: 'accent', label: 'Accent', use: 'Icons and the end of the stripe' },
];

/** Where an edit starts when the page still uses CollApp's colours. */
const APP_THEME: CollegeTheme = {
  primary: lightColors.primary,
  secondary: lightColors.status.submitted,
  accent: lightColors.status.underReview,
};

/** The college page's colours: picked from the logo, then adjustable (SDD screen 23). */
export function ThemeScreen() {
  const college = useMyCollege();
  if (college.isPending) return <LoadingState variant="detail" />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;
  return <ThemeEditor college={college.data} />;
}

function ThemeEditor({ college }: { college: RepCollege }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const actions = useRepActions();
  const saved = parseCollegeTheme(college.theme);
  const logoUri = publicUrl('college-media', college.logo_path);

  const [draft, setDraft] = useState<CollegeTheme | null>(saved);
  const [open, setOpen] = useState<Slot | null>(null);
  const [hexText, setHexText] = useState('');
  const [hexInvalid, setHexInvalid] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const shown = draft ?? APP_THEME;
  const palette = draft?.palette ?? saved?.palette ?? [];

  function toggle(slot: Slot) {
    setOpen((current) => (current === slot ? null : slot));
    setHexText(shown[slot]);
    setHexInvalid(false);
  }

  function choose(slot: Slot, hex: string) {
    setDraft((d) => ({ ...(d ?? APP_THEME), [slot]: hex, source: 'custom' }));
    setHexText(hex);
  }

  async function fromLogo() {
    if (!logoUri) return;
    setExtracting(true);
    try {
      const picked = await themeFromLogo(logoUri);
      setDraft(picked);
      setOpen(null);
    } catch (e) {
      notify.error('Could not read the logo', getErrorMessage(e));
    } finally {
      setExtracting(false);
    }
  }

  async function save() {
    try {
      await actions.updateCollege.mutateAsync({ id: college.id, changes: { theme: draft } });
      notify.success(
        'Theme saved',
        draft ? 'Students now see your colors.' : 'Your page uses CollApp colors again.',
      );
      router.back();
    } catch (e) {
      notify.error('Could not save the theme', getErrorMessage(e));
    }
  }

  return (
    <FormScreen
      underHeader
      footer={
        <StickyActionBar>
          <View style={styles.flex}>
            <Button
              label="Save theme"
              onPress={save}
              loading={actions.updateCollege.isPending}
              disabled={!dirty}
            />
          </View>
        </StickyActionBar>
      }>
      <Stack.Screen options={{ title: 'Page theme' }} />
      <PageHeading
        title="Your page colors"
        subtitle="Students see these on your college page. They start from your logo; change any of them."
      />

      <BrandTheme brand={draft}>
        <ThemePreview college={college} chosen={shown.primary} />
      </BrandTheme>

      <Text style={styles.status}>
        {!draft
          ? 'Using CollApp colors'
          : draft.source === 'custom'
            ? 'Custom colors'
            : 'Colors from your logo'}
      </Text>

      <View>
        {SLOTS.map(({ key, label, use }) => {
          const expanded = open === key;
          return (
            <View key={key} style={styles.slot}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={`${label} color ${shown[key]}. ${use}`}
                onPress={() => toggle(key)}
                style={({ pressed }) => [styles.slotRow, pressed && styles.pressed]}>
                <View style={[styles.chip, { backgroundColor: shown[key] }]} />
                <View style={styles.flex}>
                  <Text style={styles.slotLabel}>{label}</Text>
                  <Text style={styles.slotUse}>{use}</Text>
                </View>
                <Text style={styles.hex}>{shown[key]}</Text>
                <Icon
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>

              {expanded ? (
                <View style={styles.editor}>
                  <TextField
                    label="Color code"
                    value={hexText}
                    onChangeText={(text) => {
                      setHexText(text);
                      setHexInvalid(false);
                      // Apply full codes as typed; short ones (#ABC) once typing stops.
                      if (/^#?[0-9a-f]{6}$/i.test(text.trim())) choose(key, normalizeHex(text)!);
                    }}
                    onBlur={() => {
                      const hex = normalizeHex(hexText);
                      if (hex) choose(key, hex);
                      else setHexInvalid(Boolean(hexText.trim()));
                    }}
                    error={hexInvalid ? 'Use a color code like #1A4D8F' : undefined}
                    placeholder="#1A4D8F"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={7}
                  />
                  {palette.length ? (
                    <SwatchRow
                      title="From your logo"
                      colors={palette}
                      selected={shown[key]}
                      onPick={(hex) => choose(key, hex)}
                    />
                  ) : null}
                  <SwatchRow
                    title="Lighter to darker"
                    colors={shadesOf(shown[key])}
                    selected={shown[key]}
                    onPick={(hex) => choose(key, hex)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          label="Use colors from logo"
          onPress={fromLogo}
          loading={extracting}
          disabled={!logoUri}
        />
        {!logoUri ? (
          <Text style={styles.hint}>Upload a logo on the Institution tab to use its colors.</Text>
        ) : null}
        {draft ? (
          <Button variant="link" label="Reset to CollApp colors" onPress={() => setDraft(null)} />
        ) : null}
      </View>
    </FormScreen>
  );
}

/** A row of colour choices; the current one is ringed. */
function SwatchRow({
  title,
  colors: options,
  selected,
  onPick,
}: {
  title: string;
  colors: string[];
  selected: string;
  onPick: (hex: string) => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.swatchGroup}>
      <Text style={styles.swatchTitle}>{title}</Text>
      <View style={styles.swatches}>
        {options.map((hex) => {
          const active = hex.toUpperCase() === selected.toUpperCase();
          return (
            <Pressable
              key={hex}
              accessibilityRole="button"
              accessibilityLabel={`Use ${hex}`}
              accessibilityState={{ selected: active }}
              onPress={() => onPick(hex)}
              hitSlop={4}
              style={[styles.swatchRing, active && styles.swatchRingActive]}>
              <View style={[styles.swatch, { backgroundColor: hex }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * A miniature of the college page in the chosen colours, drawn with the same
 * theme the real page uses (including readability adjustments).
 */
function ThemePreview({ college, chosen }: { college: RepCollege; chosen: string }) {
  const { colors, brand, isDark } = useTheme();
  const styles = createStyles(colors);
  const adjusted = colors.primary.toUpperCase() !== chosen.toUpperCase();

  return (
    <View accessible accessibilityLabel="Preview of your college page" style={styles.preview}>
      <View style={[styles.previewHead, { backgroundColor: colors.primary }]}>
        <CollegeLogo name={college.name} logoPath={college.logo_path} size={40} />
        <View style={styles.flex}>
          <Text style={[styles.previewName, { color: colors.onPrimary }]} numberOfLines={2}>
            {college.name}
          </Text>
          <Text style={[styles.previewPlace, { color: colors.onPrimary }]} numberOfLines={1}>
            {[college.city, college.province].filter(Boolean).join(', ') || 'Your campus'}
          </Text>
        </View>
        {brand ? (
          <View style={styles.previewStripe}>
            <View style={[styles.stripeMain, { backgroundColor: brand.stripe[0] }]} />
            <View style={[styles.stripeEnd, { backgroundColor: brand.stripe[1] }]} />
          </View>
        ) : null}
      </View>
      <View style={styles.previewBody}>
        <View style={styles.previewTabs}>
          <Text style={[styles.previewTab, styles.previewTabActive]}>About</Text>
          <Text style={styles.previewTab}>Programs</Text>
          <Text style={styles.previewTab}>Requirements</Text>
        </View>
        <View style={styles.previewFact}>
          <Icon name="calendar" size={14} color={brand?.accent ?? colors.textMuted} />
          <Text style={styles.previewFactText}>Deadline in 12 days</Text>
        </View>
        <View style={styles.previewButton}>
          <Text style={styles.previewButtonText}>Apply now</Text>
        </View>
      </View>
      {adjusted ? (
        <Text style={styles.previewNote}>
          The primary is shown a little {isDark ? 'lighter' : 'darker'} here so text on it stays
          readable.
        </Text>
      ) : null}
    </View>
  );
}
