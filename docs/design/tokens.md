# Tokens

The values behind the reference, measured from the images. Each table says how `src/theme.ts` compares today: ✓ means it already matches, → means it needs to change. Nothing here has been changed in the code yet. [implementation-plan.md](implementation-plan.md) says in what order to change it.

**How these were measured.** Sizes come from the screens board. Each phone there is 390px wide, the same as a 390pt iPhone, so 1px ≈ 1pt, and numbers are rounded to the nearest sensible point. The component sheet draws things 10–30% larger, so it's used for anatomy and colour, not size. Colours were sampled from the images. The boards are compressed WebP, which pulls small coloured text a few percent toward grey, so where a theme.ts colour is within that error it's kept rather than replaced by the sampled value.

## Colour

### Surfaces

| Role | Value | Where | theme.ts today |
| ---- | ----- | ----- | -------------- |
| Canvas | `#FBF9F5` | Behind every screen. A warm paper white, not pure white | `background: '#FFFFFF'` → change |
| Surface | `#FFFFFF` | Search field, unselected filter pills, rating badges, Verified chip, header buttons, greeting pill, tab bar | `card` ✓ |
| Hairline | `#E7E5E0`, 1px | The outline of a white control on the canvas (see [Borders](#borders-and-elevation)) | `line: '#EEEEF1'` → change to the warmer value. It now outlines controls, not just the tab bar |
| Grey fill | (none) | Not used in the reference. Pills and the search field are white with a hairline instead | `fill: '#F3F3F5'`. Keep it for image placeholders and skeletons, and stop using it for pills and fields |

### Ink and text

| Role | Value | Where | theme.ts today |
| ---- | ----- | ----- | -------------- |
| Ink | `#0C0C0C` | Headings, body, icons, primary button, selected pill, active tab, switch track, toast | `ink`, `text` ✓ |
| Muted | `#6A6A6E` | Location lines, "7 friends saved this", placeholders, inactive tabs, counts, "See more", rating labels | `textMuted` ✓. The reference measures ≈ `#75736F`, which looks the same, but `#6A6A6E` keeps 5.1:1 contrast on the canvas where the measured grey only reaches 4.5:1 |
| On dark | `#FFFFFF` | Text and icons on ink | `textOnDark` ✓ |
| On photo | `#FFFFFF`, second line at 85% | Titles and meta lines over a scrim | → add `textOnPhotoMuted: 'rgba(255,255,255,0.85)'` |
| Link | `#3A48E8` | "Website", "Directions" | `link` ✓ |

Body paragraphs use ink at full strength. They only look softer than headings because they're a lighter weight.

### Brand

| Name | Hex | In the reference | theme.ts today |
| ---- | --- | ---------------- | -------------- |
| Rose | `#FC80A3` | Friends rating outline. The rose end of collection washes | ✓ |
| Rose text | `#D11A61` | Every pink star: friends rating, corner rating on photos, post rating | `roseText`, `starFriends`, `cornerBadgeStar` ✓ |
| Butter | `#FBD470` | The butter end of collection washes | ✓ (also `saved`, the filled bookmark. That state isn't drawn on the boards; keep it) |
| Periwinkle | `#5463FC` | Not used at full strength | ✓ |
| Periwinkle text | `#3A48E8` | Text and icons on ice, links, the For you rating | `periwinkleText` ✓ |
| Ice | `#E4E8FF` | Tags, secondary button, + circle, For you badge, "+4" avatar, greeting avatar | `ice`, `tagFill`, `secondaryFill`, `ratingForYouFill` ✓ |
| Lime | `#DAFC70` | Only as a pale avatar tint | ✓ (tertiary) |

### Collection washes

Collection cards get a soft horizontal wash, left to right, from these opaque stops. Cycle by index so neighbouring cards differ.

| # | Left | Right | Example in the reference |
| - | ---- | ----- | ------------------------ |
| 1 | `#FBE09D` butter | `#FBB5C6` rose | Mountains in Italy |
| 2 | `#FBB7C7` rose | `#FCE09C` butter | Coffee in Paris |
| 3 | `#FBC3CF` rose | `#E8E9FD` ice | Lakes in Switzerland |

theme.ts today: `gradients` are rose → butter, periwinkle → ice and ice → rose, written as see-through colours over white. → Change to the three pairs above, as opaque hex. See-through colours would pick up the warm canvas, there's no periwinkle → ice card in the reference, and the third runs the other way.

### Avatar tints

Initials avatars in the friend stack sit on pale brand tints, in this order: `#FFE3EA` rose, `#FDF1CC` butter, `#EEF8D2` lime, `#E4E8FF` ice. The initials are ink. theme.ts has none of these. → Add `avatarTints`. `src/components/avatar.tsx` currently makes its own soft colour from a hue, see [components.md](components.md#avatar-stack).

### Ratings

| Badge | Fill | Outline | Star | Number | Label |
| ----- | ---- | ------- | ---- | ------ | ----- |
| Average | Surface | Hairline | `#A3A097`, warm grey | Ink | Muted |
| Friends | Surface | Rose, 1.5pt | Rose text | Ink | Muted |
| For you | Ice | None | Periwinkle text | Periwinkle text | Periwinkle text at 70% |

theme.ts today: `ratingAverageFill: '#F3F3F5'` → surface plus a hairline. `starAverage: '#8A8A8E'` → `#A3A097`, which is lighter and warmer. Everything else ✓.

### On photos

| Role | Value | Where | theme.ts today |
| ---- | ----- | ----- | -------------- |
| Overlay | `rgba(255,255,255,0.94)` | Back pill, icon circles, distance pill, user chip and corner rating on photos | `overlay` ✓ |
| Scrim | transparent → `rgba(36,28,94,0.58)` over the bottom ~45% of the photo | Under white text on a photo. It tints the photo indigo, not grey | `scrim` ✓. Use it as the end stop of a `LinearGradient` |
| Chip on a wash | `rgba(255,255,255,0.9)` | "Auto-sorted" and "Shared" on collection cards | → add |

### Feedback

| Role | Value | theme.ts today |
| ---- | ----- | -------------- |
| Toast | Ink fill, white text, icon in white at 70% | → add (or reuse `ink`) |
| Switch, on | Ink track, white thumb | → add. Switches currently use the platform default, green on iOS |

## Type

### Families

| Family | Weights | Used for |
| ------ | ------- | -------- |
| Plus Jakarta Sans | ExtraBold 800, Bold 700 | Screen titles, the Feed headline, place names (800). Section headings and titles on photos (700) |
| Instrument Sans | Regular 400, Medium 500, SemiBold 600, Bold 700 | Everything else: body, pills, tags, buttons, meta lines, usernames, rating numbers. Collection names are Medium 500 on purpose |
| DM Mono | | Only the boards' annotations. The app doesn't need it |

These are the families theme.ts already names, and the reference is consistent with them. None of them are loaded yet ([implementation-plan.md](implementation-plan.md), step 2). Until they are, use `fontWeight` with the system font and leave `fontFamily` unset, as theme.ts explains.

### Scale

| Role | Size / line height | Weight | Letter-spacing | Example | theme.ts `type` today |
| ---- | ------------------ | ------ | -------------- | ------- | --------------------- |
| Screen title | 32 / 34 | 800 | −0.6 | "Saved", "Ready to escape the ordinary?" | `screenTitle: 28` → 32 |
| Collection title | 24 / 28 | 500 | −0.3 | "🏔️ Mountains in Italy" | hard-coded 21 in `collection-tile.tsx` → add `collectionTitle: 24` |
| Title | 22 / 25 | 800 | −0.4 | "Mountain Peak Café" | `title: 22` ✓ |
| Photo title | 18 / 22 | 700 | 0 | "Monte Pore, Dolomites" in white on a photo | → add `photoTitle: 18` |
| Heading | 16 / 20 | 700 | 0 | "Best suited for", "Summary", "Posts", "Collections" | `heading: 17` → 16 |
| Button | 16 / 20 | 600 | 0 | "Save to collection", "Directions" | → add `button: 16` (buttons use `label`, 13, today) |
| Body | 15 / 22 | 400 (600 for "Hey, Ruby") | 0 | Summary paragraph, captions, search text | `body: 15` ✓ |
| Label | 14 / 18 (20 for meta lines) | 500 (400 for meta, 700 for rating numbers) | 0 | Pills, tags, links, location line, "7 friends saved this", "See more", overlay pills | `label: 13` → 14 |
| Small | 13 / 16 | 600 (400 for counts) | 0 | Chips on cards, user chip, number on a corner rating, action-row counts, "Summarised from reviews" (italic) | `small: 12` → 13 |
| Tiny | 11 / 13 | 500 | 0 | Tab labels, Verified chip | `tiny: 11` ✓ |
| Micro | 10 / 12 | 500 | 0 | Rating badge labels ("Avg", "Friends", "You") | hard-coded 10 in `rating-badge.tsx` → add `micro: 10` |

theme.ts has no line heights. → Add a `lineHeight` table keyed the same way.

### Type rules

- Sentence case everywhere, including buttons and headings ("Save to collection", "Best suited for"). No all-caps in the app.
- Negative letter-spacing only at 22pt and above. Everything smaller is 0.
- Headings sit tight (line height ≈ 1.05–1.15). Body is open (15/22).
- In ratings the number is bold and the rest is muted: a pink star, then "5 / 5" in grey.
- Captions stop at 2 lines with an ellipsis, followed by a grey "See more".

## Spacing and layout

A 4pt grid with two named exceptions, the page margin and section gaps.

| What | Value | Measured | theme.ts today |
| ---- | ----- | -------- | -------------- |
| Page margin, left and right | 18 | 18 on all three screens | `spacing.lg: 16` is the margin today → add `spacing.page: 18` |
| Between page sections | 24–28 | links → "Best suited for" 28, tags → "Summary" 26, pills → "Collections" 24 | → add `spacing.section: 28` |
| Section heading → its content | 12 | | `spacing.md` ✓ |
| Between stacked cards | 12 | 11–12 | `spacing.md` ✓ |
| Between pills or tags in a row | 6–8 | 4–8 | `spacing.sm` ✓ |
| Inside cards | 16 | Collection card text inset 15–16 | `spacing.lg` ✓ |
| Title block → meta line | 12 | | `spacing.md` ✓ |

### Control sizes

| Control | Height |
| ------- | ------ |
| Primary button (main action) | 48 |
| Ice + circle beside it | 50 |
| Search field | 46 |
| Greeting pill, header icon circles | 40 |
| Rating badge | 38 (min width 50) |
| Filter pill, tag | 34 |
| Overlay pill and circle (on photos) | 32 |
| Chip on a collection card | 32 |
| User chip on a photo | 30 |
| Corner rating on a photo / on a thumbnail | 29 / 19 |
| Avatar in a stack | 28 |
| Verified chip | 18 |

Anything tappable needs a 44pt target (the board's "min height 44px"). Controls smaller than that get `hitSlop` to make up the difference.

**Safe areas.** The mockups have no status bar or home indicator. Add safe-area insets on top of every number here. Large titles and the greeting header start about 16pt below the top inset. The place-details hero photo runs up under the status bar, and its overlay controls sit 8pt below the top inset.

## Corner radius

| Token | Value | Used for | theme.ts today |
| ----- | ----- | -------- | -------------- |
| `round` | 999 | Buttons, pills, chips, tags, search field, icon buttons, avatars, overlay controls | ✓ |
| `collection` | 32 | Collection cards | 26 → 32 |
| `card` | 22 | Photo cards, and the photo inside a collection card (measured 20–24) | 18 → 22 |
| `image` | 12 | Post thumbnails, place-row thumbnail, post tile photo | 13 → 12 |
| `rating` | 8 | Rating badges and corner ratings. Rounded rectangles, not pills | 13 → 8 |
| `toast` | 12 | Toast | → add |

The place-details hero is full-bleed with no radius of its own. Only the phone's corners round it.

## Borders and elevation

- **Hairline (1px, `#E7E5E0`)** goes only on white controls sitting directly on the canvas: unselected filter pills, the search field, the Average rating badge and the Verified chip. Never on cards, tags, selected pills, or anything on a photo or a wash.
- **Friends outline (1.5pt rose)** is the only coloured border, which is why your eye lands on it. theme.ts already has this as `borderWidth.ratingBadge`.
- **No drop shadows, anywhere.** Header buttons and the greeting pill are flat white on the canvas, and controls on photos are flat 94% white.
- **Tab bar:** white, with no visible top line. The white bar against the canvas is enough. (theme.ts says `line` goes under the tab bar. The reference doesn't show one.)
- **No dividers between rows or list items.** Space separates them.

## Icons

- **Line icons** come from Feather, through `src/components/ui/icon.tsx`. They have the round-ended 1.5–2pt stroke the boards use. Size 20 in buttons and header circles, 16–18 in overlay pills and action rows, 24 in the tab bar.
- **Colour:** ink when active or primary, muted when inactive or secondary, periwinkle text inside a secondary button or link, white on black.
- **Glyphs** in the reference, as Feather names: `chevron-left` (Back), `share`, `bookmark`, `plus`, `navigation` (distance and Directions), `globe` (Website, and the Map tab), `search`, `home`, `user`, `settings`, `heart`, `message-circle`, `check-circle` (toast). All but one are already in `icon.tsx`, under our own names (`globe` is `website`). → Add `check-circle`. Note that `icon.tsx`'s `map` is Feather's folded map, while the reference's Map tab is a globe.
- **Filled glyphs** only mark "this one": the active tab and a saved bookmark. Feather has no filled icons, so the tab bar keeps SF Symbols through `expo-symbols`, outline when inactive (`house`) and `.fill` when active (`house.fill`).
- **Emoji and flags** are the colourful icons. They go at the start of filter pills ("🌍 All", "🇨🇭 Switzerland", "☕ Coffee"), tags ("❤️ solo", "⛷️ skiers"), category words in meta lines ("☕ cafe") and collection names ("🏔️ Mountains in Italy"). Use `src/utils/tag-emoji.ts` and `src/utils/country-flags.ts`, never an icon in the same spot.

## Photos

- Real, bright travel photography. Photos are the largest thing on the screen.
- Shapes in the reference: place-details hero full-bleed, 267pt tall (about a third of the screen). Feed post 353 × 345 (nearly square). Collection card photo about 152 × 203 (3:4 portrait). Post thumbnails 140pt wide. Post tile photo about 10:7.
- Text on a photo always sits on the scrim, 14pt from the left and bottom edges.
- While loading, show a `fill` placeholder in the same shape and radius so nothing jumps.

## Not in the reference

- **Dark mode.** The palette is light only, but `app.json` sets `userInterfaceStyle: "automatic"`. See the open decisions in [implementation-plan.md](implementation-plan.md).
- **Motion.** Use platform defaults: native screen transitions, and a pressed state at about 70% opacity. Don't invent animations.
- **Loading, empty and error states.** Build them from the same parts: muted 15pt text, a secondary button to retry, `fill` placeholders.
