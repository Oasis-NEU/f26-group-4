import Feather from '@expo/vector-icons/Feather';

import { colors, icon } from '@/theme';

// Every icon in the app comes from here.
//
// We use Feather because its icons are drawn with a 2px rounded stroke, which
// is exactly what the design system asks for -- so they match without us
// having to fix anything. Don't import a different icon set: Material and
// FontAwesome are filled-in and much heavier, and mixing them looks obviously
// wrong next to these.
//
//   <Icon name="bookmark" />
//   <Icon name="heart" color={colors.roseText} size={18} />
//
// The names below are OUR names, not Feather's, so that if we ever switch icon
// sets we change this one file and nothing else.

type IconName =
  | 'back'
  | 'share'
  | 'bookmark'
  | 'add'
  | 'directions'
  | 'website'
  | 'search'
  | 'home'
  | 'map'
  | 'profile'
  | 'more'
  | 'settings'
  | 'heart'
  | 'comment'
  | 'filter'
  | 'close'
  | 'check';

// Our name on the left, Feather's name on the right.
const FEATHER_NAMES = {
  back: 'chevron-left',
  share: 'share',
  bookmark: 'bookmark',
  add: 'plus',
  directions: 'navigation',
  website: 'globe',
  search: 'search',
  home: 'home',
  map: 'map',
  profile: 'user',
  more: 'more-horizontal',
  settings: 'settings',
  heart: 'heart',
  comment: 'message-circle',
  filter: 'sliders',
  close: 'x',
  check: 'check',
} as const;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = icon.size, color = colors.text }: IconProps) {
  return <Feather name={FEATHER_NAMES[name]} size={size} color={color} />;
}
