import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

/** One 1.5pt line set: the Figma "Editorial Teal" glyphs plus Lucide-style fills for the gaps. */
const ICONS = {
  'add-circle': require('@/assets/images/editorial/add-circle.svg'),
  alarm: require('@/assets/images/editorial/alarm.svg'),
  'alert-circle': require('@/assets/images/editorial/alert-circle.svg'),
  'arrow-up': require('@/assets/images/editorial/arrow-up.svg'),
  'bar-chart': require('@/assets/images/editorial/bar-chart.svg'),
  book: require('@/assets/images/editorial/book.svg'),
  bookmark: require('@/assets/images/editorial/bookmark.svg'),
  'bookmark-filled': require('@/assets/images/editorial/bookmark-filled.svg'),
  broadcast: require('@/assets/images/editorial/broadcast.svg'),
  calendar: require('@/assets/images/editorial/calendar.svg'),
  cash: require('@/assets/images/editorial/cash.svg'),
  'chatbubble-ellipses': require('@/assets/images/editorial/chatbubble-ellipses.svg'),
  chatbubbles: require('@/assets/images/editorial/chatbubbles.svg'),
  'checkbox-filled': require('@/assets/images/editorial/checkbox-filled.svg'),
  checkmark: require('@/assets/images/editorial/checkmark.svg'),
  'checkmark-circle': require('@/assets/images/editorial/checkmark-circle.svg'),
  'checkmark-circle-filled': require('@/assets/images/editorial/checkmark-circle-filled.svg'),
  'checkmark-done': require('@/assets/images/editorial/checkmark-done.svg'),
  'chevron-back': require('@/assets/images/editorial/chevron-back.svg'),
  'chevron-down': require('@/assets/images/editorial/chevron-down.svg'),
  'chevron-forward': require('@/assets/images/editorial/chevron-forward.svg'),
  'chevron-up': require('@/assets/images/editorial/chevron-up.svg'),
  close: require('@/assets/images/editorial/close.svg'),
  'close-circle': require('@/assets/images/editorial/close-circle.svg'),
  'close-circle-filled': require('@/assets/images/editorial/close-circle-filled.svg'),
  'cloud-offline': require('@/assets/images/editorial/cloud-offline.svg'),
  'cloud-upload': require('@/assets/images/editorial/cloud-upload.svg'),
  college: require('@/assets/images/editorial/college.svg'),
  construct: require('@/assets/images/editorial/construct.svg'),
  create: require('@/assets/images/editorial/create.svg'),
  document: require('@/assets/images/editorial/document.svg'),
  'document-attach': require('@/assets/images/editorial/document-attach.svg'),
  'document-text': require('@/assets/images/editorial/document-text.svg'),
  download: require('@/assets/images/editorial/download.svg'),
  ellipse: require('@/assets/images/editorial/ellipse.svg'),
  eye: require('@/assets/images/editorial/eye.svg'),
  'eye-off': require('@/assets/images/editorial/eye-off.svg'),
  filter: require('@/assets/images/editorial/filter.svg'),
  'finger-print': require('@/assets/images/editorial/finger-print.svg'),
  globe: require('@/assets/images/editorial/globe.svg'),
  grid: require('@/assets/images/editorial/grid.svg'),
  home: require('@/assets/images/editorial/home.svg'),
  lock: require('@/assets/images/editorial/lock.svg'),
  'logo-google': require('@/assets/images/editorial/logo-google.svg'),
  megaphone: require('@/assets/images/editorial/megaphone.svg'),
  notifications: require('@/assets/images/editorial/notifications.svg'),
  options: require('@/assets/images/editorial/options.svg'),
  people: require('@/assets/images/editorial/people.svg'),
  person: require('@/assets/images/editorial/person.svg'),
  'person-add': require('@/assets/images/editorial/person-add.svg'),
  'person-circle': require('@/assets/images/editorial/person-circle.svg'),
  'radio-button-off': require('@/assets/images/editorial/radio-button-off.svg'),
  'radio-button-on': require('@/assets/images/editorial/radio-button-on.svg'),
  refresh: require('@/assets/images/editorial/refresh.svg'),
  ribbon: require('@/assets/images/editorial/ribbon.svg'),
  school: require('@/assets/images/editorial/school.svg'),
  search: require('@/assets/images/editorial/search.svg'),
  shield: require('@/assets/images/editorial/shield.svg'),
  'shield-checkmark': require('@/assets/images/editorial/shield-checkmark.svg'),
  'sign-out': require('@/assets/images/editorial/sign-out.svg'),
  sparkles: require('@/assets/images/editorial/sparkles.svg'),
  square: require('@/assets/images/editorial/square.svg'),
  'status-accepted': require('@/assets/images/editorial/status-accepted.svg'),
  'status-action-required': require('@/assets/images/editorial/status-action-required.svg'),
  'status-draft': require('@/assets/images/editorial/status-draft.svg'),
  'status-rejected': require('@/assets/images/editorial/status-rejected.svg'),
  'status-submitted': require('@/assets/images/editorial/status-submitted.svg'),
  'status-under-review': require('@/assets/images/editorial/status-under-review.svg'),
  trash: require('@/assets/images/editorial/trash.svg'),
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  style?: StyleProp<ImageStyle>;
};

/** Decorative glyph; the control around it carries the accessibility label. */
export function Icon({ name, size = 20, color, style }: IconProps) {
  return (
    <Image
      source={ICONS[name]}
      style={[{ width: size, height: size }, style]}
      tintColor={color}
      contentFit="contain"
      accessible={false}
    />
  );
}
