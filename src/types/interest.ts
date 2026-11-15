// A tag. Two things use them, and they're the SAME list on purpose:
//
//   - a profile's interests        "Hiking", "Coffee"
//   - a place's "best suited for"  "Hiking", "Solo"
//
// Keeping one vocabulary means a tag someone invents when they post a place
// also shows up as an interest other people can pick, and it's what lets the
// app say "your interests line up with this place" later on (Place.algorithmRating).
//
// `kind` tells the two sorts apart:
//   'interest'   -- interests AND "best suited for". One list, used two ways.
//   'place-type' -- what the place IS: cafe, museum, ski run. A different
//                   question from who it suits, so a separate list.
//
// NOTE: the file is still called interest.ts because the Profile pages import
// `Interest` from here. `Tag` below is the same type under a better name --
// use it in new code. Renaming the file is a tidy-up for whoever owns Profile.

export type TagKind = 'interest' | 'place-type';

export type Interest = {
  id: string;
  name: string; // "Rooftop bars"
  slug: string; // "rooftop-bars" -- lowercase, spaces to dashes; catches duplicates
  kind: TagKind; // which list this belongs to
  createdBy?: string; // user id who made it; missing for the starter list
  isStarter: boolean; // part of the built-in starter list vs. user-made
  userCount: number; // how many profiles or places have used it
};

// The better name for the same thing. New code should use this.
export type Tag = Interest;
