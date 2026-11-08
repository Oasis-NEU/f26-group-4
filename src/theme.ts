// The Oasis design system, written down in one place.
//
// This is "Option 01 - Full Deck" from the design options the team picked from.
// The rule for this direction is: COLOUR = IDENTITY. Collections and tags carry
// the colour, the rest of the interface stays black and white. There are no
// borders and no drop shadows anywhere -- things look separate because they are
// different colours, not because there's a line between them.
//
// How to use this file: import it and use these values instead of typing a hex
// code or a number straight into a StyleSheet. That way if the team decides the
// pink should be a bit darker, we change it HERE once, and every screen updates.
//
//   import { colors, radius, spacing, type } from '@/theme';
//   ...
//   title: { fontSize: type.title, color: colors.text },

// ---------------------------------------------------------------------------
// COLOURS
// ---------------------------------------------------------------------------

export const colors = {
  // --- The five brand colours ---
  // These are the "real" palette. They're for FILLS (backgrounds of tags,
  // collection cards, gradients). Most of them are too light to put text on.
  ink: '#0C0C0C', // near-black, our darkest
  rose: '#FC80A3', // the pink
  butter: '#FBD470', // the yellow
  periwinkle: '#5463FC', // the blue
  ice: '#E4E8FF', // the very pale blue

  // Tertiary. The team said keep it but use it sparingly.
  lime: '#DAFC70',

  // --- Darkened versions, for TEXT and ICONS only ---
  // The normal rose and periwinkle don't have enough contrast to be readable as
  // text. These are the same colours pushed darker so they pass accessibility.
  // Rule of thumb: colouring a word or an icon? use these. Filling a shape
  // behind something? use the ones above.
  roseText: '#D11A61',
  periwinkleText: '#3A48E8',

  // --- Surfaces (things we put other things on top of) ---
  background: '#FFFFFF', // the page itself
  card: '#FFFFFF', // cards sitting on the page
  fill: '#F3F3F5', // the light grey used for plain chips and search fields
  line: '#EEEEF1', // the only line in the whole system: under the tab bar

  // --- Text ---
  text: '#0C0C0C', // headings and body
  textMuted: '#6A6A6E', // the grey second line, like "Paris, France"
  textOnDark: '#FFFFFF', // text sitting on a black button
  link: '#3A48E8', // "Website" and "Directions"

  // --- Buttons floating on top of a photo ---
  // Slightly see-through white so you can tell there's a photo underneath.
  overlay: 'rgba(255,255,255,0.94)',
  overlayIcon: '#0C0C0C',
  // Darkens the bottom of a photo so white text stays readable on top of it.
  scrim: 'rgba(36,28,94,0.58)',

  // --- Specific jobs ---
  // The save/bookmark button turns yellow once a place is saved.
  saved: '#FBD470',
  savedIcon: '#0C0C0C',

  // Tag pills ("Cafe", "Skiers"). Pale blue field, dark blue text.
  tagFill: '#E4E8FF',
  tagText: '#3A48E8',

  // The secondary button -- "Remove", "Cancel", anything that isn't the main
  // action on the screen. Pale blue field, dark blue text, same pair as tags.
  secondaryFill: '#E4E8FF',
  secondaryText: '#3A48E8',

  // --- The three rating badges ---
  // These are NOT three copies of the same badge in different colours. Each one
  // is built differently on purpose, so you can tell them apart even in a
  // photo, at a glance, without reading the label:
  //   Average  - plain grey pill. The boring default.
  //   Friends  - WHITE with a pink outline. The outline is the only border in
  //              the whole app, which is exactly why it catches your eye.
  //   For you  - pale blue fill with blue text. No outline.
  ratingAverageFill: '#F3F3F5',
  ratingAverageText: '#0C0C0C',

  ratingFriendsFill: '#FFFFFF',
  ratingFriendsText: '#0C0C0C',
  ratingFriendsBorder: '#FC80A3', // the pink, at full strength

  ratingForYouFill: '#E4E8FF',
  ratingForYouText: '#3A48E8',

  // The small rating badge that sits in the corner of a photo or thumbnail.
  // Always white so it stays readable whatever the photo is, with a pink star.
  cornerBadgeFill: '#FFFFFF',
  cornerBadgeText: '#0C0C0C',
  cornerBadgeStar: '#D11A61',

  // Stars. Each of the three ratings gets its own colour so you can tell them
  // apart at a glance, and the star itself carries the colour -- the badge
  // behind it always stays white or pale.
  starAverage: '#8A8A8E', // grey  - everyone's rating
  starFriends: '#D11A61', // pink  - your friends' rating
  starForYou: '#3A48E8', // blue  - the app's guess for you
};

