// ONE list of tags, used in two places.
//
// WHY THIS FILE EXISTS
//
// A profile has interests. A place has "best suited for" tags. They look like
// two features, but they're the same words describing the same things, and the
// database proves it: `photography` and `adventure` are rows in BOTH
// public.interests and public.suited_for_tags. Same slug, typed twice.
//
// Keeping them apart costs us three things:
//
//   1. A tag someone invents can only ever live on one side. Add "Rooftop
//      bars" as an interest and you still can't tag a rooftop bar with it,
//      because suited_for_tags is a fixed list that only a migration can grow.
//      So the vocabulary can never actually grow where it matters -- on the
//      places people post.
//
//   2. THE MATCH IS THE WHOLE POINT. `Place.algorithmRating` is meant to be
//      "how well does this place suit YOU". That question is only answerable
//      if the words on a person and the words on a place come from one list:
//      you count how many of someone's interests appear in a place's
//      suited_for. Two lists means comparing `photography` to `photography`
//      works by luck, and `street-food` to nothing at all.
//
//   3. The two don't even agree on how to write a slug. suited_for_tags has
//      `remote work` with a space; interests has `street-food` with a dash.
//      Any comparison between them has to know that, which is a bug waiting
//      to happen in whichever file forgets.
//
// So this file presents them as one vocabulary, and everything that asks a
// person or a place "what is this about?" reads from here.
//
// WHAT THIS DOESN'T DO
//
// It doesn't merge the tables. public.interests has uuid ids that
// profile_interests points at; public.suited_for_tags is keyed by slug and
// places.suited_for stores those slugs in a text[]. Merging them is a
// migration, and migrations are a team decision -- see docs/data-layer.md,
// "Open decisions". Until then this reads both, lines them up by slug, and
// writes new tags to public.interests (the growable one). That works today
// because places.suited_for has no foreign key: a slug that only exists in
// interests can still be put on a place.
//
// Place types are deliberately NOT part of this vocabulary. What a place IS
// (cafe, museum, ski run) is a different question from who it suits, and
// places.place_type is a real foreign key to public.place_types, so that list
// can only grow by migration. They're here as a read-only kind so screens have
// one place to ask.

import { supabase } from '@/lib/supabase';

// 'interest' is the shared list: a profile's interests AND a place's
// "suited for". 'place-type' is the separate, fixed list.
export type TagKind = 'interest' | 'place-type';

export type Tag = {
  slug: string; // 'photography' -- what gets stored on a place
  label: string; // 'Photography' -- what people see
  kind: TagKind;

  // Set when this tag is a row in public.interests. Attaching a tag to a
  // PROFILE needs this id; attaching one to a place only needs the slug. A
  // tag that's only in suited_for_tags has no id until someone adds it as an
  // interest, which addTag() does.
  interestId?: string;

  isStarter: boolean; // part of the built-in list vs. made by someone
  userCount: number; // how many profiles picked it; 0 for place-only tags
};

// Turns 'remote work' or 'Street Food' into a comparable key. Written here
// rather than imported so the two tables' different spellings both land in the
// same place -- see point 3 at the top.
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Nicely capitalised words for a slug that has no label of its own.
function labelFromSlug(slug: string): string {
  const words = slug.split('-').filter((word) => word !== '');

  if (words.length === 0) {
    return slug;
  }

  const first = words[0];
  const rest = words.slice(1);

  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(' ');
}

// The shared list: every interest, plus every suited-for tag that isn't
// already one of them.
async function getPeopleTags(): Promise<Tag[]> {
  const [interests, suitedFor] = await Promise.all([
    supabase.from('interests').select('id, name, slug, is_starter, user_count'),
    supabase.from('suited_for_tags').select('slug, label, sort_order').order('sort_order'),
  ]);

  if (interests.error) throw interests.error;
  if (suitedFor.error) throw suitedFor.error;

  const tags: Tag[] = [];
  const slugsSeen: string[] = [];

  for (const row of interests.data) {
    const slug = slugify(row.slug);
    tags.push({
      slug,
      label: row.name,
      kind: 'interest',
      interestId: row.id,
      isStarter: row.is_starter,
      userCount: row.user_count ?? 0,
    });
    slugsSeen.push(slug);
  }

  // The same tag in both tables is ONE tag. The interests row wins, because
  // it's the one with an id a profile can point at.
  for (const row of suitedFor.data) {
    const slug = slugify(row.slug);

    if (slugsSeen.includes(slug)) {
      continue;
    }

    tags.push({
      slug,
      label: row.label ?? labelFromSlug(slug),
      kind: 'interest',
      isStarter: true,
      userCount: 0,
    });
    slugsSeen.push(slug);
  }

  // Most-used first, then alphabetically so the order doesn't wobble.
  tags.sort((a, b) => {
    if (b.userCount !== a.userCount) {
      return b.userCount - a.userCount;
    }
    return a.label.localeCompare(b.label);
  });

  return tags;
}

// The fixed list of what a place IS.
async function getPlaceTypeTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('place_types')
    .select('slug, label, sort_order')
    .order('sort_order');
  if (error) throw error;

  return data.map((row) => ({
    slug: row.slug,
    label: row.label ?? labelFromSlug(row.slug),
    kind: 'place-type' as const,
    isStarter: true,
    userCount: 0,
  }));
}

// Every tag of one kind.
export async function getTags(kind: TagKind): Promise<Tag[]> {
  return kind === 'place-type' ? getPlaceTypeTags() : getPeopleTags();
}

// Tags whose label matches what's been typed. Ones that START with it come
// first, so typing "ca" offers "Cafe" before "Vatican City"-shaped matches.
export async function searchTags(kind: TagKind, query: string): Promise<Tag[]> {
  const tags = await getTags(kind);
  const text = query.trim().toLowerCase();

  if (text === '') {
    return tags;
  }

  const startsWith: Tag[] = [];
  const contains: Tag[] = [];

  for (const tag of tags) {
    const label = tag.label.toLowerCase();

    if (label.startsWith(text)) {
      startsWith.push(tag);
    } else if (label.includes(text)) {
      contains.push(tag);
    }
  }

  return [...startsWith, ...contains];
}

// Adds a tag someone typed, or gives back the one that's already there.
//
// It always writes to public.interests, the growable table, through the
// database's add_interest() -- which does the same slug check, so "Street
// Food" and "street food" can't become two tags. The new tag can be put on a
// place straight away, because places.suited_for is a plain text[] of slugs.
export async function addTag(name: string): Promise<Tag> {
  const trimmed = name.trim();

  if (trimmed === '') {
    throw new Error('A tag needs a name.');
  }

  const { data, error } = await supabase.rpc('add_interest', { interest_name: trimmed }).single();
  if (error) throw error;

  const row = data as { id: string; name: string; slug: string; is_starter: boolean };

  return {
    slug: slugify(row.slug),
    label: row.name,
    kind: 'interest',
    interestId: row.id,
    isStarter: row.is_starter,
    userCount: 1, // whoever made it is the first to use it
  };
}
