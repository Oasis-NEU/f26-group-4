// Turns a tag or place type into an emoji, so filters and tags read as
// "☕ cafe" and "🎿 skiers" instead of just the words.
//
// Ruby: I looked for a library for this and there isn't a good one. The ones
// that exist (like node-emoji) turn ":coffee:" into ☕ -- they translate emoji
// NAMES. What we need is a judgement call about which emoji suits "remote
// work", and no library can make that for us. So it's a hand-written list,
// same as country-flags.ts.
//
// Adding one is a one-line change. If a tag isn't in here you get an empty
// string, which just means no emoji -- nothing breaks.

const emojiByTag: Record<string, string> = {
  // place types
  cafe: '☕',
  restaurant: '🍝',
  bar: '🍸',
  hotel: '🛏️',
  museum: '🏛️',
  park: '🌳',
  beach: '🏖️',
  garden: '🌿',
  viewpoint: '🔭',
  excursion: '🥾',
  shop: '🛍️',

  // suited-for tags
  solo: '🧍',
  couples: '💞',
  families: '👨‍👩‍👧',
  friends: '👯',
  skiers: '🎿',
  hikers: '🥾',
  'remote work': '💻',
  foodies: '🍽️',
  nightlife: '🌙',
  budget: '💸',
  luxury: '✨',
  'pet friendly': '🐕',

  // filter rows
  All: '🌍',
  Coffee: '☕',
  Slopes: '🎿',
  Hikes: '🥾',
};

export function getTagEmoji(tag: string): string {
  // Tags come in with different capitalisation depending on where they're from,
  // so try the tag as-is first, then all lowercase.
  if (emojiByTag[tag] !== undefined) {
    return emojiByTag[tag];
  }

  if (emojiByTag[tag.toLowerCase()] !== undefined) {
    return emojiByTag[tag.toLowerCase()];
  }

  return '';
}
