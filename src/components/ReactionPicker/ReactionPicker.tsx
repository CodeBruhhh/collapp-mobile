import { Modal, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { REACTIONS, type Reaction } from '@/features/feed/reactions';
import { useTheme } from '@/hooks/useTheme';

import { createStyles, PICKER_HEIGHT } from './ReactionPicker.styles';

type ReactionPickerProps = {
  /** Window position of the Like button's top edge; the picker is open while this is set. */
  anchorY: number | null;
  selected: Reaction | null;
  onSelect: (reaction: Reaction) => void;
  onClose: () => void;
};

const GAP = 8;
const MIN_TOP = 48;

/** The row of reactions that opens above Like; tapping elsewhere closes it. */
export function ReactionPicker({ anchorY, selected, onSelect, onClose }: ReactionPickerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const top = anchorY === null ? 0 : Math.max(MIN_TOP, anchorY - PICKER_HEIGHT - GAP);

  return (
    <Modal visible={anchorY !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close reactions"
        onPress={onClose}
        style={styles.backdrop}
      />
      <View accessibilityRole="menu" style={[styles.picker, { top }]}>
        {REACTIONS.map((r) => (
          <Pressable
            key={r.key}
            accessibilityRole="menuitem"
            accessibilityLabel={r.label}
            accessibilityState={{ selected: r.key === selected }}
            onPress={() => onSelect(r.key)}
            style={[styles.option, r.key === selected && styles.optionSelected]}>
            <Icon name={r.icon} size={24} color={colors.primary} />
            <Text style={styles.label}>{r.label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
