// A few real photos for a city, for the "Dream trip" cover option (see
// EditCoverPanel / ProfileCover). Called from the app as
// supabase.functions.invoke('destination-photo', { body: { cityId } }).
//
// Pixabay's API key lives only here, as the PIXABAY_API_KEY secret
// (`supabase secrets set`, or supabase/functions/destination-photo/.env for
// local `supabase functions serve` -- gitignored, never committed). The app
// never sees it, and only ever gets back photo URLs.
//
// Takes a cityId rather than a free-text search, and looks the city up in
// our own table, so a signed-in user can only ever search for a real city in
// the app -- not use this as an open, unlimited proxy onto Pixabay's API.
//
// withSupabase({ auth: 'user' }) only runs this for a signed-in user.

import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

const PHOTOS_PER_CITY = 3;

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    let cityId: unknown;
    try {
      ({ cityId } = await req.json());
    } catch {
      return Response.json({ error: 'Expected a JSON body with cityId.' }, { status: 400 });
    }
    if (typeof cityId !== 'string' || !cityId) {
      return Response.json({ error: 'cityId is required.' }, { status: 400 });
    }

    const { data: city, error: cityError } = await ctx.supabaseAdmin
      .from('cities')
      .select('name, country')
      .eq('id', cityId)
      .maybeSingle();
    if (cityError) {
      console.error('destination-photo: city lookup failed', cityError);
      return Response.json({ error: "Couldn't look up that city." }, { status: 500 });
    }
    if (!city) {
      return Response.json({ error: 'Unknown city.' }, { status: 404 });
    }

    const apiKey = Deno.env.get('PIXABAY_API_KEY');
    if (!apiKey) {
      console.error('destination-photo: PIXABAY_API_KEY is not set');
      return Response.json({ error: 'Photo search is not configured.' }, { status: 500 });
    }

    const params = new URLSearchParams({
      key: apiKey,
      q: `${city.name} ${city.country}`,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: 'true',
      per_page: String(PHOTOS_PER_CITY),
    });

    try {
      const response = await fetch(`https://pixabay.com/api/?${params}`);
      if (!response.ok) {
        console.error('destination-photo: Pixabay returned', response.status, await response.text());
        return Response.json({ error: "Couldn't reach the photo service." }, { status: 502 });
      }

      const result = await response.json();
      const photos: string[] = (result.hits ?? []).map((hit: { webformatURL: string }) => hit.webformatURL);
      return Response.json({ photos });
    } catch (error) {
      console.error('destination-photo: Pixabay request failed', error);
      return Response.json({ error: "Couldn't reach the photo service." }, { status: 502 });
    }
  }),
};