// The gradients used on collection cards. There are three so that a list of
// collections doesn't repeat itself -- cycle through them by index.
//
// NOTE: React Native can't do gradients on its own, it needs the
// `expo-linear-gradient` package. So these are stored as the two end colours
// plus the direction, which is the shape <LinearGradient /> wants.
// They all run left-to-right and they all sit on white, which is why the
// colours have an alpha (the ".62" etc) -- they're a wash, not a solid.
export const gradients = [
  ['rgba(252,128,163,0.62)', 'rgba(251,212,112,0.62)'], // rose -> butter
  ['rgba(84,99,252,0.38)', 'rgba(228,232,255,0.85)'], // periwinkle -> ice
  ['rgba(228,232,255,0.90)', 'rgba(252,128,163,0.50)'], // ice -> rose
];

// ---------------------------------------------------------------------------
// CORNER ROUNDING
// ---------------------------------------------------------------------------
// React Native wants plain numbers here, not "18px" and not "50%".
// 999 is the trick for "make it a full oval" -- any number bigger than half the
// height gives you a perfect round end, so 999 always works.

export const radius = {
  card: 18, // place cards, photos inside a card
  collection: 26, // collection tiles are rounder, so they feel softer
  image: 13, // small thumbnails
  rating: 13, // the little star badges
  round: 999, // EVERY button, pill, chip and search field
};

// ---------------------------------------------------------------------------
// SPACING
// ---------------------------------------------------------------------------
// Gaps and padding. Sticking to these few numbers is what makes screens look
// like they belong to the same app.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16, // the standard page margin -- the left and right edge of every screen
  xl: 24,
};

// ---------------------------------------------------------------------------
// TYPE
// ---------------------------------------------------------------------------

// THE FONTS ARE NOT LOADED, so there is no `fonts` export here on purpose.
//
// The design system picks Plus Jakarta Sans ExtraBold for headings, Instrument
// Sans for body text and DM Mono for small labels. None of them are in the app
// yet, because loading a font has to happen in src/app/_layout.tsx -- the root
// layout -- and that's Henry's file.
//
// Until that lands, use `fontWeight` and nothing else. A fontFamily naming a
// font that isn't registered falls back silently on iOS and can crash on
// Android, so DON'T add one "ready for later".
//
// What Henry needs to do, when the team agrees:
//
//   npx expo install @expo-google-fonts/plus-jakarta-sans \
//                    @expo-google-fonts/instrument-sans \
//                    @expo-google-fonts/dm-mono expo-font
//
//   // then in src/app/_layout.tsx:
//   const [fontsLoaded] = useFonts({
//     PlusJakartaSans_800ExtraBold,  // headings
//     InstrumentSans_400Regular,     // body
//     InstrumentSans_500Medium,
//     InstrumentSans_600SemiBold,
//     DMMono_500Medium,              // small labels
//   });
//   if (!fontsLoaded) return null;
//
// Once that's in, add a `fonts` export here and swap the fontWeights over.

// ---------------------------------------------------------------------------
// TYPE SIZES
// ---------------------------------------------------------------------------
// Named after what they're for rather than how big they are.
export const type = {
  screenTitle: 28, // "Saved", the big heading at the top of a tab
  title: 22, // a place name
  heading: 17, // "Reviews", "Best suited for"
  body: 15,
  label: 13, // tag pills, button text
  small: 12, // the grey second line
  tiny: 11, // distance badges, counts
};

// The ONE border in the whole design system: the pink outline on the friends
// rating badge. It lives here rather than being typed into the component, so
// that if we ever add a second outlined thing the two stay the same weight.
export const borderWidth = {
  ratingBadge: 1.5,
};

// ---------------------------------------------------------------------------
// ICONS
// ---------------------------------------------------------------------------
// Every icon is drawn with the same line thickness and rounded ends. This is
// part of the design system even though it isn't a colour or a size.

export const icon = {
  strokeWidth: 2,
  size: 22,
};
