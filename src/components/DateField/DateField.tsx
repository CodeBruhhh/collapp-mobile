import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './DateField.styles';

type DateFieldProps = {
  label: string;
  /** ISO date `YYYY-MM-DD`, or '' when empty. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Earliest / latest selectable dates (ISO). */
  min?: string;
  max?: string;
  /** Month the calendar opens on when no date is set (ISO). */
  initialMonth?: string;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Typed digits -> `YYYY-MM-DD`, inserting the dashes as you type. */
function formatTyped(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function parseIso(iso: string | undefined): { y: number; m: number; d: number } | null {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

/**
 * Date input that can be typed (digits only, dashes added automatically) or
 * picked from a calendar with quick year selection (SDD screen 5).
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  min,
  max,
  initialMonth,
}: DateFieldProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [picking, setPicking] = useState<'day' | 'year'>('day');
  const today = new Date();
  const start = parseIso(value) ??
    parseIso(initialMonth) ?? {
      y: today.getFullYear(),
      m: today.getMonth(),
      d: 1,
    };
  const [view, setView] = useState({ y: start.y, m: start.m });

  const minDate = parseIso(min);
  const maxDate = parseIso(max);
  const minYear = minDate?.y ?? today.getFullYear() - 100;
  const maxYear = maxDate?.y ?? today.getFullYear();
  const selected = parseIso(value);

  function openCalendar() {
    const s = parseIso(value) ?? parseIso(initialMonth) ?? start;
    setView({ y: s.y, m: s.m });
    setPicking('day');
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const date = new Date(v.y, v.m + delta, 1);
      return { y: date.getFullYear(), m: date.getMonth() };
    });
  }

  const outOfRange = (iso: string) => (min && iso < min) || (max && iso > max);
  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const monthTitle = new Date(view.y, view.m, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.focused, error ? styles.errorBorder : null]}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(formatTyped(text))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={10}
          accessibilityLabel={label}
          accessibilityHint={error ?? 'Type the date or open the calendar'}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Choose ${label.toLowerCase()} from a calendar`}
          onPress={openCalendar}
          style={styles.iconButton}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessible={false}>
          <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
            {/* Inner press handler keeps taps on the sheet from closing it. */}
            <Pressable style={styles.sheet} onPress={() => {}} accessible={false}>
              <View style={styles.header}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={picking === 'day' ? 'Choose a year' : 'Back to days'}
                  onPress={() => setPicking((p) => (p === 'day' ? 'year' : 'day'))}
                  style={styles.title}>
                  <Text style={styles.titleText}>{monthTitle}</Text>
                  <Ionicons
                    name={picking === 'day' ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={colors.text}
                  />
                </Pressable>
                {picking === 'day' ? (
                  <View style={styles.nav}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                      onPress={() => shiftMonth(-1)}
                      style={styles.iconButton}>
                      <Ionicons name="chevron-back" size={20} color={colors.text} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                      onPress={() => shiftMonth(1)}
                      style={styles.iconButton}>
                      <Ionicons name="chevron-forward" size={20} color={colors.text} />
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {picking === 'year' ? (
                <FlatList
                  data={years}
                  keyExtractor={(y) => String(y)}
                  numColumns={4}
                  style={styles.years}
                  initialScrollIndex={Math.max(0, Math.floor(years.indexOf(view.y) / 4) * 1)}
                  getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
                  renderItem={({ item }) => {
                    const active = item === view.y;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setView((v) => ({ ...v, y: item }));
                          setPicking('day');
                        }}
                        style={[styles.year, active && styles.yearActive]}>
                        <Text style={[styles.yearText, active && styles.yearTextActive]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              ) : (
                <>
                  <View style={styles.week}>
                    {WEEKDAYS.map((d, i) => (
                      <Text key={i} style={styles.weekday}>
                        {d}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.grid}>
                    {cells.map((day, i) => {
                      if (day === null) return <View key={`e${i}`} style={styles.cell} />;
                      const iso = toIso(view.y, view.m, day);
                      const disabled = Boolean(outOfRange(iso));
                      const active =
                        selected?.y === view.y && selected.m === view.m && selected.d === day;
                      return (
                        <Pressable
                          key={iso}
                          accessibilityRole="button"
                          accessibilityLabel={new Date(view.y, view.m, day).toDateString()}
                          accessibilityState={{ selected: active, disabled }}
                          disabled={disabled}
                          onPress={() => {
                            onChange(iso);
                            setOpen(false);
                          }}
                          style={styles.cell}>
                          <View style={[styles.day, active && styles.dayActive]}>
                            <Text
                              style={[
                                styles.dayText,
                                active && styles.dayTextActive,
                                disabled && styles.dayDisabled,
                              ]}>
                              {day}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}
