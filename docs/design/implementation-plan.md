# Implementation plan

How to get from today's app to the reference. Each step is its own PR, so it's easy to review and easy to revert. Steps 1–4 restyle the whole app at once through tokens and primitives. Steps 5 and 6 go screen by screen. Nothing here has been started.

## Decide first

Some of these change more than looks, so the team should agree on them before step 1.

| # | Decision | Recommendation | Why it matters |
| - | -------- | -------------- | -------------- |
| 1 | Warm canvas `#FBF9F5` instead of white | Adopt | The most visible difference. Every screen's background changes |
| 2 | White pills and search fields with a hairline, instead of grey fills. This replaces theme.ts's "no borders" rule with "hairlines on white controls, still no shadows" | Adopt | Restyles `FilterPill`, `SearchField`, `RatingBadge`, `OptionPills` and `ViewToggle` |
| 3 | Page margin 16 → 18 | Adopt | Small, but it's what all three screens measure. Touches every screen's padding |
| 4 | Load the fonts: Plus Jakarta Sans 700 and 800, Instrument Sans 400, 500, 600 and 700 | Adopt | The biggest single step toward the look. Needs the root layout |
| 5 | Tab bar: copy only the look, or also the reference's tabs (Feed, Search, Map, Profile, Saved)? | Look only, for now | Which tabs exist is a navigation question ([pages/README.md](../pages/README.md#tab-bar)), not a style one |
| 6 | Feed header: greeting, headline and category pills (the reference) instead of today's search bar and ▽ filter sheet. Where does "+" (Upload) go? | Team call | It changes what the Feed does, not just how it looks. Search becomes an icon |
| 7 | Avatar colours: the four brand tints instead of a hue per person | Tints | Matches the reference, and keeps colour meaning identity |
| 8 | Light only: set `userInterfaceStyle` in `app.json` to `"light"` until there's a dark palette | Light | The palette is light only, but `"automatic"` lets the system go dark, so native pieces (status bar, keyboard, alerts) can turn dark around light screens |

## 1. Tokens (`src/theme.ts`)

Change the values to the reference, and add the new roles. Here are the target values, with names following theme.ts's existing style:

```ts
// colors: changed
background: '#FBF9F5',
line: '#E7E5E0',
ratingAverageFill: '#FFFFFF', // the badge now also gets a 1px `line` border
starAverage: '#A3A097',
// colors: new
textOnPhotoMuted: 'rgba(255,255,255,0.85)',
chipOnWash: 'rgba(255,255,255,0.9)',

export const avatarTints = ['#FFE3EA', '#FDF1CC', '#EEF8D2', '#E4E8FF']; // rose, butter, lime, ice

export const gradients = [
  ['#FBE09D', '#FBB5C6'], // butter -> rose
  ['#FBB7C7', '#FCE09C'], // rose -> butter
  ['#FBC3CF', '#E8E9FD'], // rose -> ice
];

export const radius = { card: 22, collection: 32, image: 12, rating: 8, toast: 12, round: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, page: 18, xl: 24, section: 28 };

export const type = {
  screenTitle: 32, collectionTitle: 24, title: 22, photoTitle: 18, heading: 16,
  button: 16, body: 15, label: 14, small: 13, tiny: 11, micro: 10,
};
export const lineHeight = {
  screenTitle: 34, collectionTitle: 28, title: 25, photoTitle: 22, heading: 20,
  button: 20, body: 22, label: 18, small: 16, tiny: 13, micro: 12,
};
export const letterSpacing = { screenTitle: -0.6, collectionTitle: -0.3, title: -0.4 };
```

- Rewrite theme.ts's header comment to describe hairlines (see [tokens.md](tokens.md#borders-and-elevation)), and fix the gradient comment. The washes are opaque now.
- Screens that don't set a background show the navigator's default white. Set the canvas once for every navigator, through the React Navigation theme that Expo Router uses. Check the Expo Router docs for SDK 58 before writing it.
- Swap `spacing.lg` for `spacing.page` where it's used as the page margin.
- **Check:** open every tab and a pushed screen. Nothing behind the content should be pure white except surfaces, and the collection cards should show the new washes.

## 2. Fonts (`src/app/_layout.tsx`, Henry's file)

- Install the two Google Font packages with `npx expo install` (`expo-font` is already a dependency), and load the weights from decision 4 in the root layout, keeping the splash screen up until they're ready. Read the expo-font page for SDK 58 first: AGENTS.md explains why.
- Add the `fonts` export that theme.ts describes, mapping each role in the [type scale](tokens.md#scale) to a family. Each weight is its own family name, so set `fontFamily` instead of `fontWeight`.
- Step 3 swaps the primitives over. Screens follow in steps 5 and 6.

## 3. Primitives (`src/components/ui/`)

Restyle the existing ones first, since everything already uses them, then add the new ones. Export each from `ui/index.ts`. [components.md](components.md) has every spec.

1. Restyle `FilterPill`, `Tag`, `RatingBadge`, `CornerRating`, `SearchField`, `CollectionTile` and `Button`.
2. Restyle `OptionPills` (`src/components/option-pills.tsx`) and `ViewToggle` to match `FilterPill`: white with a hairline when off, ink when on.
3. Add `IconButton`, `OverlayPill`, `Chip`, `AvatarStack`, `Switch` and `SectionHeading`.
4. Add `Toast`, with its provider in the root layout (step 2's file again).

## 4. Tab bar (`src/app/(tabs)/_layout.tsx`)

Outline SF Symbols when inactive and `.fill` when active, ink and muted tints, a white bar with no border, and 11pt labels ([components.md](components.md#tab-bar)). The tab list stays as it is unless the team decides otherwise (decision 5).

## 5. The three reference screens

One PR each, in this order. Each follows [screens.md](screens.md).

1. **Saved:** add the search field, and restyle the rows in "Saved places".
2. **Place details:** the photo, overlay icons, Verified chip, avatar stack, link icons, and the Save to collection row.
3. **Feed:** the post layout first. The header waits on decision 6.

## 6. Everything else

- The other screens, starting from [screens.md](screens.md#screens-without-a-reference).
- Replace the hard-coded colours: 83 hex values in 32 files outside theme.ts, mostly the edit-profile panels, Upload and Settings. Map each to the nearest token. If none fits, that's a sign the screen strays from the style, so ask before adding a token.

## Checking each step

- Run `npx expo lint` and `npx tsc --noEmit`.
- Screenshot the changed screens at 390pt wide (an iPhone 16 simulator, or the web build at 390px), and put each next to its crop in [reference/](reference/).
- Look at the four things that make it this style: the canvas colour, the 18pt margins, the corner radii, and the type sizes.
- After step 1 or 3, look at every screen. A token or primitive change reaches screens nobody was working on.
