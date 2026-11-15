# Design reference

These are the screens and components the team picked as the look for Oasis, written down so anyone (including an AI agent) can build a screen that matches them. There are two boards: three finished phone screens, and a sheet of components. Both are cut into sections in [reference/](reference/), and the files below turn them into rules and numbers.

| File | What's in it |
| ---- | ------------ |
| [tokens.md](tokens.md) | Colour, type, spacing, corner radius, borders, icons, photos. Measured values, and how each compares with `src/theme.ts` today |
| [components.md](components.md) | Every component on the boards: crops, measurements, states, and which file in `src/components/` builds it |
| [screens.md](screens.md) | The three reference screens top to bottom, and how to carry the style to screens the boards don't show |
| [implementation-plan.md](implementation-plan.md) | The order to bring the app in line with the reference, and the decisions the team still has to make |

Nothing here has been applied to the code yet. Until it is, the app and these images disagree in the ways tokens.md and components.md list.

## Which wins

1. **The reference images say what it should look like.**
2. **`src/theme.ts` and `src/components/ui/` are how we build it.** Use their tokens and primitives. Never type a hex code, font size or radius into a screen.
3. **Where the code and the images disagree, the images win, but not in passing.** Changing a token or a primitive restyles every screen that uses it, so each change is its own step in implementation-plan.md. If your task is one screen, build it with today's tokens and primitives, and mention any gap you hit.

## How to use this (agents start here)

1. Read the ten rules below.
2. Find your screen or component in the image index and open its crops. Screens are 1x: the phone is 390px wide, the width of a 390pt iPhone, so 1px ≈ 1pt. The `@2x` details are the same pixels, doubled so small text is easier to read.
3. Read its section in [screens.md](screens.md) or [components.md](components.md) for measurements and states.
4. Build it with theme tokens and `src/components/ui/` primitives. If a primitive you need doesn't exist yet, components.md says what it should be.
5. Compare with the crop. Run the app on a 390pt-wide device (iPhone 13, 14, 15 or 16), take a screenshot, and put it next to the crop. Check the canvas colour, page margins, corner radii and type sizes first. Those four are what make it look like this style.
6. Run `npx expo lint` and `npx tsc --noEmit`.

## The style in one paragraph

A warm paper-white canvas, near-black ink, and big photos doing most of the talking. Colour is kept for identity (collections, tags, ratings, friends) and comes as soft pastel washes rather than solid brand blocks. Anything you can tap is a full pill or a circle, and cards are big and soft. Headlines are heavy and tight, body text is calm. Emoji and flags are the colourful icons, while line icons stay thin and monochrome. There are no drop shadows. Things look separate because they're white on paper, colour on paper, or outlined with a hairline.

## The style in ten rules

1. **Paper, then white.** The canvas is warm off-white `#FBF9F5`. Anything that needs a surface (search field, unselected pills, rating badges, header buttons, the tab bar) is pure white on top of it.
2. **Black means on.** Ink `#0C0C0C` is the only colour for primary and selected: the main button, the selected filter pill, the active tab, a switch that's on, the toast.
3. **Colour means identity.** Rose, butter, ice and periwinkle say *what something is* (a collection, a tag, whose rating, which friend), never *what state it's in*. The only coloured button is the pale periwinkle secondary.
4. **Round or circular.** Buttons, pills, chips, tags, search fields, avatars and icon buttons are fully round. Only cards (22pt, collections 32pt), thumbnails (12pt), rating badges (8pt) and the toast (12pt) have corner radii.
5. **Photos lead.** Photos are large and rounded. Text on a photo is white, over a scrim that fades in from the bottom and is tinted indigo. Controls on a photo are 94% white pills and circles.
6. **The star carries the colour.** Rating badges are white or pale ice, never a strong colour. The star is grey (everyone), pink (friends) or blue (for you).
7. **Hairlines, never shadows.** A 1px warm hairline `#E7E5E0` outlines white controls that sit on the canvas. The Friends rating has the only coloured outline. Nothing has a drop shadow.
8. **Heavy, tight headlines and calm body.** Screen titles are 32pt ExtraBold with tight letter-spacing, place names 22pt, section headings 16pt Bold, body 15/22 Regular, and secondary text is grey. Everything is in sentence case.
9. **Emoji lead, icons whisper.** Filter pills, tags, categories and collection names start with an emoji or a flag. Line icons have a 1.5–2pt round-ended stroke, in ink or grey. They're periwinkle only inside secondary buttons and links, and white only on black.
10. **Room to breathe.** 18pt page margins, 24–28pt between sections, 12pt between stacked cards, 6–8pt between pills.

