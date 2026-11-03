import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';
import { getTagEmoji } from '@/utils/tag-emoji';

// A tag pill: "cafe", "skiers", "remote work".
// Pale blue field, dark blue text, fully round. Use this instead of building
// your own pill -- the two blues have to be a matching pair or the text isn't
// readable, and this is the only place that pairing is written down.
//
//   <Tag label="skiers" />

type TagProps = {
  label: string;
  size?: 'small' | 'medium'; // small is for inside cards, medium for full pages
  showEmoji?: boolean;
};

export function Tag({ label, size = 'medium', showEmoji = true }: TagProps) {
  // Empty string when we don't have an emoji for this tag, so nothing breaks.
  const emoji = showEmoji ? getTagEmoji(label) : '';

  return (
    <View style={[styles.tag, size === 'small' && styles.tagSmall]}>
      <Text style={[styles.text, size === 'small' && styles.textSmall]}>
        {emoji !== '' ? emoji + ' ' : ''}
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: colors.tagFill,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignSelf: 'flex-start', // stops the pill stretching to fill its row
  },
  tagSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '500',
    fontSize: type.label,
    color: colors.tagText,
  },
  textSmall: {
    fontSize: type.tiny,
  },
});
