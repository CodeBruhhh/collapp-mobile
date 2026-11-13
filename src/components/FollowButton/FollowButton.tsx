import { Pressable, Text } from 'react-native';

import { Icon } from '@/components/Icon';
import { useFollowedColleges, useToggleFollow } from '@/features/colleges/hooks';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './FollowButton.styles';

type FollowButtonProps = {
  collegeId: string;
  /** The university's name, so screen readers know what is being followed. */
  collegeName?: string;
  /** The outlined version, for sitting on the teal masthead. */
  onAccent?: boolean;
};

/** Follow or unfollow a university: its posts then appear in the student's feed. */
export function FollowButton({ collegeId, collegeName, onAccent }: FollowButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const followed = useFollowedColleges();
  const toggle = useToggleFollow();
  const following = followed.data?.includes(collegeId) ?? false;

  async function handlePress() {
    try {
      await toggle.mutateAsync({ collegeId, following: !following });
    } catch (e) {
      notify.error('Could not update', getErrorMessage(e));
    }
  }

  const label = following ? 'Following' : 'Follow';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={collegeName ? `${label} ${collegeName}` : label}
      accessibilityState={{ selected: following, busy: toggle.isPending }}
      disabled={toggle.isPending}
      hitSlop={onAccent ? 4 : undefined}
      onPress={handlePress}
      style={[
        onAccent ? styles.accent : styles.link,
        onAccent && following && styles.accentFollowing,
      ]}>
      {onAccent && following ? <Icon name="checkmark" size={14} color={colors.primary} /> : null}
      <Text
        style={[
          styles.label,
          !onAccent && following && styles.labelMuted,
          onAccent && (following ? styles.labelFollowing : styles.labelOnAccent),
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}