## Image index

The board annotations are part of the spec. Buttons: "full round · min height 44px". Overlay controls: "sit on photography". Ratings: "never on a colour fill · the star carries the colour", meaning the badge stays white or pale and the star is the coloured part. The small monospace capitals the annotations are set in are only for the boards, not app UI.

### Screens (1x, 1px ≈ 1pt)

| Crop | Shows | Plan |
| ---- | ----- | ---- |
| [place-details.png](reference/screens/place-details.png) | Hero photo with overlay controls, title with Verified chip and three ratings, friends who saved it, links, tags, AI summary, Save to collection, posts | [04-place-details.md](../pages/04-place-details.md) |
| [saved-collections.png](reference/screens/saved-collections.png) | Large title, search, country filters, collection cards, tab bar | [05-saved-collections.md](../pages/05-saved-collections.md) |
| [feed.png](reference/screens/feed.png) | Greeting header, display headline, category filters, photo post with actions and caption, tab bar | [02-feed.md](../pages/02-feed.md) |

### Components (from the component sheet)

Use these for anatomy, colour and states. Components on the sheet are drawn 10–30% bigger than they appear in the screens, so take sizes from the screens unless a component only appears here.

| Crop | Shows |
| ---- | ----- |
| [buttons.png](reference/components/buttons.png) | Primary (black), secondary (pale periwinkle) and link buttons |
| [overlay-controls.png](reference/components/overlay-controls.png) | Back pill, share / bookmark / add circles and distance pill. They go on photos, and are shown here on white |
| [filters-and-tags.png](reference/components/filters-and-tags.png) | Filter pills, selected and not, and tag pills |
| [ratings.png](reference/components/ratings.png) | Average, Friends and For you rating badges |
| [cards.png](reference/components/cards.png) | Photo card and collection card |
| [place-row-and-post.png](reference/components/place-row-and-post.png) | Place row and post tile |
| [navigation-icons.png](reference/components/navigation-icons.png) | The line icon set with labels |
| [field-toggle-feedback.png](reference/components/field-toggle-feedback.png) | Search field, toggle row and toast |

### Details (screens enlarged 2x)

| Crop | Shows |
| ---- | ----- |
| [place-details-hero@2x.png](reference/details/place-details-hero@2x.png) | Hero photo and its overlay controls |
| [place-details-header@2x.png](reference/details/place-details-header@2x.png) | Title, Verified chip, rating trio, location line, avatar stack, links |
| [place-details-body@2x.png](reference/details/place-details-body@2x.png) | Best suited for (tags) and Summary |
| [place-details-actions@2x.png](reference/details/place-details-actions@2x.png) | Save to collection, the + circle, and the Posts strip |
| [saved-header@2x.png](reference/details/saved-header@2x.png) | Large title, search field, filter pills, section heading |
| [saved-collection-card@2x.png](reference/details/saved-collection-card@2x.png) | One collection card |
| [feed-header@2x.png](reference/details/feed-header@2x.png) | Greeting pill, header buttons, display headline, filter pills |
| [feed-post@2x.png](reference/details/feed-post@2x.png) | Photo post: user chip, rating, title on scrim, action row, caption |
| [tab-bar@2x.png](reference/details/tab-bar@2x.png) | Tab bar with Saved active |

### Originals

[screens-board.webp](reference/originals/screens-board.webp) and [components-board.webp](reference/originals/components-board.webp) are the boards as we received them, kept whole in case a crop cut something off.

## What the boards don't cover

The boards show one light theme, one phone width and the happy path. They say nothing about dark mode, motion, loading, empty or error states, keyboards, or tablets. Where you need one of those, use the closest pattern that is here, keep to the rules above, and say in your PR that you extended the style. [screens.md](screens.md#screens-without-a-reference) has suggestions for the pages that aren't drawn.
