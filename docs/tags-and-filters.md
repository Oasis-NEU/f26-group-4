# Tags and filters

Where the tag system is, what's been decided, and what's left. Written while
working on "dynamic filters" — people should be able to tag a post with
anything, and tapping a tag should narrow what they're looking at.

## The idea

One growing list of tags. Someone posting a place picks as many as fit —
Hiking, Skating, Bachata, Beaches, Cafes, Biking, Boat Rides, Solo, Romantic,
Adventurous, Unique, Magical — and if the one they want isn't there, they add
it and it exists for everyone from then on.

## Why you can't add a tag today

Three links in a chain, and all three are broken. Worth knowing in this order,
because fixing the first two without the third just loses people's tags
silently.

1. **The picker doesn't offer it.** `SearchTagField` has an `allowNew` prop
   that shows an "Add …" row. Upload's pickers don't set it.

2. **Nothing creates the tag.** `addTag()` in `src/services/tags.ts` exists and
   nothing calls it.

3. **The database drops unknown tags.** This is the real one. In
   `create_review` (`supabase/migrations/20261108190649_core.sql`):

   ```sql
   select coalesce(array_agg(distinct t.slug), '{}') into v_tags
   from public.suited_for_tags t
   join jsonb_array_elements_text(post -> 'suited_for') as picked(value)
     on lower(trim(picked.value)) in (t.slug, lower(t.label));
   ```

   An **inner join**: a tag that isn't already a row doesn't match, so it's
   dropped. No error. The post saves looking fine, minus the tag.

## Decided

| Question | Decision |
| --- | --- |
| One list, or keep "what it is" separate from "how it feels"? | **One big growable list.** Cafes and Romantic live together; a post picks several. |
| Tapping a tag — new page, or filter what you're looking at? | **Filter what you're looking at.** Filters add up: the region you already had stays, and the tag you tapped joins it. An earlier note said "new page", but that's how the old Explore → city page worked and it was deleted for showing the same places as the feed. |
| Tag order | **By how much they're used**, so common tags surface and one-offs sink. |
| Region and distance filters | Region works already (`src/lib/regions.ts`). Distance is wanted but needs the phone's location. |

## Still to do

### Phase 1 — let the list grow

**The order matters.** Turning the UI on before the migration lands is worse
than doing nothing: people would type a tag, see it accepted, post, and lose
it — exactly the silent failure described above, except now we'd have invited
it.

1. **The migration** — `supabase/migrations/20261121211934_growable_suited_for_tags.sql`.
   Written, **not pushed and not tested**: pushing migrations is the tech
   lead's job, and testing needs the local stack (`npx supabase start`, Docker).
   It adds `is_starter` and `created_by` to `suited_for_tags`, an insert
   policy matching the one `interests` already has, an `add_suited_for_tag()`
   function mirroring `add_interest()`, and replaces `create_review()` with
   the same body apart from the tag-collecting block.

2. **Then** `allowNew` on Upload's "Suited for" picker — one prop in
   `src/app/upload.tsx`. Nothing else: with the migration in,
   `create_review()` creates the tag itself, so the app just sends what was
   typed and there's one place that decides what a tag is.

3. **Then** order tags by use. Needs a count of how often each slug appears in
   `places.suited_for` — an aggregate, so it wants its own small migration
   (a view or a function) rather than counting in the app.

### Phase 2 — fold place type into the same list

`places.place_type` is a **required foreign key** to `public.place_types`:
every place has exactly one, and the database rejects anything not in that
table. That's why Cafes can't grow the way Romantic can.

Merging it into the one list means changing a required column on every place,
and `place_type` is used by the feed filters, the Explore tiles
(`src/lib/suggestions.ts` builds "Cafes in France" from it), `place-rows.ts`
and the city tiles. **Worth doing, but it's a proper migration and a team
decision — not a side effect of a UI change.**

### Phase 3 — AI tag suggestions (postponed, keep for later)

> **ISSUE NOTE — suggest tags when someone posts.**
>
> When someone writes a review and adds photos, suggest tags for them rather
> than making them think of the words: read the review text and the photos,
> and offer "Hiking", "Scenic", "Dog friendly" as one-tap chips they can
> accept or ignore.
>
> Why it's worth it: the hard part of a growable tag list is that people don't
> tag things, or everyone invents a slightly different word for the same idea
> ("Cafes" vs "Coffee" vs "Coffee shops"). Suggesting from what they already
> wrote fixes both — it's less work for them, and it steers everyone towards
> the same words.
>
> What it needs: a Supabase Edge Function (the model key must never go in the
> app — see `docs/backend-plan.md`), called after a review is created, writing
> its suggestions back for the poster to confirm. Decide whether suggestions
> apply automatically or need a tap; automatic is tempting and gets wrong tags
> onto places nobody checks.
>
> A cheaper first step that needs no model: when someone types a tag that's
> close to an existing one, offer the existing one first — "did you mean
> Cafes?" — which stops most of the duplicate-word problem on its own.

### Also noted

- **Distance filter.** `expo-location` is installed. Needs the permission
  prompt, and only works for places that have coordinates — `latitude` and
  `longitude` are nullable, and a place without them "just stays off the map".
- **Two slug styles.** `suited_for_tags` has `remote work` with a space;
  `interests` has `street-food` with a dash. Anything comparing the two has to
  know that. A migration joining the tables would fix it — see
  `docs/data-layer.md`, Open decisions.
