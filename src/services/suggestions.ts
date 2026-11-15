// The tiles across the top of Explore: "Hikes in France", "Food in Japan",
// "Adventure in Spain".
//
// A tile is a SHORTCUT, not a page. Tapping one filters the feed underneath to
// the places it stands for; tapping it again clears it.
//
// Each tile is a set of CollectionRules -- the same type a collection uses to
// decide what belongs in it. That's deliberate: a tile and a collection are
// both answering "which places does this stand for?", so they share one
// matching function (src/lib/collection-rules.ts) and one way of writing
// themselves out in words. It's also what lets a tile say "in Europe" without
// anything here knowing which countries those are.
//
// RIGHT NOW the tiles are worked out from the places we have: every
// combination of a kind of place (or a vibe) with a country that has at least
// one of them, most places first. So they're always worth tapping -- a tile
// never leads to an empty feed.
//
// LATER they should be picked for the person looking at them. See
// getSuggestions() at the bottom for what that needs.

import { mockRequest } from './mock-backend';
import { mockPlaces } from './places';

import { describeRules } from '@/lib/collection-rules';
import type { CollectionRules } from '@/types/collection';
import type { Place } from '@/types/place';

// One tile. Nothing stores these -- they're worked out from the places.
export type Suggestion = {
  id: string;
  title: string; // "Hikes in France" -- written from the rules, not typed in
  rules: CollectionRules; // what tapping it filters the feed to
  coverImage: string;
  placeCount: number;

  // What the theme is built on. Only used for ordering: "Cafes in France"
  // reads more like something you'd tap than "Skiers in France", so a kind of
  // place wins a tie against a vibe.
  kind: 'place-type' | 'vibe';
};

// How many tiles to show. The row scrolls sideways, but a row that never ends
// is its own kind of useless.
const MAX_SUGGESTIONS = 12;

// A group of places that share a theme, while it's being built up.
type Group = {
  rules: CollectionRules;
  kind: 'place-type' | 'vibe';
  places: Place[];
};

// Adds a place to the group with this key, starting the group if it's new.
function addToGroup(
  groups: Map<string, Group>,
  key: string,
  rules: CollectionRules,
  kind: 'place-type' | 'vibe',
  place: Place,
) {
  const existing = groups.get(key);

  if (existing === undefined) {
    groups.set(key, { rules, kind, places: [place] });
    return;
  }

  existing.places.push(place);
}

// Every theme the places we have suggest, as groups.
function buildGroups(): Map<string, Group> {
  const groups = new Map<string, Group>();

  for (const place of mockPlaces) {
    // "Cafes in France" -- a kind of place, somewhere.
    addToGroup(
      groups,
      `type:${place.placeType}:${place.country}`,
      { placeTypes: [place.placeType], countries: [place.country] },
      'place-type',
      place,
    );

    // "Adventure in France" -- a vibe, somewhere. A place has several of
    // these, so it can turn up under more than one tile. That's fine: they're
    // shortcuts, not folders.
    for (const tag of place.suitedFor) {
      addToGroup(
        groups,
        `vibe:${tag}:${place.country}`,
        { vibes: [tag], countries: [place.country] },
        'vibe',
        place,
      );
    }
  }

  return groups;
}

// The best-rated place in a group, whose photo the tile uses -- so a tile
// always shows the theme at its best rather than whichever place happened to
// be added first.
function bestRated(places: Place[]): Place {
  let best = places[0];

  for (const place of places) {
    if (place.averageRating > best.averageRating) {
      best = place;
    }
  }

  return best;
}

// The tiles, best first.
//
// TODO: PERSONALISE THIS. The order is "most places first", which is the best
// we can do without knowing who's looking. Once there's a signed-in user
// (Phase 1 in docs/data-layer.md), it should rank by what they're into:
//
//   - A profile's interests and a place's `suitedFor` tags are the SAME list
//     of tags (see src/services/interests.ts), so they can be compared
//     directly -- someone whose interests include Hiking should see
//     "Hikes in ..." near the front.
//   - Their saved places say where they're interested in, so countries they've
//     saved from should come first.
//   - `profiles.current_country` and their trip goals in settings are worth
//     weighting too.
//
// Only this function changes when that happens. The tile, the row and the feed
// don't care how the order was decided.
export async function getSuggestions(): Promise<Suggestion[]> {
  const groups = buildGroups();
  const suggestions: Suggestion[] = [];
  const titlesUsed: string[] = [];

  for (const [key, group] of groups) {
    const title = describeRules(group.rules);

    // Two different groups can describe themselves the same way. Keep the
    // first; a row with the same words on two tiles just looks broken.
    if (titlesUsed.includes(title)) {
      continue;
    }

    titlesUsed.push(title);

    suggestions.push({
      id: key,
      title,
      rules: group.rules,
      coverImage: bestRated(group.places).coverImage,
      placeCount: group.places.length,
      kind: group.kind,
    });
  }

  // Most places first; a kind of place beats a vibe when they tie; then
  // alphabetical, so the row doesn't shuffle itself between loads.
  suggestions.sort((a, b) => {
    if (b.placeCount !== a.placeCount) {
      return b.placeCount - a.placeCount;
    }

    if (a.kind !== b.kind) {
      return a.kind === 'place-type' ? -1 : 1;
    }

    return a.title.localeCompare(b.title);
  });

  return mockRequest(suggestions.slice(0, MAX_SUGGESTIONS));
}
